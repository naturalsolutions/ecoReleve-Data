from pyramid.view import view_config
from pyramid.security import NO_PERMISSION_REQUIRED
from ..Models import sendLog


def add_cors_headers_response_callback(event):
    def cors_headers(request, response):
        response.headers.update({
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST,GET,DELETE,PUT,OPTIONS',
            'Access-Control-Allow-Headers': 'Origin,\
                                            Content-Type,\
                                            Accept,\
                                            Authorization',
            'Access-Control-Allow-Credentials': 'true',
            'Access-Control-Max-Age': '1728000',
        })
    event.request.add_response_callback(cors_headers)


@view_config(context=Exception, permission=NO_PERMISSION_REQUIRED)
def error_view(exc, request):
    sendLog(logLevel=5, domaine=3)
    return exc


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
        'autocomplete/taxon', 'ecoReleve-Core/autocomplete/taxon')
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


""" TODO set dynamically route from ClassController"""
