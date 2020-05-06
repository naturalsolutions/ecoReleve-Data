from ecoreleve_server.core.init_db import dbConfig

def add_routes(config):
    
    config.add_route('weekData', dbConfig.get('prefixapi')+'/weekData')
    config.add_route('location_graph',
                     dbConfig.get('prefixapi') + '/individuals/location/graph')
    config.add_route('station_graph', dbConfig.get('prefixapi') + '/stations/graph')
    config.add_route('individual_graph',
                     dbConfig.get('prefixapi') + '/stats/individuals/graph')
    config.add_route('individual_monitored',
                     dbConfig.get('prefixapi') + '/stats/individuals/monitored/graph')
    config.add_route('uncheckedDatas_graph',
                     dbConfig.get('prefixapi') + '/sensor/uncheckedDatas/graph')

    config.add_route('jsLog', dbConfig.get('prefixapi') + '/log/error')

    # Security routes
    config.add_route('security/login', dbConfig.get('prefixapi') + '/security/login')
    config.add_route('security/logout', dbConfig.get('prefixapi') + '/security/logout')
    config.add_route('security/has_access',
                     dbConfig.get('prefixapi') + '/security/has_access')

    # User
    config.add_route('users/id', dbConfig.get('prefixapi') + '/users/{id}')
    config.add_route('core/user', dbConfig.get('prefixapi') + '/user')
    config.add_route('core/currentUser', dbConfig.get('prefixapi') + '/currentUser')
    config.add_route('autocomplete/onLoad',
                     dbConfig.get('prefixapi') + '/autocomplete/{obj}/{prop}/onLoad')
    config.add_route(
        'autocomplete', dbConfig.get('prefixapi') + '/autocomplete/{obj}/{prop}')
    config.add_route('autocomplete/ID',
                     dbConfig.get('prefixapi') + '/autocomplete/{obj}/{prop}/{valReturn}')

    # Sensors datas (Argos + GSM + RFID)
    config.add_route('sensors/datas', dbConfig.get('prefixapi') + '/sensors/{type}/datas')
    config.add_route('sensors/uncheckedDatas',
                     dbConfig.get('prefixapi') + '/sensors/{type}/uncheckedDatas')
    config.add_route('sensors/uncheckedDatas/id_indiv/ptt',
                     dbConfig.get('prefixapi') + '/sensors/{type}/uncheckedDatas/{id_indiv}/{id_ptt}')

 # config.add_route('sensors/camtrap/uncheckedDatas',
    #                   dbConfig.get('prefixapi') + '/sensors/camtrap/uncheckedDatas')
    # config.add_route('sensors/uncheckedDatas/id_indiv/ptt',
    #                  dbConfig.get('prefixapi') + '/sensors/{type}/uncheckedDatas/{id_indiv}/{id_ptt}')
    # config.add_route('sensors/uncheckedDatas/id_indiv/ptt/id_equip',
    #                  dbConfig.get('prefixapi') + '/sensors/{type}/uncheckedDatas/{id_indiv}/{id_ptt}/{id_equip}' )
    # config.add_route('sensors/uncheckedDatas/id_indiv/ptt/id_equip/pk_id',
    #                  dbConfig.get('prefixapi') + '/sensors/{type}/uncheckedDatas/{id_indiv}/{id_ptt}/{id_equip}/{pk_id}' )
    # config.add_route('sensors/uncheckedDatas/id_indiv/ptt/id_equip', dbConfig.get('prefixapi') + '/sensors/{type}/uncheckedDatas/{id_indiv}/{id_ptt}/{id_equip}' )
    # config.add_route('sensors/uncheckedDatas/id_indiv/ptt/id_equip/pk_id', dbConfig.get('prefixapi') + '/sensors/{type}/uncheckedDatas/{id_indiv}/{id_ptt}/{id_equip}/{pk_id}' )
    # config.add_route('sensors/cameratrap/validate/sensor_id/site_id/equip_id' , dbConfig.get('prefixapi') + '/cameratrap/validate/{sensor_id}/{site_id}/{equip_id}')

    config.add_route('sensors/statut', dbConfig.get('prefixapi') + '/sensors/{type}/statut')

    config.add_route('cameratrap', dbConfig.get('prefixapi') + '/photos/')
    config.add_route('getSessionZip', dbConfig.get('prefixapi') + '/photos/export/')