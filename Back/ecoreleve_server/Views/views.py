from pyramid.view import view_config
import transaction
from sqlalchemy.orm import joinedload
from ecoreleve_server.Models import (
    DBSession,
    Base,
    dbConfig,
    ObservationDynProp,
    ProtocoleType,
    ProtocoleType_ObservationDynProp,
    ObservationDynPropValue,
    Observation,
    StationDynProp,
    StationType,
    StationType_StationDynProp,
    StationDynPropValue,
    Station
    )

from ecoreleve_server.GenericObjets.FrontModules import (FrontModule,ModuleField)


@view_config(route_name='observation/id', renderer='json', request_method = 'GET')
def getObservation(request):
    id = request.matchdict['id']
    ModuleName = request.params['FormName']
    curObs = DBSession.query(Observation).get(id)
    print(curObs)
    Conf = DBSession.query(FrontModule).filter(FrontModule.Name==ModuleName and FrontModule.TypeObj == curObs.FK_ProtocoleType).first()
    DisplayMode = request.params['DisplayMode']
    print(Conf)
    return curObs.GetDTOWithSchema(Conf,DisplayMode)

@view_config(route_name='observation', renderer='json', request_method = 'PUT')
def setObservation(request):
    data = request.json_body
    #ModuleName = request.params['FormName']
    #curObs = DBSession.query(Observation).get(data['ID'])
    curObs = DBSession.query(Observation).get(data['id'])
    curObs.UpdateFromJson(data)
    
    #result = curObs.GetDTOWithSchema('')
    transaction.commit()
    return {}


# @view_config(route_name='stations/id', renderer='json', request_method = 'GET')
# def getStation(request):
#     print('***************** GET STATION ***********************')
#     id = request.matchdict['id']
#     ModuleName = request.params['FormName']
#     curSta = DBSession.query(Station).get(id)
#     Conf = DBSession.query(FrontModule).filter(FrontModule.Name==ModuleName ).first()
#     DisplayMode = request.params['DisplayMode']
#     print(curSta)
#     return curSta.GetDTOWithSchema(Conf,DisplayMode)

# @view_config(route_name='stations', renderer='json', request_method = 'PUT')
# def setStation(request):
#     print('***********************PUT*****************')
#     data = request.json_body
#     #ModuleName = request.params['FormName']
#     #curObs = DBSession.query(Observation).get(data['ID'])
#     curObs = DBSession.query(Station).get(data['id'])
#     curObs.UpdateFromJson(data)
    
#     #result = curObs.GetDTOWithSchema('')
#     transaction.commit()
#     return {}    

@view_config(route_name='observation', renderer='json', request_method = 'POST')
def CreateObservation(request):

# TODO
    return 


@view_config(route_name='observation', renderer='json', request_method = 'OPTIONS')
def setObservationOptions(request):
    
    return

