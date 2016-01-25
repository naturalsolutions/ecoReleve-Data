from pyramid.view import view_config
from ..Models import (
    Observation,
    ProtocoleType,
    FieldActivity_ProtocoleType,
    fieldActivity,
    Station,
    ErrorAvailable
    )
from ..GenericObjets.FrontModules import FrontModules
import json
from datetime import datetime
from sqlalchemy import func,select,and_, or_, join
from pyramid.security import NO_PERMISSION_REQUIRED
from collections import OrderedDict
from traceback import print_exc

prefixProt = 'protocols'
prefix = 'stations'

# ------------------------------------------------------------------------------------------------------------------------- #
@view_config(route_name= prefix+'/id/protocols/', renderer='json', request_method = 'GET')
@view_config(route_name= prefix+'/id/protocols', renderer='json', request_method = 'GET')
def GetProtocolsofStation (request) :
    session = request.dbsession

    sta_id = request.matchdict['id']
    data = {}
    searchInfo = {}
    criteria = [{'Column': 'FK_Station', 'Operator':'=','Value':sta_id}]
    response = []
    curSta = session.query(Station).get(sta_id)
    try : 
        if 'criteria' in request.params or request.params == {} :
            searchInfo = data
            searchInfo['criteria'] = []
            searchInfo['criteria'].extend(criteria)
            listObs = ListObjectWithDynProp(session,Observation,searchInfo)
            response = listObs.GetFlatList()
    except : 
        pass
    try :
        if 'FormName' in request.params : 
            ModuleName = 'ObservationForm'
            listObs = list(session.query(Observation).filter(and_(Observation.FK_Station == sta_id,Observation.Parent_Observation == None)))
            listType =list(session.query(FieldActivity_ProtocoleType
                ).filter(FieldActivity_ProtocoleType.FK_fieldActivity == curSta.fieldActivityId))
            Conf = session.query(FrontModules).filter(FrontModules.Name == ModuleName ).first()
            ### TODO : if protocols exists, append the new protocol form at the after : 2 loops, no choice
            if listObs or listType:
                # max_iter = max(len(listObs),len(listType))
                listProto = {}
                for i in range(len(listObs)) :
                    try : 
                        DisplayMode = 'display'
                        obs = listObs[i]
                        typeName = obs.GetType().Name
                        typeID = obs.GetType().ID
                        obs.LoadNowValues()
                        try :
                            listProto[typeID]['obs'].append(obs.GetDTOWithSchema(Conf,DisplayMode))
                        except :
                            listObsWithSchema = []
                            listObsWithSchema.append(obs.GetDTOWithSchema(Conf,DisplayMode))
                            listProto[typeID] = {'Name': typeName,'obs':listObsWithSchema}
                            pass
                    except Exception as e :
                        print_exc()
                        print('exception!!!')
                        pass

                for i in range(len(listType)) :
                    try : 
                        DisplayMode = 'edit'
                       
                        virginTypeID = listType[i].FK_ProtocoleType
                        virginObs = Observation(FK_ProtocoleType = virginTypeID)
                        viginTypeName = virginObs.GetType().Name
                        try :
                            if virginTypeID not in listProto :
                                test_ = listProto[virginTypeID]
                                virginForm = virginObs.GetDTOWithSchema(Conf,DisplayMode)
                                virginForm['data']['FK_ProtocoleType'] = virginTypeID
                                listProto[virginTypeID]['obs'].append(virginForm)
                        except :
                            if virginTypeID not in listProto :
                                listSchema = []
                                virginForm = virginObs.GetDTOWithSchema(Conf,DisplayMode)
                                virginForm['data']['FK_ProtocoleType'] = virginTypeID
                                listSchema.append(virginForm)
                                listProto[virginTypeID] = {'Name': viginTypeName,'obs':listSchema}
                                pass
                    except :
                        print_exc()
                        pass
            globalListProto = [{'ID':objID, 'Name':listProto[objID]['Name'],'obs':listProto[objID]['obs'] } for objID in listProto.keys()]
            response = globalListProto
    except Exception as e :
        print_exc()
        print (e)
        pass
    return response

# ------------------------------------------------------------------------------------------------------------------------- #
@view_config(route_name= prefix+'/id/protocols', renderer='json', request_method = 'POST')
@view_config(route_name= prefix+'/id/protocols/', renderer='json', request_method = 'POST')
def insertNewProtocol (request) :
    session = request.dbsession
    data = {}
    for items , value in request.json_body.items() :
        if value != "" and value != []:
            data[items] = value

    data['FK_Station'] = request.matchdict['id']
    sta = session.query(Station).get(request.matchdict['id'])
    newProto = Observation(FK_ProtocoleType = data['FK_ProtocoleType'])    #,FK_Station=data['FK_Station'])
    newProto.ProtocoleType = session.query(ProtocoleType).filter(ProtocoleType.ID==data['FK_ProtocoleType']).first()
    listOfSubProtocols = []
    for items , value in data.items() :
        if isinstance(value,list) and items != 'children':
            listOfSubProtocols = value
    # if listOfSubProtocols !=[] and 'sub_ProtocoleType' in data:
    #     for obj in listOfSubProtocols:
    #         obj['FK_ProtocoleType']=data['sub_ProtocoleType']
    data['Observation_childrens'] = listOfSubProtocols
    newProto.init_on_load()
    newProto.UpdateFromJson(data)
    try : 
        newProto.Station = sta
        session.add(newProto)
        session.flush()
        message = {'id': newProto.ID}
    except ErrorAvailable as e :
        session.rollback()
        request.response.status_code = 510
        message = e.value

    return message

# ------------------------------------------------------------------------------------------------------------------------- #
@view_config(route_name= prefix+'/id/protocols/obs_id', renderer='json', request_method = 'PUT')
def updateObservation(request):
    session = request.dbsession
    data = request.json_body
    id_obs = request.matchdict['obs_id']
    curObs = session.query(Observation).get(id_obs)
    curObs.LoadNowValues()
    listOfSubProtocols = []
    subObsList = []
    message = 'ok'

    for  items , value in data.items():
        if isinstance(value,list) and items != 'children':
            listOfSubProtocols = value

    data['Observation_childrens'] = listOfSubProtocols
    curObs.UpdateFromJson(data)
    try : 
        if curObs.Equipment is not None : 
            curObs.Station = curObs.Station
    except ErrorAvailable as e :
        session.rollback()
        request.response.status_code = 510
        message = e.value
    return message

# ------------------------------------------------------------------------------------------------------------------------- #
@view_config(route_name= prefix+'/id/protocols/obs_id', renderer='json', request_method = 'DELETE')
def deleteObservation(request):
    session = request.dbsession
    id_obs = request.matchdict['obs_id']
    curObs = session.query(Observation).get(id_obs)
    session.delete(curObs)

    return {}

# ------------------------------------------------------------------------------------------------------------------------- #
@view_config(route_name= prefix+'/id/protocols/obs_id', renderer='json', request_method = 'GET')
def getObservation(request):
    session = request.dbsession

    id_obs = request.matchdict['obs_id']
    id_sta = request.matchdict['id']
    try :
        curObs = session.query(Observation).filter(and_(Observation.ID ==id_obs, Observation.FK_Station == id_sta )).one()
        curObs.LoadNowValues()
        # if Form value exists in request --> return data with schema else return only data
        if 'FormName' in request.params :
            ModuleName = request.params['FormName']
            try :
                DisplayMode = request.params['DisplayMode']
            except : 
                DisplayMode = 'display'

            Conf = session.query(FrontModules).filter(FrontModules.Name=='ObservationForm' ).first()
            response = curObs.GetDTOWithSchema(Conf,DisplayMode)
        else : 
            response  = curObs.GetFlatObject()
    except Exception as e :
        print(e)
        response = {}

    return response

# ------------------------------------------------------------------------------------------------------------------------- #
@view_config(route_name= prefix+'/id/protocols/action', renderer='json', request_method = 'GET')
def actionOnObs(request):
    session = request.dbsession

    dictActionFunc = {
    'count' : countObs,
    'forms' : getObsForms,
    '0' : getObsForms,
    'fields': getObsFields
    }
    actionName = request.matchdict['action']
    return dictActionFunc[actionName](request)

def countObs (request) :
    session = request.dbsession
#   ## TODO count stations
    return

def getObsForms(request) :
    session = request.dbsession
    typeObs = request.params['ObjectType']
    sta_id = request.matchdict['id']
    ModuleName = 'ObservationForm'
    Conf = session.query(FrontModules).filter(FrontModules.Name==ModuleName ).first()
    newObs = Observation(FK_ProtocoleType = typeObs, FK_Station = sta_id)
    newObs.init_on_load()
    schema = newObs.GetDTOWithSchema(Conf,'edit')

    return schema

def getObsFields(request) :
    session = request.dbsession
#     ## TODO return fields Station
    return

# ------------------------------------------------------------------------------------------------------------------------- #
@view_config(route_name= prefixProt, renderer='json', request_method = 'PUT')
def updateListProtocols(request):
    session = request.dbsession
    # TODO 
    # update a list of protocols 
    return

# ------------------------------------------------------------------------------------------------------------------------- #
@view_config(route_name= prefixProt, renderer='json', request_method = 'POST')
def insertProtocols(request):
    session = request.dbsession
    return insertNewProtocol (request)

# ------------------------------------------------------------------------------------------------------------------------- #
@view_config(route_name= prefixProt+'/action', renderer='json', request_method = 'GET')
def actionOnProtocols(request):
    dictActionFunc = {
    'count' : count,
    'forms' : getForms,
    '0' : getForms,
    'fields': getFields
    }
    actionName = request.matchdict['action']
    return dictActionFunc[actionName](request)

# ------------------------------------------------------------------------------------------------------------------------- #
# @view_config(route_name= prefixProt, renderer='json', request_method = 'GET')
# def getListofProtocol (request):
#     print(request.params)
#     return

# ------------------------------------------------------------------------------------------------------------------------- #
@view_config(route_name= prefixProt + '/id', renderer='json', request_method = 'GET')
def getProtocol (request):
    session = request.dbsession

    id = request.matchdict['id']
    curProt = session.query(Observation).get(id)
    curProt.LoadNowValues()
    # if Form value exists in request --> return data with schema else return only data
    if 'FormName' in request.params :
        ModuleName = request.params['FormName']
        try :
            DisplayMode = request.params['DisplayMode']
        except : 
            DisplayMode = 'display'
        Conf = session.query(FrontModules).filter(FrontModules.Name=='ObservationForm' ).first()
        curProt.LoadNowValues()
        response = curProt.GetDTOWithSchema(Conf,DisplayMode)
    else : 
        response  = curProt.GetFlatObject()
    return response

# ------------------------------------------------------------------------------------------------------------------------- #
@view_config(route_name= 'fieldActivity', renderer='json', request_method = 'GET')
def getFieldActivityList (request) :
    session = request.dbsession

    query = select([fieldActivity.ID.label('value'), fieldActivity.Name.label('label')])
    result = session.execute(query).fetchall()
    res = []
    for row in result :
        res.append({'label':row['label'], 'value': row['value']})
    return sorted(res , key = lambda x : x['label'])

# ------------------------------------------------------------------------------------------------------------------------- #
@view_config(route_name= 'protocolTypes', renderer='json', request_method = 'GET')
def getListofProtocolTypes (request):
    session = request.dbsession
    if 'FieldActivityID' in request.params :
        fieldActivityID = request.params['FieldActivityID']
        join_table = join(ProtocoleType,FieldActivity_ProtocoleType,ProtocoleType.ID == FieldActivity_ProtocoleType.FK_ProtocoleType )
        query = select([ProtocoleType.ID, ProtocoleType.Name]
            ).where(and_(ProtocoleType.Status == 4 ,FieldActivity_ProtocoleType.FK_fieldActivity == fieldActivityID)
            ).select_from(join_table)
    else : 
        query = select([ProtocoleType.ID, ProtocoleType.Name]).where(ProtocoleType.Status == 4)
    result = session.execute(query).fetchall()

    res = []
    for row in result:
        elem = {}
        elem['ID'] = row['ID']
        elem['Name'] = row['Name']
        res.append(elem)
    res = sorted(res, key=lambda k: k['Name']) 
    return res
