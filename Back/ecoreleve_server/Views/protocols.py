from pyramid.view import view_config
from ..Models import (
    DBSession,
    Observation,
    ProtocoleType
    )
from ecoreleve_server.GenericObjets.FrontModules import (FrontModule,ModuleField)
import transaction
import json
from datetime import datetime
from sqlalchemy import func,select,and_, or_
from pyramid.security import NO_PERMISSION_REQUIRED
from collections import OrderedDict




prefix = 'protocols'
@view_config(route_name= prefix, renderer='json', request_method = 'PUT')
def updateListProtocols(request):
    # TODO 
    # update a list of protocols 
    return

@view_config(route_name= prefix+'/action', renderer='json', request_method = 'GET')
def actionOnProtocols(request):
    print ('\n*********************** Action **********************\n')
    dictActionFunc = {
    'count' : count,
    'forms' : getForms,
    '0' : getForms,
    'fields': getFields
    }
    actionName = request.matchdict['action']
    return dictActionFunc[actionName](request)

def count (request) :
#   ## TODO count stations
    return

def getForms(request) :

    typeProto = request.params['ObjectType']
    print('***************** GET FORMS ***********************')
    print (typeProto)
    ModuleName = 'ObsForm'
    Conf = DBSession.query(FrontModule).filter(FrontModule.Name==ModuleName ).first()
    newProto = Observation(FK_ProtocoleType = typeProto)

    schema = newProto.GetDTOWithSchema(Conf,'edit')
    # del schema['schema']['creationDate']
    return schema

def getFields(request) :
#     ## TODO return fields Station
    return

# @view_config(route_name= prefix, renderer='json', request_method = 'POST')
# def insertNewProtocols(request):
#     data = {}
#     for items , value in request.json_body.items() :

#         if value != "" :
#             print (items + ' : ' + str(value))
#             data[items] = value

#     newProto = Observation(FK_ProtocoleType = data['FK_ProtocoleType'])
#     newProto.ProtocoleType = DBSession.query(ProtocoleType).filter(ProtocoleType.ID==data['FK_ProtocoleType']).first()
#     newProto.init_on_load()
#     newProto.UpdateFromJson(data)
#     DBSession.add(newProto)
#     DBSession.flush()
#     return {'id': newProto.ID}

@view_config(route_name= prefix, renderer='json', request_method = 'GET')
def getListofProtocol (request):
    print(request.params)
    
    return 

@view_config(route_name= 'protocolTypes', renderer='json', request_method = 'GET', permission = NO_PERMISSION_REQUIRED)
def getListofProtocolTypes (request):
    query = select([ProtocoleType.ID, ProtocoleType.Name]).where(ProtocoleType.Status == 4)
    result = DBSession.execute(query).fetchall()
    print('********* protocoles types ******************')
    print (type(result[0]))
    res = []
    for row in result:
        elem = {}
        elem['ID'] = row['ID']
        elem['Name'] = row['Name']
        res.append(elem)
    res = sorted(res, key=lambda k: k['Name']) 
    #print ((res)[0])
    return res

@view_config(route_name= prefix + '/id', renderer='json', request_method = 'GET', permission = NO_PERMISSION_REQUIRED)
def getProtocol (request):
    id = request.matchdict['id']
    curProt = DBSession.query(Observation).get(id)

    curProt.LoadNowValues()
    print (curProt.PropDynValuesOfNow) 
    # if Form value exists in request --> return data with schema else return only data
    if 'FormName' in request.params :
        ModuleName = request.params['FormName']
        try :
            DisplayMode = request.params['DisplayMode']
        except : 
            DisplayMode = 'display'
        Conf = DBSession.query(FrontModule).filter(FrontModule.Name=='ObsForm' ).first()
        curProt.LoadNowValues()
        response = curProt.GetDTOWithSchema(Conf,DisplayMode)
    else : 
        response  = curProt.GetFlatObject()
    return response


