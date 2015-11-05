from pyramid.httpexceptions import default_exceptionresponse_view, HTTPNotFound
from pyramid.interfaces import IRoutesMapper

def notfound(request):
    return HTTPNotFound('Not found')

### test if the match url is integer
def integers(*segment_names):
    def predicate(info, request):
        match = info['match']
        for segment_name in segment_names:
            try:
                print (segment_names)
                match[segment_name] = int(match[segment_name])
                if int(match[segment_name]) == 0 :
                    return False
            except (TypeError, ValueError):
                return False
        return True
    return predicate

def add_routes(config):

    config.add_route('weekData', 'ecoReleve-Sensor/weekData')

    # ------------------------------------------------------------------------------------------------------------------------- #
    ##### Security routes #####
    config.add_route('security/login', 'ecoReleve-Core/security/login')
    config.add_route('security/logout', 'ecoReleve-Core/security/logout')
    config.add_route('security/has_access', 'ecoReleve-Core/security/has_access')

    # ------------------------------------------------------------------------------------------------------------------------- #
    ##### User #####
    config.add_route('core/user', 'ecoReleve-Core/user')
    config.add_route('core/currentUser', 'ecoReleve-Core/currentUser')

    # ------------------------------------------------------------------------------------------------------------------------- #
    ##### Stations #####
    config.add_route('area', 'ecoReleve-Core/area')
    config.add_route('locality', 'ecoReleve-Core/locality')
    config.add_route('stations', 'ecoReleve-Core/stations/') 
    #config.add_route('stations/fileImport', 'ecoReleve-Core/stations/fileImport/{id}') 
    config.add_route('stations/id', 'ecoReleve-Core/stations/{id}',custom_predicates = (integers('id'),))
    config.add_route('stations/action', 'ecoReleve-Core/stations/{action}') 

    # ------------------------------------------------------------------------------------------------------------------------- #
    ##### Stations/Protocols #####
    config.add_route('stations/id/protocols', 'ecoReleve-Core/stations/{id}/protocols',custom_predicates = (integers('id'),))
    config.add_route('stations/id/protocols/', 'ecoReleve-Core/stations/{id}/protocols/',custom_predicates = (integers('id'),))
    config.add_route('stations/id/protocols/obs_id', 'ecoReleve-Core/stations/{id}/protocols/{obs_id}',custom_predicates = (integers('id', 'obs_id'),))
    config.add_route('stations/id/protocols/action', 'ecoReleve-Core/stations/{id}/protocols/{action}')

    # ------------------------------------------------------------------------------------------------------------------------- #
    ##### Protocols #####
    # config.add_route('protocols', 'ecoReleve-Core/protocols')
    config.add_route('protocols', 'ecoReleve-Core/protocols/')
    config.add_route('protocols/id', 'ecoReleve-Core/protocols/{id}',custom_predicates = (integers('id'),)) 
    config.add_route('protocols/action', 'ecoReleve-Core/protocols/{action}') 

    # ------------------------------------------------------------------------------------------------------------------------- #
    ##### Protocols types #####
    config.add_route('protocolTypes', 'ecoReleve-Core/protocolTypes')

    # ------------------------------------------------------------------------------------------------------------------------- #
    ##### FieldActivity ##### 
    config.add_route('fieldActivity', 'ecoReleve-Core/fieldActivity')
    
    # -----------------------------##### Sensors datas (Argos + GSM + RFID) #####----------------------------------------------------- #
    
    config.add_route('sensors/datas', 'ecoReleve-Core/sensors/{type}/datas')
    config.add_route('sensors/uncheckedDatas', 'ecoReleve-Core/sensors/{type}/uncheckedDatas')
    config.add_route('sensors/uncheckedDatas/id_indiv/ptt', 'ecoReleve-Core/sensors/{type}/uncheckedDatas/{id_indiv}/{id_ptt}')

    # ------------------------------------------------------------------------------------------------------------------------- #
    ##### Sensors caracteristics(Argos + GSM + RFID) #####
    
    config.add_route('sensors', 'ecoReleve-Core/sensors/') 
    config.add_route('sensors/insert', 'ecoReleve-Core/sensors') 
    config.add_route('sensors/export', 'ecoReleve-Core/sensors/export')
    config.add_route('sensors/id', 'ecoReleve-Core/sensors/{id}',custom_predicates = (integers('id'),))
    config.add_route('sensors/id/history', 'ecoReleve-Core/sensors/{id}/history',custom_predicates = (integers('id'),))
    config.add_route('sensors/action', 'ecoReleve-Core/sensors/{action}')


    # ------------------------------------------------------------------------------------------------------------------------- #
    ##### Individuals #####
    config.add_route('individuals', 'ecoReleve-Core/individuals/') 
    config.add_route('individuals/insert', 'ecoReleve-Core/individuals')
    config.add_route('individuals/id', 'ecoReleve-Core/individuals/{id}',custom_predicates = (integers('id'),))
    config.add_route('individuals/id/history', 'ecoReleve-Core/individuals/{id}/history',custom_predicates = (integers('id'),))
    config.add_route('individuals/id/equipment', 'ecoReleve-Core/individuals/{id}/equipment',custom_predicates = (integers('id'),))
    config.add_route('individuals/id/history/action', 'ecoReleve-Core/individuals/{id}/history/{action}',custom_predicates = (integers('id'),))
    config.add_route('individuals/id/equipment/action', 'ecoReleve-Core/individuals/{id}/equipment/{action}',custom_predicates = (integers('id'),))
    config.add_route('individuals/action', 'ecoReleve-Core/individuals/{action}') 

    # ------------------------------------------------------------------------------------------------------------------------- #
    ##### MonitoredSite #####
    config.add_route('monitoredSite', 'ecoReleve-Core/monitoredSite/') 
    config.add_route('monitoredSite/', 'ecoReleve-Core/monitoredSite') 
    config.add_route('monitoredSite/id', 'ecoReleve-Core/monitoredSite/{id}',custom_predicates = (integers('id'),))
    config.add_route('monitoredSite/id/history', 'ecoReleve-Core/monitoredSite/{id}/history/',custom_predicates = (integers('id'),))
    config.add_route('monitoredSite/id/equipment', 'ecoReleve-Core/monitoredSite/{id}/equipment',custom_predicates = (integers('id'),))
    config.add_route('monitoredSite/id/history/action', 'ecoReleve-Core/monitoredSite/{id}/history/{action}',custom_predicates = (integers('id'),))
    config.add_route('monitoredSite/id/equipment/action', 'ecoReleve-Core/monitoredSite/{id}/equipment/{action}',custom_predicates = (integers('id'),))
    config.add_route('monitoredSite/action', 'ecoReleve-Core/monitoredSite/{action}') 

    # ------------------------------------------------------------------------------------------------------------------------- #
    ##### Release #####
    config.add_route('release', 'ecoReleve-Core/release/')
    config.add_route('release/individuals', 'ecoReleve-Core/release/individuals/')
    config.add_route('release/individuals/action', 'ecoReleve-Core/release/individuals/{action}')
    config.add_route('release/action', 'ecoReleve-Core/release/{action}')









