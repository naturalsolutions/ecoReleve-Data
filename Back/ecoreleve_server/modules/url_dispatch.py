def add_routes(config):
    
    config.add_route('weekData', 'ecoReleve-Core/weekData')
    config.add_route('location_graph',
                     'ecoReleve-Core/individuals/location/graph')
    config.add_route('station_graph', 'ecoReleve-Core/stations/graph')
    config.add_route('individual_graph',
                     'ecoReleve-Core/stats/individuals/graph')
    config.add_route('individual_monitored',
                     'ecoReleve-Core/stats/individuals/monitored/graph')
    config.add_route('uncheckedDatas_graph',
                     'ecoReleve-Core/sensor/uncheckedDatas/graph')

    config.add_route('jsLog', 'ecoReleve-Core/log/error')

    # Security routes
    config.add_route('security/login', 'ecoReleve-Core/security/login')
    config.add_route('security/logout', 'ecoReleve-Core/security/logout')
    config.add_route('security/has_access',
                     'ecoReleve-Core/security/has_access')

    # User
    config.add_route('users/id', 'ecoReleve-Core/users/{id}')
    config.add_route('core/user', 'ecoReleve-Core/user')
    config.add_route('core/currentUser', 'ecoReleve-Core/currentUser')
    config.add_route('autocomplete/onLoad',
                     'ecoReleve-Core/autocomplete/{obj}/{prop}/onLoad')
    config.add_route(
        'autocomplete', 'ecoReleve-Core/autocomplete/{obj}/{prop}')
    config.add_route('autocomplete/ID',
                     'ecoReleve-Core/autocomplete/{obj}/{prop}/{valReturn}')

    # Sensors datas (Argos + GSM + RFID)
    config.add_route('sensors/datas', 'ecoReleve-Core/sensors/{type}/datas')
    config.add_route('sensors/uncheckedDatas',
                     'ecoReleve-Core/sensors/{type}/uncheckedDatas')
    config.add_route('sensors/uncheckedDatas/id_indiv/ptt',
                     'ecoReleve-Core/sensors/{type}/uncheckedDatas/{id_indiv}/{id_ptt}')