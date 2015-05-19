from pyramid.view import view_config
from ..Models import (
    DBSession,
    Station,
    StationType
    )
from ecoreleve_server.GenericObjets.FrontModules import (FrontModule,ModuleField)
import transaction


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
    print (typeSta)
    ModuleName = 'StaForm'
    Conf = DBSession.query(FrontModule).filter(FrontModule.Name==ModuleName ).first()
    newSta = Station(FK_StationType = typeSta)
    
    schema = newSta.GetDTOWithSchema(Conf,'edit')
    #schema['data'].id =0
    return schema

def getFields(request) :
#     ## TODO return fields Station
    return

@view_config(route_name= prefix+'/id', renderer='json', request_method = 'GET')
def getStation(request):

    print('***************** GET STATION ***********************')
    id = request.matchdict['id']
    ModuleName = request.params['FormName']
    curSta = DBSession.query(Station).get(id)
    Conf = DBSession.query(FrontModule).filter(FrontModule.Name==ModuleName ).first()
    DisplayMode = request.params['DisplayMode']
    curSta.LoadNowValues()
    print(curSta)
    return curSta.GetDTOWithSchema(Conf,DisplayMode)
    
@view_config(route_name= prefix+'/id', renderer='json', request_method = 'PUT')
def updateStation(request):

    print('*********************** UPDATE Station *****************')
    data = request.json_body
    id = request.matchdict['id']
    curObs = DBSession.query(Station).get(id)
    curSta.LoadNowValues()
    curObs.UpdateFromJson(data)
    transaction.commit()
    return {}

@view_config(route_name= prefix, renderer='json', request_method = 'POST')
def insertStation(request):

    print('\n***************** INSERT STATION *********************** \n')
    data = request.json_body
    if isinstance(data,dict) : 
        return insertOneNewStation(request)
    elif isinstance (data,list) : 
        return insertListNewStations(request)

def insertOneNewStation (request) :

    data = {}
    for items , value in request.json_body.items() :
        if value != "" :
            data[items] = value

    newSta = Station(FK_StationType = data['FK_StationType'])
    newSta.StationType = DBSession.query(StationType).filter(StationType.ID==data['FK_StationType']).first()
    newSta.init_on_load()
    data['fieldActivityId'] = None
    newSta.UpdateFromJson(data)
    DBSession.add(newSta)
    DBSession.flush()
    return {'id': newSta.ID}

def insertListNewStations(request):
     # TODO 
     # insert mupltiple new stations
    return
