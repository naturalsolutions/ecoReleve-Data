from pyramid.view import view_config
from ..Models import (
    Observation,
    ProtocoleType,
    FieldActivity_ProtocoleType,
    fieldActivity,
    Station,
    ErrorAvailable,
    ListObjectWithDynProp,
    sendLog
)
from ..GenericObjets.FrontModules import FrontModules
from sqlalchemy import select, and_, or_, join
from traceback import print_exc
from ..controllers.security import routes_permission


prefixProt = 'protocols'
prefix = 'stations'


@view_config(route_name=prefix + '/id/protocols/',
             renderer='json',
             request_method='GET',
             permission=routes_permission[prefixProt]['GET'])
@view_config(route_name=prefix + '/id/protocols',
             renderer='json',
             request_method='GET',
             permission=routes_permission[prefixProt]['GET'])
def GetProtocolsofStation(request):
    session = request.dbsession
    sta_id = request.matchdict['id']
    curSta = session.query(Station).get(sta_id)
    response = []
    try:
        if 'criteria' in request.params.mixed() or request.params.mixed() == {}:
            searchInfo = {}
            searchInfo['criteria'] = [
                {'Column': 'FK_Station', 'Operator': '=', 'Value': sta_id}]
            listObs = ListObjectWithDynProp(session, Observation, searchInfo)
            response = listObs.GetFlatList()
    except:
        pass
    try:
        if 'FormName' in request.params:
            ModuleName = 'ObservationForm'
            listObs = list(session.query(Observation).filter(
                and_(Observation.FK_Station == sta_id, Observation.Parent_Observation == None)))
            listType = list(session.query(FieldActivity_ProtocoleType
                                          ).filter(FieldActivity_ProtocoleType.FK_fieldActivity == curSta.fieldActivityId))
            Conf = session.query(FrontModules).filter(
                FrontModules.Name == ModuleName).first()

            listProto = {}
            if listObs:
                for i in range(len(listObs)):
                    DisplayMode = 'edit'
                    curObs = listObs[i]
                    typeID = curObs.GetType().ID
                    if typeID in listProto:
                        listProto[typeID]['obs'].append(curObs.ID)
                    else:
                        typeName = curObs.GetType().Name.replace('_', ' ')
                        curObsForm = curObs.GetForm(Conf, DisplayMode)

                        listProto[typeID] = {
                            'Name': typeName,
                            'schema': curObsForm['schema'],
                            'fieldsets': curObsForm['fieldsets'],
                            'obs': [curObs.ID]
                        }

            if listType:
                listVirginProto = list(
                    filter(lambda proto: proto.FK_ProtocoleType not in listProto, listType))

                for i in range(len(listVirginProto)):
                    DisplayMode = 'edit'
                    typeID = listVirginProto[i].FK_ProtocoleType

                    curVirginObs = Observation(FK_ProtocoleType=typeID)
                    typeName = curVirginObs.GetType().Name.replace('_', ' ')
                    curVirginObsForm = curVirginObs.GetForm(Conf, DisplayMode)

                    listProto[typeID] = {
                        'Name': typeName,
                        'schema': curVirginObsForm['schema'],
                        'fieldsets': curVirginObsForm['fieldsets'],
                        'obs': []
                    }

            globalListProto = [
                {'ID': typeID,
                 'Name': listProto[typeID]['Name'],
                 'schema':listProto[typeID]['schema'],
                 'fieldsets':listProto[typeID]['fieldsets'],
                 'obs':listProto[typeID]['obs']}
                for typeID in listProto.keys()
            ]

            response = sorted(globalListProto, key=lambda k: k['Name'])

    except Exception as e:
        print_exc()
        pass
    return response



@view_config(route_name=prefix + '/id/protocols',
             renderer='json',
             request_method='POST',
             permission=routes_permission[prefixProt]['POST'])
@view_config(route_name=prefix + '/id/protocols/',
             renderer='json',
             request_method='POST',
             permission=routes_permission[prefixProt]['POST'])
def insertNewProtocol(request):
    session = request.dbsession
    data = {}
    for items, value in request.json_body.items():
        data[items] = value

    data['FK_Station'] = request.matchdict['id']

    sta = session.query(Station).get(request.matchdict['id'])
    newProto = Observation(FK_ProtocoleType=data['FK_ProtocoleType'],
                           FK_Station=data['FK_Station'])
    newProto.ProtocoleType = session.query(ProtocoleType).filter(
        ProtocoleType.ID == data['FK_ProtocoleType']).first()
    listOfSubProtocols = []
    for items, value in data.items():
        if isinstance(value, list) and items != 'children':
            listOfSubProtocols = value

    data['Observation_childrens'] = listOfSubProtocols
    newProto.init_on_load()
    newProto.UpdateFromJson(data)
    try:
        newProto.Station = sta
        session.add(newProto)
        session.flush()
        message = {'id': newProto.ID}
    except ErrorAvailable as e:
        session.rollback()
        request.response.status_code = 510
        message = e.value
        sendLog(logLevel=1, domaine=3, msg_number=request.response.status_code)

    return message


@view_config(route_name='observations/id',
             renderer='json',
             request_method='PUT',
             permission=routes_permission[prefixProt]['PUT'])
def updateObservation(request):
    session = request.dbsession
    data = request.json_body
    id_obs = request.matchdict['id']
    curObs = session.query(Observation).get(id_obs)
    curObs.LoadNowValues()
    listOfSubProtocols = []
    message = 'ok'

    for items, value in data.items():
        if isinstance(value, list) and items != 'children':
            listOfSubProtocols = value

    data['Observation_childrens'] = listOfSubProtocols
    curObs.UpdateFromJson(data)
    try:
        if curObs.Equipment is not None:
            curObs.Station = curObs.Station
    except ErrorAvailable as e:
        session.rollback()
        request.response.status_code = 510
        message = e.value
    return message

@view_config(route_name='observations/id',
             renderer='json',
             request_method='DELETE',
             permission=routes_permission[prefixProt]['DELETE'])
def deleteObservation(request):
    session = request.dbsession
    id_obs = request.matchdict['id']
    curObs = session.query(Observation).get(id_obs)
    session.delete(curObs)

    return {}

@view_config(route_name='observations/id',
             renderer='json',
             request_method='GET',
             permission=routes_permission[prefixProt]['GET'])
def getObservation(request):
    session = request.dbsession
    id_obs = request.matchdict['id']
    try:
        curObs = session.query(Observation).get(id_obs)
        curObs.LoadNowValues()
        if 'FormName' in request.params:
            try:
                DisplayMode = request.params['DisplayMode']
            except:
                DisplayMode = 'display'

            Conf = session.query(FrontModules).filter(
                FrontModules.Name == 'ObservationForm').first()
            response = curObs.GetDTOWithSchema(Conf, DisplayMode)
        else:
            response = curObs.GetFlatObject()
    except Exception as e:
        response = {}

    return response

@view_config(route_name='stations/id/protocols/type/observations',
             renderer='json',
             request_method='GET',
             permission=routes_permission[prefixProt]['GET'])
def getProtocolObservations(request):
    session = request.dbsession
    protocolType = request.matchdict['type']
    sta_id = request.matchdict['id']
    listObs = list(session.query(Observation)
        .filter(Observation.FK_ProtocoleType == protocolType,)
        .filter(Observation.FK_Station == sta_id))

    values = []
    for i in range(len(listObs)):
        curObs = listObs[i]
        curObs.LoadNowValues()
        values.append(curObs.GetFlatObject())
    return values

@view_config(route_name='stations/id/protocols/type/observations',
             renderer='json',
             request_method='PUT',
             permission=routes_permission[prefixProt]['PUT'])
def saveProtocolObservations(request):
    session = request.dbsession
    protocolType = request.matchdict['type']
    sta_id = request.matchdict['id']
    data = request.json_body

    for i in range(len(data)):
        if data[i]['ID'] != 0:
            curObs = session.query(Observation).get(data[i]['ID'])
            curObs.LoadNowValues()
            curObs.UpdateFromJson(data[i])
        else: 
            #new (POST)
            print()

    return {}

@view_config(route_name=prefix + '/id/protocols/action',
             renderer='json',
             request_method='GET',
             permission=routes_permission[prefixProt]['GET'])
def actionOnObs(request):
    dictActionFunc = {
        'forms': getObsForms,
        '0': getObsForms,
    }
    actionName = request.matchdict['action']
    return dictActionFunc[actionName](request)

def getObsForms(request):
    session = request.dbsession
    typeObs = request.params['ObjectType']
    sta_id = request.matchdict['id']
    ModuleName = 'ObservationForm'
    Conf = session.query(FrontModules).filter(
        FrontModules.Name == ModuleName).first()
    newObs = Observation(FK_ProtocoleType=typeObs, FK_Station=sta_id)
    newObs.init_on_load()
    schema = newObs.GetDTOWithSchema(Conf, 'edit')

    return schema


@view_config(route_name=prefixProt,
             renderer='json',
             request_method='POST',
             permission=routes_permission[prefixProt]['POST'])
def insertProtocols(request):
    return insertNewProtocol(request)


@view_config(route_name=prefixProt + '/action',
             renderer='json',
             request_method='GET',
             permission=routes_permission[prefixProt]['GET'])
def actionOnProtocols(request):

    return False


@view_config(route_name=prefixProt + '/id',
             renderer='json',
             request_method='GET',
             permission=routes_permission[prefixProt]['GET'])
def getProtocol(request):
    session = request.dbsession

    _id = request.matchdict['id']
    curProt = session.query(Observation).get(_id)
    curProt.LoadNowValues()

    if 'FormName' in request.params:
        try:
            DisplayMode = request.params['DisplayMode']
        except:
            DisplayMode = 'display'
        Conf = session.query(FrontModules).filter(
            FrontModules.Name == 'ObservationForm').first()
        curProt.LoadNowValues()
        response = curProt.GetDTOWithSchema(Conf, DisplayMode)
    else:
        response = curProt.GetFlatObject()
    return response


@view_config(route_name='fieldActivity',
             renderer='json',
             request_method='GET')
def getFieldActivityList(request):
    session = request.dbsession

    query = select([fieldActivity.ID.label('value'),
                    fieldActivity.Name.label('label')])
    result = session.execute(query).fetchall()
    res = []
    for row in result:
        res.append({'label': row['label'], 'value': row['value']})
    return sorted(res, key=lambda x: x['label'])


@view_config(route_name='protocolTypes',
             renderer='json',
             request_method='GET')
def getListofProtocolTypes(request):
    session = request.dbsession
    if 'FieldActivityID' in request.params:
        fieldActivityID = request.params['FieldActivityID']
        join_table = join(ProtocoleType, FieldActivity_ProtocoleType,
                          ProtocoleType.ID == FieldActivity_ProtocoleType.FK_ProtocoleType)
        query = select([ProtocoleType.ID, ProtocoleType.Name]
                       ).where(and_(or_(ProtocoleType.Status == 4, ProtocoleType.Status == 8),
                                    FieldActivity_ProtocoleType.FK_fieldActivity == fieldActivityID)
                               ).select_from(join_table)
    else:
        query = select([ProtocoleType.ID, ProtocoleType.Name]).where(
            or_(ProtocoleType.Status == 4, ProtocoleType.Status == 8))
    result = session.execute(query).fetchall()

    res = []
    for row in result:
        elem = {}
        elem['ID'] = row['ID']
        elem['Name'] = row['Name'].replace('_', ' ')
        res.append(elem)
    res = sorted(res, key=lambda k: k['Name'])
    return res
