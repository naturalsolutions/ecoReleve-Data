from pyramid.view import view_config
import transaction

from ecoreleve_server.Models import (
    DBSession,
    Base,
    dbConfig,
    ObservationDynProp,
    ProtocoleType,
    ProtocoleType_ObservationDynProp,
    ObservationDynPropValue,
    Observation
    )


@view_config(route_name='observation/id', renderer='json', request_method = 'GET')
def getObservation(request):
    id = request.matchdict['ID']
    curObs = DBSession.query(Observation).get(id)

    return curObs.GetDTOWithSchema()

@view_config(route_name='observation', renderer='json', request_method = 'PUT')
def setObservation(request):

    data = request.json_body
    curObs = DBSession.query(Observation).get(request.matchdict['ID'])
    curObs.UpdateFromJson(data)
    result = curObs.GetDTOWithSchema()
    print (result)
    transaction.commit()
    return result

@view_config(route_name='observation', renderer='json', request_method = 'OPTIONS')
def setObservationOptions(request):
    
    return

