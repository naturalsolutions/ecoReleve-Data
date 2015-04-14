from pyramid.view import view_config

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
	print('____________UPDATE_______________\n\n')
	
	print (request.json_body)
	print (type(request.json_body))
	data = request.json_body
	curObs = DBSession.query(Observation).get(data['id'])
	
	curObs.UpdateFromJson(data)

	return curObs.GetDTOWithSchema()

@view_config(route_name='observation', renderer='json', request_method = 'OPTIONS')
def setObservationOptions(request):
	return

