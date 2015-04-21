

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
    config.add_route('monitoredSites', 'ecoReleve-Core/monitoredSites')
    config.add_route('monitoredSites/id', 'ecoReleve-Core/monitoredSites/{id}')

    ##### Stations #####
    config.add_route('area', 'ecoReleve-Core/area')
    config.add_route('locality', 'ecoReleve-Core/locality')
    config.add_route('stations', 'ecoReleve-Core/stations') 
    config.add_route('stations/id', 'ecoReleve-Core/stations/{id}')

    ##### Protocols #####
    config.add_route('protocols', 'ecoReleve-Core/protocols')
    config.add_route('protocols/name', 'ecoReleve-Core/protocols/{name}')
    config.add_route('protocols/name/id', 'ecoReleve-Core/protocols/{name}/{id}')

    config.add_route('observation/id', 'ecoReleve-Core/observations/{id}')
    config.add_route('observation', 'ecoReleve-Core/observations')

    ##### Sensors datas (Argos + GSM + RFID) #####
    config.add_route('sensors/datas', 'ecoReleve-Sensor/{type}/datas')
    config.add_route('sensors/id/datas', 'ecoReleve-Sensor/{type}/{id}/datas')

    ##### Sensors caracteristics(Argos + GSM + RFID) #####
    config.add_route('sensors', 'ecoReleve-Sensor/{type}')
    config.add_route('sensors/id', 'ecoReleve-Sensor/{type}/{id}')







