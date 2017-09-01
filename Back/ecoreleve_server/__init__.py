import datetime
from decimal import Decimal
from urllib.parse import quote_plus
from sqlalchemy import engine_from_config
from pyramid.config import Configurator
from pyramid.renderers import JSON
from pyramid.authorization import ACLAuthorizationPolicy
from .controllers.security import SecurityRoot, myJWTAuthenticationPolicy
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


def datetime_adapter(obj, request):
    """Json adapter for datetime objects."""
    try:
        return obj.strftime('%d/%m/%Y %H:%M:%S')
    except:
        return obj.strftime('%d/%m/%Y')


def date_adapter(obj, request):
    """Json adapter for datetime objects."""
    try:
        return obj.strftime('%d/%m/%Y')
    except:
        return obj


def time_adapter(obj, request):
    """Json adapter for datetime objects."""
    try:
        return obj.strftime('%H:%M')
    except:
        return obj.strftime('%H:%M:%S')


def decimal_adapter(obj, request):
    """Json adapter for Decimal objects."""
    return float(obj)


def includeme(config):
    authz_policy = ACLAuthorizationPolicy()
    config.set_authorization_policy(authz_policy)

    settings = config.get_settings()
    authn_policy = myJWTAuthenticationPolicy.from_settings(settings)
    authn_policy.find_groups = groupfinder
    config.set_authentication_policy(authn_policy)
    config.set_default_permission('read')
    config.add_forbidden_view(authn_policy.challenge)


def main(global_config, **settings):
    """ This function initialze DB conection and returns a Pyramid WSGI application. """

    settings['sqlalchemy.Export.url'] = settings['cn.dialect'] + \
        quote_plus(settings['sqlalchemy.Export.url'])
    engineExport = engine_from_config(
        settings, 'sqlalchemy.Export.', legacy_schema_aliasing=True)

    settings['sqlalchemy.default.url'] = settings['cn.dialect'] + \
        quote_plus(settings['sqlalchemy.default.url'])
    engine = engine_from_config(
        settings, 'sqlalchemy.default.', legacy_schema_aliasing=True)

    dbConfig['url'] = settings['sqlalchemy.default.url']
    dbConfig['wsThesaurus'] = {}
    dbConfig['wsThesaurus']['wsUrl'] = settings['wsThesaurus.wsUrl']
    dbConfig['wsThesaurus']['lng'] = settings['wsThesaurus.lng']
    dbConfig['data_schema'] = settings['data_schema']

    config = Configurator(settings=settings)
    config.include('pyramid_tm')
    config.include('pyramid_jwtauth')

    config.registry.dbmaker = scoped_session(sessionmaker(bind=engine, autoflush=False))
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

    config.add_subscriber(add_cors_headers_response_callback, NewRequest)

    loadThesaurusTrad(config)
    add_routes(config)
    config.scan()
    return config.make_wsgi_app()
