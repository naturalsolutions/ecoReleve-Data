import datetime
from decimal import Decimal
import exiftool
from pyramid.config import Configurator
from pyramid.renderers import JSON
from pyramid.events import NewRequest
# from ecoreleve_server.database.meta import dbConfig
from ecoreleve_server.core import SecurityRoot
from .utils import loadThesaurusTrad
from .utils.callback import (
    add_cors_headers_response_callback,
    session_callback
)
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


def initialize_exiftool():
    mySubExif = exiftool.ExifTool()
    mySubExif.start()


def main(global_config, **settings):
    """ This function initialze DB conection and returns a Pyramid WSGI application. """
    with Configurator(settings=settings) as config:
        '''
        https://docs.pylonsproject.org/projects/pyramid/en/latest/narr/startup.html#deployment-settings
        request.registry.settings
        will replace all dbconfig[key]=value
        when i have time to refact

        '''
        config.include('ecoreleve_server.dependencies') # FIRST FILE TO INCLUDE
        config.include('ecoreleve_server.database')
        config.include('ecoreleve_server.core.policy')
        config.include("ecoreleve_server.modules.dashboard")
        config.include("ecoreleve_server.modules.export")
        config.include("ecoreleve_server.modules.field_activities")
        config.include("ecoreleve_server.modules.import_module")
        config.include("ecoreleve_server.modules.individuals")
        config.include("ecoreleve_server.modules.media_files")
        config.include("ecoreleve_server.modules.monitored_sites")
        config.include("ecoreleve_server.modules.observations")
        config.include("ecoreleve_server.modules.regions")
        config.include("ecoreleve_server.modules.release")
        config.include("ecoreleve_server.modules.sensors")
        config.include("ecoreleve_server.modules.stations")
        config.include("ecoreleve_server.modules.users")

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

        config.set_root_factory(SecurityRoot)

        if ( settings.get('init_exiftool', 'False') == 'False'):
            print('Exiftool not initialized')
            pass
        else:
            initialize_exiftool()
        config.add_subscriber(add_cors_headers_response_callback, NewRequest)
        config.include("ecoreleve_server.utils.init_cameratrap_path")
        loadThesaurusTrad(config)
        config.include('ecoreleve_server.traversal')
        config.include('ecoreleve_server.modules.url_dispatch')
        config.scan()

    return config.make_wsgi_app()
