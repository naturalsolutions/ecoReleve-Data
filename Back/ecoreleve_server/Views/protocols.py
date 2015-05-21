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
from sqlalchemy import func

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

def getListProtocols(request):
    # TODO 
    # return list of protocols
    # can search/filter
    return

@view_config(route_name= prefix, renderer='json', request_method = 'POST')
def insertNewProtocols(request):
    data = {}
    for items , value in request.json_body.items() :

        if value != "" :
            print (items + ' : ' + str(value))
            data[items] = value

    newProto = Observation(FK_ProtocoleType = data['FK_ProtocoleType'])
    newProto.ProtocoleType = DBSession.query(ProtocoleType).filter(ProtocoleType.ID==data['FK_ProtocoleType']).first()
    newProto.init_on_load()
    newProto.UpdateFromJson(data)
    print('__________creation DAte ___________')
    print (newProto.creationDate)
    DBSession.add(newProto)
    DBSession.flush()
    return {'id': newProto.ID}

@view_config(route_name= prefix, renderer='json', request_method = 'GET')
def getListofProtocolType (request):
    print(request.json_body)
    
    return 
# @view_config(route_name= prefix+'/name', renderer='json', request_method = 'PUT')
# def updateListProtocol(request):
#     # TODO 
#     # update a list of protocol by name
#     return

# @view_config(route_name= prefix+'/name', renderer='json', request_method = 'GET')
# def getListProtocol(request):
#     # TODO 
#     # return a list of protocol by name
#     return

# @view_config(route_name= prefix+'/name', renderer='json', request_method = 'POST')
# def insertProtocol(request):
#     # TODO
#     # insert new protocol
#     return

# @view_config(route_name= prefix+'/name/id', renderer='json', request_method = 'PUT')
# def updateProtocol(request):
#     # TODO 
#     # update the protocol by id
#     return

# @view_config(route_name= prefix+'/name/id', renderer='json', request_method = 'GET')
# def getProtocol(request):
#     # TODO 
#     # return a protocol by id
#     return
