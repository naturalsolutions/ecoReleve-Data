import datetime
from decimal import Decimal
from urllib.parse import quote_plus
from sqlalchemy import engine_from_config
from pyramid.config import Configurator
from pyramid.renderers import JSON
from pyramid.authorization import ACLAuthorizationPolicy
from .controllers.security import myJWTAuthenticationPolicy
from .controllers.ApiController import SecurityRoot
from .renderers.csvrenderer import CSVRenderer
from .renderers.pdfrenderer import PDFrenderer
from .renderers.gpxrenderer import GPXRenderer
from .Models import (
    Base,
    BaseExport,
    dbConfig,
    db,
    loadThesaurusTrad,
    groupfinder
)
from .Views import add_routes, add_cors_headers_response_callback
from pyramid.events import NewRequest
from sqlalchemy.orm import sessionmaker, scoped_session
from .utils.adapters import *


def includeme(config):
    authz_policy = ACLAuthorizationPolicy()
    config.set_authorization_policy(authz_policy)

    settings = config.get_settings()
    authn_policy = myJWTAuthenticationPolicy.from_settings(settings)
    authn_policy.find_groups = groupfinder
    config.set_authentication_policy(authn_policy)
    config.set_default_permission('read')
    config.add_forbidden_view(authn_policy.challenge)


def init_db(config, settings):

    if 'mssql' in settings['cn.dialect']:
        settings['sqlalchemy.Export.url'] = settings['cn.dialect'] + \
            quote_plus(settings['sqlalchemy.Export.url'])
        engineExport = engine_from_config(
            settings, 'sqlalchemy.Export.', legacy_schema_aliasing=True)
    else:
        engineExport = engine_from_config(
            settings, 'sqlalchemy.Export.')

    if 'mssql' in settings['cn.dialect']:
        settings['sqlalchemy.default.url'] = settings['cn.dialect'] + \
            quote_plus(settings['sqlalchemy.default.url'])
        engine = engine_from_config(
            settings, 'sqlalchemy.default.', legacy_schema_aliasing=True)
    else:
        engine = engine_from_config(
            settings, 'sqlalchemy.default.')

    config.registry.dbmaker = scoped_session(
        sessionmaker(bind=engine, autoflush=False))
    dbConfig['dbSession'] = scoped_session(sessionmaker(bind=engine))
    config.add_request_method(db, name='dbsession', reify=True)

    Base.metadata.bind = engine
    Base.metadata.create_all(engine)
    Base.metadata.reflect(views=True, extend_existing=False)

    if 'loadExportDB' in settings and settings['loadExportDB'] == 'False':
        print('''
            /!\================================/!\
            WARNING :
            Export DataBase NOT loaded, Export Functionality will not working
            /!\================================/!\ \n''')
    else:
        BaseExport.metadata.bind = engineExport
        BaseExport.metadata.create_all(engineExport)
        BaseExport.metadata.reflect(views=True, extend_existing=False)
        config.registry.dbmakerExport = scoped_session(
            sessionmaker(bind=engineExport))

    return engine


def main(global_config, **settings):
    """ This function initialze DB conection and returns a Pyramid WSGI application. """

    dbConfig['url'] = settings['sqlalchemy.default.url']
    dbConfig['wsThesaurus'] = {}
    dbConfig['wsThesaurus']['wsUrl'] = settings['wsThesaurus.wsUrl']
    dbConfig['wsThesaurus']['lng'] = settings['wsThesaurus.lng']
    dbConfig['data_schema'] = settings['data_schema']

    config = Configurator(settings=settings)
    config.include('pyramid_tm')
    config.include('pyramid_jwtauth')

    init_db(config, settings)
    # Add renderer for JSON objects
    json_renderer = JSON()
    json_renderer.add_adapter(datetime.datetime, datetime_adapter)
    # json_renderer.add_adapter(datetime.date, datetime_adapter)
    json_renderer.add_adapter(Decimal, decimal_adapter)
    json_renderer.add_adapter(datetime.time, time_adapter)
    json_renderer.add_adapter(datetime.date, date_adapter)
    config.add_renderer('json', json_renderer)

    # Add renderer for CSV, PDF,GPX files.
    config.add_renderer('csv', CSVRenderer)
    config.add_renderer('pdf', PDFrenderer)
    config.add_renderer('gpx', GPXRenderer)

    # include security config from jwt __init__.py
    includeme(config)
    config.set_root_factory(SecurityRoot)

    def add_cors_headers_response_callback(event):

        def cors_headers(request, response):
            print('\n\n pass \n\n')
            if 'HTTP_ORIGIN' in request.environ:
                response.headers['Access-Control-Allow-Origin'] = (
                    request.headers['Origin'])

            response.headers['Access-Control-Expose-Headers'] = (
                'Content-Type, Date, Content-Length, Authorization, X-Request-ID, X-Requested-With')
            response.headers['Access-Control-Allow-Credentials'] = 'true'
            response.headers['Access-Control-Allow-Headers'] = 'Access-Control-Allow-Origin, Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers'
            response.headers['Access-Control-Allow-Methods'] = (
                'POST,GET,DELETE,PUT,OPTIONS')
            return response
        event.request.add_response_callback(cors_headers)

    from pyramid.events import NewRequest
    config.add_subscriber(add_cors_headers_response_callback, NewRequest)

    loadThesaurusTrad(config)

    add_routes(config)
    config.scan()

    return config.make_wsgi_app()
