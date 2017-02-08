from pyramid.view import view_config
from ..Models import (
    Individual,
    Station,
    Observation,
    ProtocoleType,
    IndividualList,
    invertedThesaurusDict,
    thesaurusDictTraduction
)
from ..GenericObjets.FrontModules import FrontModules
import transaction
import json
from datetime import datetime
import pandas as pd
from sqlalchemy import select, text
from traceback import print_exc
from collections import Counter
from ..controllers.security import routes_permission
from ..Models.Equipment import checkSensor


prefix = 'release'


@view_config(route_name=prefix + '/individuals/action',
             renderer='json',
             request_method='GET',
             permission=routes_permission[prefix]['GET'])
def actionOnStations(request):
    dictActionFunc = {
        'getFields': getFields,
        'getFilters': getFilters,
        'getReleaseMethod': getReleaseMethod
    }
    actionName = request.matchdict['action']
    return dictActionFunc[actionName](request)


def getFilters(request):
    ModuleType = 'IndivReleaseGrid'
    filtersList = Individual().GetFilters(ModuleType)
    filters = {}
    for i in range(len(filtersList)):
        filters[str(i)] = filtersList[i]
    transaction.commit()
    return filters


def getFields(request):
    ModuleType = request.params['name']
    if ModuleType == 'default':
        ModuleType = 'IndivReleaseGrid'
    cols = Individual().GetGridFields('IndivReleaseGrid')

    return cols


def getReleaseMethod(request):
    session = request.dbsession
    userLng = request.authenticated_userid['userlanguage'].lower()
    if not userLng:
        userLng = 'fr'
    query = text("""SELECT TTop_FullPath as val, TTop_Name as label"""
                 + """ FROM THESAURUS.dbo.TTopic th
        JOIN [ModuleForms] f on th.TTop_ParentID = f.Options
        where Name = 'release_method' """)
    result = session.execute(query).fetchall()
    result = [dict(row) for row in result]
    if userLng != 'fr':
        for row in result:
            row['label'] = thesaurusDictTraduction[row['label']][userLng]
    return result


@view_config(route_name=prefix + '/individuals',
             renderer='json',
             request_method='GET',
             permission=routes_permission[prefix]['GET'])
def searchIndiv(request):
    session = request.dbsession
    data = request.params.mixed()

    searchInfo = {}
    searchInfo['criteria'] = []
    if 'criteria' in data:
        data['criteria'] = json.loads(data['criteria'])
        if data['criteria'] != {}:
            searchInfo['criteria'] = [obj for obj in data[
                'criteria'] if obj['Value'] != str(-1)]

    try:
        searchInfo['order_by'] = json.loads(data['order_by'])
    except:
        searchInfo['order_by'] = ['ID:desc']
    criteria = [
        {
            'Column': 'LastImported',
            'Operator': '=',
            'Value': True
        }]
    searchInfo['criteria'].extend(criteria)

    ModuleType = 'IndivReleaseGrid'
    moduleFront = session.query(FrontModules).filter(
        FrontModules.Name == ModuleType).one()
    listObj = IndividualList(moduleFront)
    dataResult = listObj.GetFlatDataList(searchInfo)
    for row in dataResult:
        if 'Date_Sortie' in row:
            row['Date_Sortie'] = row['Date_Sortie'].strftime('%Y-%m-%d %H:%M:%S')

    countResult = listObj.count(searchInfo)
    result = [{'total_entries': countResult}]
    result.append(dataResult)

    return result


@view_config(route_name=prefix + '/individuals',
             renderer='json',
             request_method='POST',
             permission=routes_permission[prefix]['POST'])
def releasePost(request):
    session = request.dbsession
    data = request.params.mixed()

    if 'StationID' not in data and 'IndividualList' not in data:
        if data == {}:
            data = request.json_body
        if 'FK_Sensor' in data and data['FK_Sensor'] not in (None, ''):
            return isavailableSensor(request, data)
        return

    sta_id = int(data['StationID'])
    indivListFromData = json.loads(data['IndividualList'])
    releaseMethod = data['releaseMethod']
    curStation = session.query(Station).get(sta_id)
    taxon = False
    # taxons = dict(Counter(indiv['Species'] for indiv in indivListFromData))

    userLang = request.authenticated_userid['userlanguage']
    indivList = []
    for row in indivListFromData:
        row = dict(map(lambda k: getFullpath(k, userLang), row.items()))
        indivList.append(row)

    def getnewObs(typeID):
        newObs = Observation()
        newObs.FK_ProtocoleType = typeID
        newObs.FK_Station = sta_id
        newObs.__init__()
        return newObs

    protoTypes = pd.DataFrame(session.execute(select([ProtocoleType])).fetchall(
    ), columns=ProtocoleType.__table__.columns.keys())
    vertebrateGrpID = int(
        protoTypes.loc[protoTypes['Name'] == 'Vertebrate_group', 'ID'].values[0])
    vertebrateIndID = int(
        protoTypes.loc[protoTypes['Name'] == 'Vertebrate_individual', 'ID'].values[0])
    biometryID = int(
        protoTypes.loc[protoTypes['Name'] == 'Bird_Biometry', 'ID'].values[0])
    releaseGrpID = int(
        protoTypes.loc[protoTypes['Name'] == 'Release_Group', 'ID'].values[0])
    releaseIndID = int(
        protoTypes.loc[protoTypes['Name'] == 'Release_Individual', 'ID'].values[0])
    equipmentIndID = int(
        protoTypes.loc[protoTypes['Name'] == 'Individual_equipment', 'ID'].values[0])

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

    """ Return sex, age repartition of released individuals

        binary ponderation female : 4, male :2 , indeterminateSex : 1,
        adult:8, juvenile : 16, indeterminateAge : 32
    """
    def MoF_AoJ(obj):
        curSex = None
        curAge = None
        binP = 0
        if obj['Sex'] is not None and obj['Sex'].lower() == 'male':
            curSex = 'male'
            binP += 2
        elif obj['Sex'] is not None and obj['Sex'].lower() == 'female':
            curSex = 'female'
            binP += 4
        else:
            curSex == 'Indeterminate'
            binP += 1

        if obj['Age'] is not None and obj['Age'].lower() == 'Adult':
            curAge = 'Adult'
            binP += 8
        elif obj['Age'] is not None and obj['Age'].lower() == 'juvenile':
            curAge = 'Juvenile'
            binP += 16
        else:
            curAge == 'Indeterminate'
            binP += 32
        return binaryDict[binP]

    try:
        errorEquipment = None
        binList = []
        for indiv in indivList:
            curIndiv = session.query(Individual).get(indiv['ID'])
            curIndiv.LoadNowValues()
            if not taxon:
                taxon = curIndiv.Species
            try:
                indiv['taxon'] = curIndiv.Species
                del indiv['species']
            except:
                indiv['taxon'] = curIndiv.Species
                del indiv['Species']
                pass
            curIndiv.UpdateFromJson(indiv, startDate=curStation.StationDate)

            binList.append(MoF_AoJ(indiv))
            for k in indiv.keys():
                v = indiv.pop(k)
                k = k.lower()
                indiv[k] = v

            indiv['FK_Individual'] = indiv['id']
            indiv['FK_Station'] = sta_id
            try:
                indiv['weight'] = indiv['poids']
            except:
                indiv['weight'] = indiv['Poids']
                pass
            try:
                indiv['Comments'] = indiv['release_comments']
            except:
                print_exc()
                pass

            curVertebrateInd = getnewObs(vertebrateIndID)
            curVertebrateInd.UpdateFromJson(
                indiv, startDate=curStation.StationDate)
            vertebrateIndList.append(curVertebrateInd)

            curBiometry = getnewObs(biometryID)
            curBiometry.UpdateFromJson(indiv, startDate=curStation.StationDate)
            biometryList.append(curBiometry)

            curReleaseInd = getnewObs(releaseIndID)
            curReleaseInd.UpdateFromJson(
                indiv, startDate=curStation.StationDate)
            releaseIndList.append(curReleaseInd)

            try:
                try:
                    sensor_id = int(indiv['fk_sensor'])
                except:
                    sensor_id = int(indiv['FK_Sensor'])

                curEquipmentInd = getnewObs(equipmentIndID)
                equipInfo = {
                    'FK_Individual': indiv['FK_Individual'],
                    'FK_Sensor': sensor_id,
                    'Survey_type': 'post-relâcher',
                    'Monitoring_Status': 'suivi',
                    'Sensor_Status': 'sortie de stock>mise en service'
                }
                curEquipmentInd.UpdateFromJson(
                    equipInfo, startDate=curStation.StationDate)
                curEquipmentInd.Station = curStation
                equipmentIndList.append(curEquipmentInd)
            except Exception as e:
                if e.__class__.__name__ == 'ErrorAvailable':
                    sensor_available = 'is' if e.value[
                        'sensor_available'] else 'is not'
                    tpl = 'SensorID {0} {1} available for equipment'.format(
                        equipInfo['FK_Sensor'], sensor_available)
                    if errorEquipment is None:
                        errorEquipment = tpl
                    else:
                        errorEquipment += ',   ' + tpl
                pass

        vertebrateGrp = Observation(
            FK_ProtocoleType=vertebrateGrpID, FK_Station=sta_id)
        dictVertGrp = dict(Counter(binList))
        dictVertGrp['taxon'] = taxon
        dictVertGrp['nb_total'] = len(releaseIndList)

        vertebrateGrp.UpdateFromJson(dictVertGrp)
        vertebrateGrp.Observation_children.extend(vertebrateIndList)

        releaseGrp = Observation(
            FK_ProtocoleType=releaseGrpID, FK_Station=sta_id)
        releaseGrp.PropDynValuesOfNow = {}
        releaseGrp.UpdateFromJson({'taxon': taxon,
                                   'release_method': releaseMethod,
                                   'nb_individuals': len(releaseIndList)})
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
            message = {'release': len(releaseIndList)}

    except Exception as e:
        print_exc()
        session.rollback()
        message = str(type(e))

    return message


def isavailableSensor(request, data):
    availability = checkSensor(data['FK_Sensor'], datetime.strptime(
        data['sta_date'], '%d/%m/%Y %H:%M:%S'))
    if availability is True:
        return
    else:
        request.response.status_code = 510
        return 'sensor not available'


def getFullpath(item, lng):
    name, val = item
    try:
        newVal = invertedThesaurusDict[lng][val]
    except:
        newVal = val
    return (name, newVal)
