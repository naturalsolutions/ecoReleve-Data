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
                            'grid': curObsForm['grid'],
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
                    protoStatus = curVirginObs.GetType().obsolete

                    if protoStatus != 1:
                        curVirginObsForm = curVirginObs.GetForm(Conf, DisplayMode)

                        listProto[typeID] = {
                            'Name': typeName,
                            'schema': curVirginObsForm['schema'],
                            'fieldsets': curVirginObsForm['fieldsets'],
                            'grid': curVirginObsForm['grid'],
                            'obs': []
                        }

            globalListProto = [
                {'ID': typeID,
                 'Name': listProto[typeID]['Name'],
                 'schema':listProto[typeID]['schema'],
                 'fieldsets':listProto[typeID]['fieldsets'],
                 'grid':listProto[typeID]['grid'],
                 'obs':listProto[typeID]['obs']}
                for typeID in listProto.keys()
            ]

            response = sorted(globalListProto, key=lambda k: k['Name'])

    except Exception as e:
        print_exc()
        pass
    return response

def updateObservation(request, json_body, obs_id):
    session = request.dbsession
    data = json_body
    curObs = session.query(Observation).get(obs_id)
    curObs.LoadNowValues()
    listOfSubProtocols = []

    responseBody = { 'id': curObs.ID }

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
        responseBody['response'] = e.value

    return responseBody

def createObservation(request, json_body):
    session = request.dbsession
    data = {}
    for items, value in json_body.items():
        data[items] = value

    data['FK_Station'] = request.matchdict['id']
    data['FK_ProtocoleType'] = request.json_body['FK_ProtocoleType']

    sta = session.query(Station).get(request.matchdict['id'])

    curObs = Observation(FK_ProtocoleType=data['FK_ProtocoleType'],
                           FK_Station=data['FK_Station'])

    curObs.ProtocoleType = session.query(ProtocoleType).filter(
        ProtocoleType.ID == data['FK_ProtocoleType']).first()
    listOfSubProtocols = []

    for items, value in data.items():
        if isinstance(value, list) and items != 'children':
            listOfSubProtocols = value

    data['Observation_childrens'] = listOfSubProtocols
    curObs.init_on_load()
    curObs.UpdateFromJson(data)

    responseBody = {}

    try:
        curObs.Station = sta
        session.add(curObs)
        session.flush()
        responseBody['id'] = curObs.ID
    except ErrorAvailable as e:
        session.rollback()
        request.response.status_code = 510
        responseBody['response'] = e.value
        sendLog(logLevel=1, domaine=3, msg_number=request.response.status_code)

    return responseBody

@view_config(route_name='stations/id/observations/batch',
             renderer='json',
             request_method='POST',
             permission=routes_permission[prefixProt]['POST'])
def batch(request):
    session = request.dbsession
    sta_id = request.matchdict['id']
    rowData = request.json_body['rowData']

    responseBody = {
        'updatedObservations': [],
        'createdObservations': []
    }

    for i in range(len(rowData)):

        if 'delete' in request.json_body:
            responseBody['updatedObservations'].append(deleteObservation(request, rowData[i]['ID']))
            continue

        json_body = rowData[i]
        if 'ID' in rowData[i]:
            responseBody['updatedObservations'].append(updateObservation(request, json_body, rowData[i]['ID']))
        else:
            responseBody['createdObservations'].append(createObservation(request, json_body))
    
    return responseBody

def deleteObservation(request, obs_id):
    session = request.dbsession
    curObs = session.query(Observation).get(obs_id)
    responseBody = { 'id': obs_id }
    session.delete(curObs)
    return responseBody


@view_config(route_name='stations/id/observations',
             renderer='json',
             request_method='POST',
             permission=routes_permission[prefixProt]['POST'])
def handleObservationCreation(request):
    return createObservation(request, request.json_body)


@view_config(route_name='stations/id/observations/obs_id',
             renderer='json',
             request_method='PUT',
             permission=routes_permission[prefixProt]['PUT'])
def handleObservationUpdate(request):
    return updateObservation(request, request.json_body, request.matchdict['obs_id'])

@view_config(route_name='stations/id/observations/obs_id',
             renderer='json',
             request_method='DELETE',
             permission=routes_permission[prefixProt]['DELETE'])
def handleDeleteObservation(request):
    return deleteObservation(request, request.matchdict['obs_id'])

@view_config(route_name='stations/id/observations/obs_id',
             renderer='json',
             request_method='GET',
             permission=routes_permission[prefixProt]['GET'])
def getObservation(request):
    session = request.dbsession
    obs_id = request.matchdict['obs_id']
    try:
        curObs = session.query(Observation).get(obs_id)
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

@view_config(route_name='stations/id/observations',
             renderer='json',
             request_method='GET',
             permission=routes_permission[prefixProt]['GET'])
def getProtocolObservations(request):
    session = request.dbsession
    protocolType = request.params['objectType']
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


@view_config(route_name='stations/id/observations/action',
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
    if newObs.GetType().obsolete == 1:
        schema = None
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
                       ).where(and_(ProtocoleType.Status.in_([4,8,10]),
                                    FieldActivity_ProtocoleType.FK_fieldActivity == fieldActivityID)
                               ).select_from(join_table)
    else:
        query = select([ProtocoleType.ID, ProtocoleType.Name]).where(
            ProtocoleType.Status.in_([4,8,10]))
    query = query.where(ProtocoleType.obsolete == False)
    result = session.execute(query).fetchall()
    res = []
    for row in result:
        elem = {}
        elem['ID'] = row['ID']
        elem['Name'] = row['Name'].replace('_', ' ')
        res.append(elem)
    res = sorted(res, key=lambda k: k['Name'])
    return res
