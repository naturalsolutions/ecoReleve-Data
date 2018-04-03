import datetime
from decimal import Decimal
from urllib.parse import quote_plus
from sqlalchemy import engine_from_config
from pyramid.config import Configurator
from pyramid.renderers import JSON
from pyramid.authorization import ACLAuthorizationPolicy
from .controllers.security import SecurityRoot, myJWTAuthenticationPolicy
import os,sys
import errno
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
import exiftool
import pytesseract

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

# print("create sub")
mySubExif = exiftool.ExifTool()
mySubExif.start()
# print("running ?",mySubExif.running)
# print("create tesseract")
# pytesseract.pytesseract.tesseract_cmd = 'C:/Program Files (x86)/Tesseract-OCR/tesseract'
# mySubTesseract = pytesseract
# # mySubTesseract = pytesseract
# print("end")


def addCamTrapModule(settings):
    dbConfig['camTrap'] = {}
    if 'camTrap.path' in settings:
        dbConfig['camTrap']['path'] = settings['camTrap.path']
    else :
        print("camera trap module not activated")    
        return

    if(os.path.exists(dbConfig['camTrap']['path']) ):
        try :
            os.access( dbConfig['camTrap']['path'], os.W_OK)
            print("folder : %s exist" %(dbConfig['camTrap']['path']))
        except :
            print("app cant write in this directory ask your admin %s" %(dbConfig['camTrap']['path']) )
            raise
            #declenché erreur
    else:
        print ("folder %s doesn't exist we gonna try to create it" %(dbConfig['camTrap']['path']))
        try:
            os.makedirs(dbConfig['camTrap']['path'])
            print("folder created : %s" %(dbConfig['camTrap']['path']))
            os.makedirs(os.path.join(dbConfig['camTrap']['path'],'export'))
            print("folder created : %s" %(os.path.join(dbConfig['camTrap']['path'],'export')))
        except OSError as exception:
            if exception.errno != errno.EEXIST:
                raise
    
    if(os.path.exists(os.path.join(dbConfig['camTrap']['path'],'export')) ):
        try :
            os.access( os.path.join(dbConfig['camTrap']['path'],'export'), os.W_OK)
            print("folder : %s exist" %(os.path.join(dbConfig['camTrap']['path'],'export')))
        except :
            print("app cant write in this directory ask your admin %s" %(os.path.join(dbConfig['camTrap']['path'],'export')) )
            raise
            #declenché erreur
    else:
        print ("folder %s doesn't exist we gonna try to create it" %(os.path.join(dbConfig['camTrap']['path'],'export')))
        try:
            os.makedirs(os.path.join(dbConfig['camTrap']['path'],'export'))
            print("folder created : %s" %(os.path.join(dbConfig['camTrap']['path'],'export')))
        except OSError as exception:
            if exception.errno != errno.EEXIST:
                raise

def addMediaFileModule(settings):
    dbConfig['mediasFiles'] = {}
    dbConfig['mediasFiles']['path'] = settings['mediasFiles.path']   
    if dbConfig['mediasFiles'] == {}:
        print("media files protocole not activated")
        raise SystemExit
        return
    if(os.path.exists(dbConfig['mediasFiles']['path']) ):
        try :
            os.access( dbConfig['mediasFiles']['path'], os.W_OK)
            print("folder : %s exist" %(dbConfig['mediasFiles']['path']))
        except :
            print("app cant write in this directory ask your admin %s" %(dbConfig['mediasFiles']['path']) )
            raise
            #declenché erreur
    else:
        print ("folder %s doesn't exist we gonna try to create it" %(dbConfig['mediasFiles']['path']))
        try:
            os.makedirs(dbConfig['mediasFiles']['path'])
            print("folder created : %s" %(dbConfig['mediasFiles']['path']))
        except OSError as exception:
            if exception.errno != errno.EEXIST:
                raise


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

    addCamTrapModule(settings)



    # dbConfig['camTrap'] = {}
    # dbConfig['camTrap']['path'] = settings['camTrap.path']
    # dbConfig['mediasFiles'] = {}
    # dbConfig['mediasFiles']['path'] = settings['mediasFiles.path']

    # if(os.path.exists(dbConfig['camTrap']['path']) ):
    #     try :
    #         os.access( dbConfig['camTrap']['path'], os.W_OK)
    #         print("folder : %s exist" %(dbConfig['camTrap']['path']))
    #     except :
    #         print("app cant write in this directory ask your admin %s" %(dbConfig['camTrap']['path']) )
    #         raise
    #         #declenché erreur
    # else:
    #     print ("folder %s doesn't exist we gonna try to create it" %(dbConfig['camTrap']['path']))
    #     try:
    #         os.makedirs(dbConfig['camTrap']['path'])
    #         print("folder created : %s" %(dbConfig['camTrap']['path']))
    #         os.makedirs(os.path.join(dbConfig['camTrap']['path'],'export'))
    #         print("folder created : %s" %(os.path.join(dbConfig['camTrap']['path'],'export')))
    #     except OSError as exception:
    #         if exception.errno != errno.EEXIST:
    #             raise
    
    # if(os.path.exists(os.path.join(dbConfig['camTrap']['path'],'export')) ):
    #     try :
    #         os.access( os.path.join(dbConfig['camTrap']['path'],'export'), os.W_OK)
    #         print("folder : %s exist" %(os.path.join(dbConfig['camTrap']['path'],'export')))
    #     except :
    #         print("app cant write in this directory ask your admin %s" %(os.path.join(dbConfig['camTrap']['path'],'export')) )
    #         raise
    #         #declenché erreur
    # else:
    #     print ("folder %s doesn't exist we gonna try to create it" %(os.path.join(dbConfig['camTrap']['path'],'export')))
    #     try:
    #         os.makedirs(os.path.join(dbConfig['camTrap']['path'],'export'))
    #         print("folder created : %s" %(os.path.join(dbConfig['camTrap']['path'],'export')))
    #     except OSError as exception:
    #         if exception.errno != errno.EEXIST:
    #             raise

    # if(os.path.exists(dbConfig['mediasFiles']['path']) ):
    #     try :
    #         os.access( dbConfig['mediasFiles']['path'], os.W_OK)
    #         print("folder : %s exist" %(dbConfig['mediasFiles']['path']))
    #     except :
    #         print("app cant write in this directory ask your admin %s" %(dbConfig['mediasFiles']['path']) )
    #         raise
    #         #declenché erreur
    # else:
    #     print ("folder %s doesn't exist we gonna try to create it" %(dbConfig['mediasFiles']['path']))
    #     try:
    #         os.makedirs(dbConfig['mediasFiles']['path'])
    #         print("folder created : %s" %(dbConfig['mediasFiles']['path']))
    #     except OSError as exception:
    #         if exception.errno != errno.EEXIST:
    #             raise

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

    # from .Models.Region import getGeomRegion
    # getGeomRegion(dbConfig['dbSession']())
    return config.make_wsgi_app()
