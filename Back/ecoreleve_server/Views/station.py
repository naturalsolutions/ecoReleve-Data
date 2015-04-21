from pyramid.view import view_config

prefix = 'stations'
@view_config(route_name= prefix, renderer='json', request_method = 'PUT')
def updateListStations(request):
    # TODO 
    # update a list of stations 
    return

@view_config(route_name= prefix, renderer='json', request_method = 'GET')
def getListStations(request):
    # TODO 
    # return list of stations 
    # can search/filter
    return

@view_config(route_name= prefix, renderer='json', request_method = 'POST')
def insertListStations(request):
    # TODO 
    # insert mupltiple new stations
    return


@view_config(route_name= prefix+'/id', renderer='json', request_method = 'PUT')
def updateStation(request):
    # TODO 
    # update the station by id
    return

@view_config(route_name= prefix+'/id', renderer='json', request_method = 'GET')
def getStation(request):
    # TODO 
    # return a station by id 
    return

@view_config(route_name= prefix+'/id', renderer='json', request_method = 'POST')
def insertStation(request):
    # TODO 
    # insert new station
    return

