from pyramid.view import view_config
from ..Models import (
    DBSession,
    Individual,
    Station,
    Observation,
    ProtocoleType,
    Sensor,
    Equipment,
    IndividualList
    )
from ecoreleve_server.GenericObjets.FrontModules import FrontModules
from ecoreleve_server.GenericObjets import ListObjectWithDynProp
import transaction
import json, itertools
from datetime import datetime
import datetime as dt
import pandas as pd
import numpy as np
from sqlalchemy import select, and_,cast, DATE,func,desc,join
from sqlalchemy.orm import aliased
from pyramid.security import NO_PERMISSION_REQUIRED
from traceback import print_exc
from collections import OrderedDict
import pandas as pd
from collections import Counter

prefix = 'release/'

@view_config(route_name= prefix+'individuals/action', renderer='json', request_method = 'GET', permission = NO_PERMISSION_REQUIRED)
def actionOnStations(request):
    print ('\n*********************** Action **********************\n')
    dictActionFunc = {
    # 'count' : count_,
    'getFields': getFields,
    'getFilters': getFilters
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

def getFields(request) :

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
    
    transaction.commit()
    return cols

@view_config(route_name= prefix+'individuals', renderer='json', request_method = 'GET', permission = NO_PERMISSION_REQUIRED)
def searchIndiv(request):
    data = request.params.mixed()
    print('*********data*************')
    print(data)
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
    moduleFront  = DBSession.query(FrontModules).filter(FrontModules.Name == ModuleType).one()
    listObj = IndividualList(moduleFront)
    dataResult = listObj.GetFlatDataList(searchInfo)

    countResult = listObj.count(searchInfo)
    result = [{'total_entries':countResult}]
    result.append(dataResult)
    transaction.commit()
    return result


@view_config(route_name= prefix+'individuals', renderer='json', request_method = 'POST', permission = NO_PERMISSION_REQUIRED)
def releasePost(request):

    data = request.params.mixed()
    sta_id = int(data['StationID'])
    indivList = json.loads(data['IndividualList'])
    releaseMethod = data['releaseMethod']
    releaseMethod = None
    taxon = indivList[0]['Species']
    curStation = DBSession.query(Station).get(sta_id)


    def getnewObs(typeID):
        return Observation(FK_ProtocoleType=typeID)

    protoTypes = pd.DataFrame(DBSession.execute(select([ProtocoleType])).fetchall(), columns = ProtocoleType.__table__.columns.keys())
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

    binList = []

    for indiv in indivList: 
        curIndiv = DBSession.query(Individual).get(indiv['ID'])
        curIndiv.LoadNowValues()
        curIndiv.UpdateFromJson(indiv)

        binList.append(MoF_AoJ(indiv))
        for k in indiv.keys():
            v = indiv.pop(k)
            k = k.lower()
            indiv[k] = v
        
        print(indiv)
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
        
        # here add info for Vetebrate individual protocol
        # print('\n\n########### Vetebrate individual protocol')
        curVertebrateInd = getnewObs(vertebrateIndID)
        curVertebrateInd.UpdateFromJson(indiv)
        vertebrateIndList.append(curVertebrateInd)
        # print('FK_Individual : '+str(curVertebrateInd.FK_Individual))
        # print(curVertebrateInd.PropDynValuesOfNow)

        # here add info for Bird Biometry protocol
        # print('\n\n########### Bird Biometry protocol')
        curBiometry = getnewObs(biometryID)
        curBiometry.UpdateFromJson(indiv)
        # print('FK_Individual : '+str(curVertebrateInd.FK_Individual))
        # print(curBiometry.PropDynValuesOfNow)
        biometryList.append(curBiometry)

        # here add info for Release Individual protocol
        # print('\n\n########### Release Individual protocol')
        curReleaseInd = getnewObs(releaseIndID)
        curReleaseInd.UpdateFromJson(indiv)
        releaseIndList.append(curReleaseInd)
        # print('FK_Individual : '+str(curVertebrateInd.FK_Individual))
        # print(curReleaseInd.PropDynValuesOfNow)

        # print('\n\n########### Individual equipment protocol')
        # here add info for Individual Equipment protocol

        try:
                indiv['sensor_id'] = int(indiv['fk_sensor'])
                indiv['deploy'] = True
                curEquipmentInd = getnewObs(equipmentIndID)
                curEquipmentInd.UpdateFromJson(indiv)
                curEquipmentInd.Station = curStation
                equipmentIndList.append(curEquipmentInd)
        except Exception as e:
            print_exc()
            continue

    vertebrateGrp = Observation(FK_ProtocoleType=vertebrateGrpID)
    releaseGrp = Observation(FK_ProtocoleType=releaseGrpID)

    dictVertGrp = dict(Counter(binList))
    dictVertGrp['taxon'] = taxon
    # print('\n\n########### Vetebrate Group protocol')
    vertebrateGrp.UpdateFromJson(dictVertGrp)
    # print(vertebrateGrp.PropDynValuesOfNow)
    
    releaseGrp.UpdateFromJson({'taxon':taxon, 'release_method':releaseMethod})
    # print('\n\n########### Release Group protocol')
    # print(releaseGrp.PropDynValuesOfNow)
    vertebrateGrp.Observation_children.extend(vertebrateIndList)
    releaseGrp.Observation_children.extend(releaseIndList)

    listObs = []
    listObs.append(vertebrateGrp)
    listObs.append(releaseGrp)
    listObs.extend(biometryList)
    listObs.extend(equipmentIndList)

    # finally append all Protocols to Station 
    curStation.Observations.extend(listObs)
    transaction.commit()

    DBSession.add_all(equipmentIndList)
    transaction.commit()

    return {'release':len(releaseIndList)}
    return {'release':0}