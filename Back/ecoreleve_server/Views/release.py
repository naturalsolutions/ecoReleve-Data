from pyramid.view import view_config
from ..Models import (
    DBSession,
    Individual,
    Station,
    Observation,
    ProtocoleType,
    Sensor,
    Equipment,
    IndividualList,
    ErrorAvailable
    )
from ..GenericObjets.FrontModules import FrontModules
from ..GenericObjets import ListObjectWithDynProp
import transaction
import json, itertools
from datetime import datetime
import datetime as dt
import pandas as pd
import numpy as np
from sqlalchemy import select, and_,cast, DATE,func,desc,join, text
from sqlalchemy.orm import aliased
from pyramid.security import NO_PERMISSION_REQUIRED
from traceback import print_exc
from collections import OrderedDict
import pandas as pd
from collections import Counter

prefix = 'release/'

@view_config(route_name= prefix+'individuals/action', renderer='json', request_method = 'GET')
def actionOnStations(request):
    dictActionFunc = {
    # 'count' : count_,
    'getFields': getFields,
    'getFilters': getFilters,
    'getReleaseMethod':getReleaseMethod
    }
    actionName = request.matchdict['action']
    return dictActionFunc[actionName](request)

def getFilters (request):
    ModuleType = 'IndivReleaseGrid'
    filtersList = Individual().GetFilters(ModuleType)
    filters = {}
    for i in range(len(filtersList)) :
        filters[str(i)] = filtersList[i]
    transaction.commit()
    return filters

def getFields(request):
    ModuleType = request.params['name']
    if ModuleType == 'default' :
        ModuleType = 'IndivReleaseGrid'
    cols = Individual().GetGridFields('IndivReleaseGrid')
    cols.append({
        'name': 'unicSensorName',
        'label': '| Sensor',
        'editable': False,
        'renderable': True,
        'cell' : 'string'
        })
    cols.append({
        'name': 'FK_Sensor',
        'label': '| FK_Sensor',
        'editable': False,
        'renderable': False,
        'cell' : 'string'
        })
    cols.append({
        'name' :'import',
        'label' : 'import',
        'renderable': True,
        'editable': True,
        'cell' : 'select-row',
        'headerCell': 'select-all'
        })
    return cols

def getReleaseMethod(request):
    session = request.dbsession

    query = text("""SELECT TTop_FullPath as val, TTop_Name as label"""
        +""" FROM THESAURUS.dbo.TTopic th 
        JOIN [ModuleForms] f on th.TTop_ParentID = f.Options
        where Name = 'release_method' """)
    result = session.execute(query).fetchall()
    return [dict(row) for row in result]

@view_config(route_name= prefix+'individuals', renderer='json', request_method = 'GET')
def searchIndiv(request):
    session = request.dbsession
    data = request.params.mixed()

    searchInfo = {}
    searchInfo['criteria'] = []
    if 'criteria' in data: 
        data['criteria'] = json.loads(data['criteria'])
        if data['criteria'] != {} :
            searchInfo['criteria'] = [obj for obj in data['criteria'] if obj['Value'] != str(-1) ]

    try:
        searchInfo['order_by'] = json.loads(data['order_by'])
    except:
        searchInfo['order_by'] = ['ID:desc']
    criteria = [
    {
    'Column': 'LastImported',
    'Operator' : '=',
    'Value' : True
    }]
    searchInfo['criteria'].extend(criteria)

    ModuleType = 'IndivReleaseGrid'
    moduleFront  = session.query(FrontModules).filter(FrontModules.Name == ModuleType).one()
    listObj = IndividualList(moduleFront)
    dataResult = listObj.GetFlatDataList(searchInfo)

    countResult = listObj.count(searchInfo)
    result = [{'total_entries':countResult}]
    result.append(dataResult)

    return result


@view_config(route_name= prefix+'individuals', renderer='json', request_method = 'POST')
def releasePost(request):
    session = request.dbsession
    data = request.params.mixed()
    sta_id = int(data['StationID'])
    indivList = json.loads(data['IndividualList'])
    releaseMethod = data['releaseMethod']
    taxon = indivList[0]['Species']
    curStation = session.query(Station).get(sta_id)

    taxons = dict(Counter(indiv['Species'] for indiv in indivList))
    def getnewObs(typeID):
        return Observation(FK_ProtocoleType=typeID)

    protoTypes = pd.DataFrame(session.execute(select([ProtocoleType])).fetchall(), columns = ProtocoleType.__table__.columns.keys())
    vertebrateGrpID = int(protoTypes.loc[protoTypes['Name'] == 'Vertebrate group','ID'].values[0])
    vertebrateIndID = int(protoTypes.loc[protoTypes['Name'] == 'Vertebrate individual','ID'].values[0])
    biometryID = int(protoTypes.loc[protoTypes['Name'] == 'Bird Biometry','ID'].values[0])
    releaseGrpID = int(protoTypes.loc[protoTypes['Name'] == 'Release Group','ID'].values[0])
    releaseIndID = int(protoTypes.loc[protoTypes['Name'] == 'Release Individual','ID'].values[0])
    equipmentIndID = int(protoTypes.loc[protoTypes['Name'] == 'Individual equipment','ID'].values[0])

    vertebrateIndList = []
    biometryList = []
    releaseIndList = []
    equipmentIndList = []

    binaryDict = {
    9: 'nb_adult_indeterminate',
    10: 'nb_adult_male',
    12: 'nb_adult_female',
    17: 'nb_juvenile_indeterminate',
    18: 'nb_juvenile_male',
    20: 'nb_juvenile_female',
    33: 'nb_indeterminate',
    36: 'nb_indeterminate',
    34: 'nb_indeterminate'
    }

    def MoF_AoJ(obj):
        #### binary ponderation female : 4, male :2 , indeterminateSex : 1, adult:8, juvenile : 16, indeterminateAge : 32
        curSex = None
        curAge = None
        binP = 0
        if obj['Sex'] is not None and obj['Sex'].lower() == 'male':
            curSex = 'male'
            binP += 2
        elif obj['Sex'] is not None and obj['Sex'].lower() == 'female':
            curSex = 'female'
            binP += 4
        else : 
            curSex == 'Indeterminate'
            binP += 1

        if obj['Age'] is not None and obj['Age'].lower() == 'Adult':
            curAge = 'Adult'
            binP += 8
        elif obj['Age'] is not None and obj['Age'].lower() == 'juvenile':
            curAge = 'Juvenile'
            binP += 16
        else : 
            curAge == 'Indeterminate'
            binP += 32
        return binaryDict[binP]

    try:
        errorEquipment = None
        binList = []
        for indiv in indivList: 
            curIndiv = session.query(Individual).get(indiv['ID'])
            curIndiv.LoadNowValues()
            curIndiv.UpdateFromJson(indiv)

            binList.append(MoF_AoJ(indiv))
            for k in indiv.keys():
                v = indiv.pop(k)
                k = k.lower()
                indiv[k] = v

            indiv['FK_Individual'] = indiv['id']
            indiv['FK_Station'] = sta_id
            try : 
                indiv['taxon'] = indiv['species']
            except: 
                indiv['taxon'] = indiv['Species']
                pass
            try:
                indiv['weight'] = indiv['poids']
            except: 
                indiv['weight'] = indiv['Poids']
                pass
            try: 
                del indiv['Comments']
            except: 
                pass

            curVertebrateInd = getnewObs(vertebrateIndID)
            curVertebrateInd.UpdateFromJson(indiv)
            vertebrateIndList.append(curVertebrateInd)

            curBiometry = getnewObs(biometryID)
            curBiometry.UpdateFromJson(indiv)
            biometryList.append(curBiometry)

            curReleaseInd = getnewObs(releaseIndID)
            curReleaseInd.UpdateFromJson(indiv)
            releaseIndList.append(curReleaseInd)

            try:
                # indiv['FK_Sensor'] = int(indiv['fk_sensor'])
                curEquipmentInd = getnewObs(equipmentIndID)
                equipInfo = {
                'FK_Individual': indiv['FK_Individual'],
                'FK_Sensor' : int(indiv['fk_sensor']),
                'Survey_type' : 'Post-Relâcher',
                'Monitoring_Status' : 'Suivi',
                'Sensor_Status': 'événement de sortie provisoire de stock>mise en service'
                }
                curEquipmentInd.UpdateFromJson(equipInfo)
                curEquipmentInd.Station = curStation
                equipmentIndList.append(curEquipmentInd)
            except Exception as e:
                if e.__class__.__name__ == 'ErrorAvailable':
                    sensor_available = 'is' if e.value['sensor_available'] else 'is not'
                    tpl = 'SensorID {0} {1} available for equipment'.format(equipInfo['FK_Sensor'],sensor_available)
                    if errorEquipment is None:
                        errorEquipment = tpl
                    else:
                        errorEquipment += ',   '+tpl
                pass

        vertebrateGrp = Observation(FK_ProtocoleType=vertebrateGrpID, FK_Station =sta_id )
        dictVertGrp = dict(Counter(binList))
        dictVertGrp['taxon'] = taxon
        dictVertGrp['nb_total'] = len(releaseIndList)
        
        vertebrateGrp.UpdateFromJson(dictVertGrp)
        vertebrateGrp.Observation_children.extend(vertebrateIndList)

        releaseGrp = Observation(FK_ProtocoleType=releaseGrpID, FK_Station =sta_id)
        releaseGrp.PropDynValuesOfNow={}
        releaseGrp.UpdateFromJson({'taxon':taxon, 'release_method':releaseMethod})
        releaseGrp.Observation_children.extend(releaseIndList)


        if errorEquipment is not None:
            session.rollback()
            request.response.status_code = 510
            message = errorEquipment

        else: 
            session.add(vertebrateGrp)
            session.add(releaseGrp)
            session.add_all(biometryList)
            session.add_all(equipmentIndList)

            message = {'release':len(releaseIndList)}

    except Exception as e :
        session.rollback()
        message = e.value

    return message