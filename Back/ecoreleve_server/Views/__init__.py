

def add_routes(config):
    config.add_route('weekData', 'ecoReleve-Sensor/weekData')
    
    ##### Security routes #####
    config.add_route('security/login', 'ecoReleve-Core/security/login')
    config.add_route('security/logout', 'ecoReleve-Core/security/logout')
    config.add_route('security/has_access', 'ecoReleve-Core/security/has_access')

    ##### User #####
    config.add_route('core/user', 'ecoReleve-Core/user')
    config.add_route('core/currentUser', 'ecoReleve-Core/currentUser')

    ##### Monitored sites #####
    config.add_route('monitoredSites/id', 'ecoReleve-Core/monitoredSites')
    config.add_route('monitoredSites/id', 'ecoReleve-Core/monitoredSites/{id}')
    

    ##### Stations #####
    config.add_route('station/area', 'ecoReleve-Core/area')
    config.add_route('station/locality', 'ecoReleve-Core/locality')
    config.add_route('station', 'ecoReleve-Core/station') # list of existing station
    config.add_route('station/id', 'ecoReleve-Core/station/{id}')

    ##### Protocols #####
    config.add_route('protocol', 'ecoReleve-Core/protocol') # list of existing protocols
    config.add_route('protocol', 'ecoReleve-Core/protocol/{name}') # list of iteration for a given protocol
    config.add_route('protocol', 'ecoReleve-Core/protocol/{name}/{id}')





