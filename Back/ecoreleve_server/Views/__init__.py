


### test if the match url is integer
def integers(*segment_names):
    def predicate(info, request):
        match = info['match']
        for segment_name in segment_names:
            try:
                print (segment_names)
                match[segment_name] = int(match[segment_name])
                if int(match[segment_name]) == 0 :
                    print(' ****** ACTIONS FORMS ******')
                    return False
            except (TypeError, ValueError):
                return False
        return True
    return predicate

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
    config.add_route('stations', 'ecoReleve-Core/stations/') 
    config.add_route('stations/id', 'ecoReleve-Core/stations/{id}',custom_predicates = (integers('id'),))
    config.add_route('stations/action', 'ecoReleve-Core/stations/{action}') 
    config.add_route('stations/id/protocols', 'ecoReleve-Core/stations/{id}/protocols',custom_predicates = (integers('id'),))
    config.add_route('stations/id/protocols/obs_id', 'ecoReleve-Core/stations/{id}/protocols/{obs_id}',custom_predicates = (integers('id'),))

    ##### Protocols #####
    # config.add_route('protocols', 'ecoReleve-Core/protocols')
    config.add_route('protocols', 'ecoReleve-Core/protocols/')
    config.add_route('protocols/id', 'ecoReleve-Core/protocols/{id}',custom_predicates = (integers('id'),)) 
    config.add_route('protocols/action', 'ecoReleve-Core/protocols/{action}') 

    config.add_route('observation/id', 'ecoReleve-Core/observations/{id}')
    config.add_route('observation', 'ecoReleve-Core/observations')

     ##### Protocols types #####
    config.add_route('protocolTypes', 'ecoReleve-Core/protocolTypes')


    ##### Sensors datas (Argos + GSM + RFID) #####
    config.add_route('sensors/datas', 'ecoReleve-Sensor/{type}/datas')
    config.add_route('sensors/id/datas', 'ecoReleve-Sensor/{type}/{id}/datas')

    ##### Sensors caracteristics(Argos + GSM + RFID) #####
    config.add_route('sensors', 'ecoReleve-Sensor/{type}')
    config.add_route('sensors/id', 'ecoReleve-Sensor/{type}/{id}')







