import datetime
from decimal import Decimal
from urllib.parse import quote_plus
from sqlalchemy import engine_from_config
from pyramid.config import Configurator
from pyramid.renderers import JSON
from pyramid.authorization import ACLAuthorizationPolicy
from pyramid.events import NewRequest
from sqlalchemy.orm import sessionmaker, scoped_session

from .core import SecurityRoot
from .core.init_db import Base, BaseExport, initialize_session, initialize_session_export, dbConfig
from .core.security import include_jwt_policy
from .utils import loadThesaurusTrad
from .utils.callback import add_cors_headers_response_callback, session_callback
from .modules.url_dispatch import add_routes

from .renderers.csvrenderer import CSVRenderer
from .renderers.pdfrenderer import PDFrenderer
from .renderers.gpxrenderer import GPXRenderer


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


def main(global_config, **settings):
    """ This function initialze DB conection and returns a Pyramid WSGI application. """

    config = Configurator(settings=settings)
    config.include('pyramid_tm')
    config.include('pyramid_jwtauth')

    engine = initialize_session(settings)
    config.registry.dbmaker = scoped_session(sessionmaker(bind=engine, autoflush=False))

    engineExport = initialize_session_export(settings)
    if engineExport is not None:
        config.registry.dbmakerExport = scoped_session(
                sessionmaker(bind=engineExport))

    config.add_request_method(session_callback, name='dbsession', reify=True)

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

    include_jwt_policy(config)
    config.set_root_factory(SecurityRoot)

    config.add_subscriber(add_cors_headers_response_callback, NewRequest)

    loadThesaurusTrad(config)
    add_routes(config)
    config.scan()

    return config.make_wsgi_app()
