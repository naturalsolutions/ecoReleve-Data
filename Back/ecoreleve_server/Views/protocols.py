from pyramid.view import view_config


prefix = 'protocols'
@view_config(route_name= prefix, renderer='json', request_method = 'PUT')
def updateListProtocols(request):
    # TODO 
    # update a list of protocols 
    return

@view_config(route_name= prefix, renderer='json', request_method = 'GET')
def getListProtocols(request):
    # TODO 
    # return list of protocols
    # can search/filter
    return

@view_config(route_name= prefix, renderer='json', request_method = 'POST')
def insertListProtocols(request):
    # TODO 
    # insert mupltiple new protocols
    return

@view_config(route_name= prefix+'/name', renderer='json', request_method = 'PUT')
def updateListProtocol(request):
    # TODO 
    # update a list of protocol by name
    return

@view_config(route_name= prefix+'/name', renderer='json', request_method = 'GET')
def getListProtocol(request):
    # TODO 
    # return a list of protocol by name
    return

@view_config(route_name= prefix+'/name', renderer='json', request_method = 'POST')
def insertProtocol(request):
    # TODO
    # insert new protocol
    return

@view_config(route_name= prefix+'/name/id', renderer='json', request_method = 'PUT')
def updateProtocol(request):
    # TODO 
    # update the protocol by id
    return

@view_config(route_name= prefix+'/name/id', renderer='json', request_method = 'GET')
def getProtocol(request):
    # TODO 
    # return a protocol by id
    return
