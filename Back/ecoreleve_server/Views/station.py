from pyramid.view import view_config
from ..Models import (
    DBSession,
    Station,
    StationType
    )
from ecoreleve_server.GenericObjets.FrontModules import (FrontModule,ModuleField)
import transaction
import json

prefix = 'stations'


# @view_config(route_name= prefix, renderer='json', request_method = 'PUT')
# def updateListStations(request):
#     # TODO 
#     # update a list of stations 
#     return

# @view_config(route_name= prefix, renderer='json', request_method = 'GET')
# def getListStations(request):
#     # TODO 
#     # return list of stations 
#     # can search/filter
#     return

@view_config(route_name= prefix+'/action', renderer='json', request_method = 'GET')
def actionOnStations(request):
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

    typeSta = request.params['ObjectType']
    print('***************** GET FORMS ***********************')
    ModuleName = 'StaForm'
    Conf = DBSession.query(FrontModule).filter(FrontModule.Name==ModuleName ).first()
    newSta = Station(FK_StationType = typeSta)
    
    schema = newSta.GetDTOWithSchema(Conf,'edit')
    del schema['schema']['creationDate']
    return schema

def getFields(request) :
#     ## TODO return fields Station
    return

@view_config(route_name= prefix+'/id', renderer='json', request_method = 'GET')
def getStation(request):

    print('***************** GET STATION ***********************')
    id = request.matchdict['id']
    curSta = DBSession.query(Station).get(id)
    curSta.LoadNowValues()

    # if Form value exists in request --> return data with schema else return only data
    if 'FormName' in request.params :
        ModuleName = request.params['FormName']
        DisplayMode = request.params['DisplayMode']
        Conf = DBSession.query(FrontModule).filter(FrontModule.Name==ModuleName ).first()
        response = curSta.GetDTOWithSchema(Conf,DisplayMode)
    else : 
        response  = curSta.GetFlatObject()

    return response

@view_config(route_name= prefix+'/id', renderer='json', request_method = 'PUT')
def updateStation(request):

    print('*********************** UPDATE Station *****************')
    data = request.json_body
    id = request.matchdict['id']
    curSta = DBSession.query(Station).get(id)
    curSta.LoadNowValues()
    curSta.UpdateFromJson(data)
    transaction.commit()
    return {}

@view_config(route_name= prefix, renderer='json', request_method = 'POST')
def insertStation(request):

    data = request.POST.mixed()
    if 'data' not in data :
        print('_______INsert ROW *******')
        return insertOneNewStation(request)
    else :
        print (data['data'])
        print('_______INsert LIST')
        data = data['data']
        return insertListNewStations(data)

def insertOneNewStation (request) :

    data = {}
    for items , value in request.json_body.items() :
        if value != "" :
            data[items] = value

    newSta = Station(FK_StationType = data['FK_StationType'])
    newSta.StationType = DBSession.query(StationType).filter(StationType.ID==data['FK_StationType']).first()
    newSta.init_on_load()
    newSta.UpdateFromJson(data)
    DBSession.add(newSta)
    DBSession.flush()
    return {'id': newSta.ID}

def insertListNewStations(data):

    data = json.loads(data)
    print (data) 
    print ('_______type : '+str(type(data)))
    res = Station().InsertDTO(data)
    return res 
