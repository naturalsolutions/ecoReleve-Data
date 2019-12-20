from sqlalchemy import engine_from_config
from sqlalchemy.orm import sessionmaker, scoped_session
from ecoreleve_server.database.meta import (
    Base,
    Export_Db_Base,
    # dbConfig
)

from urllib.parse import quote_plus
# from ecoreleve_server.modules import import_submodule
from ecoreleve_server.database import *


# from ecoreleve_server.traversal.database.MAIN_DB.Views import individualequipment


def get_redis_con():
    try:
        import redis
        pool = redis.ConnectionPool(host='localhost', db=0)
        localRedis = redis.StrictRedis(connection_pool=pool)
    except:
        localRedis = None
    return localRedis


# def load_db_config(settings):
#     dbConfig['url'] = settings['sqlalchemy.default.url']
#     dbConfig['wsThesaurus'] = {}
#     dbConfig['wsThesaurus']['wsUrl'] = settings['wsThesaurus.wsUrl']
#     dbConfig['wsThesaurus']['lng'] = settings['wsThesaurus.lng']
#     dbConfig['data_schema'] = settings['data_schema']
#     dbConfig['sensor_schema'] = settings['sensor_schema']
#     dbConfig['cn.dialect'] = settings['cn.dialect']
#     dbConfig['dbLog.url'] = settings['dbLog.url']
#     dbConfig['dbLog.schema'] = settings['dbLog.schema']

# def initialize_session_export(settings):
#     engineExport = None
#     if 'loadExportDB' in settings and settings['loadExportDB'] == 'False':
#             print('''
#             /!\================================/!\
#             WARNING :
#             Export DataBase NOT loaded, Export Functionality will not working
#             /!\================================/!\ \n''')
#     else:
#         settings['sqlalchemy.Export.url'] = settings['cn.dialect'] + quote_plus(settings['sqlalchemy.Export.url'])
#         engineExport = engine_from_config(settings, 'sqlalchemy.Export.', legacy_schema_aliasing=True)
#         BaseExport.metadata.bind = engineExport
#         BaseExport.metadata.create_all(engineExport)
#         BaseExport.metadata.reflect(views=True, extend_existing=False)
#     return engineExport

# def initialize_session(settings):
#     load_db_config(settings)

#     settings['sqlalchemy.default.url'] = settings['cn.dialect'] + \
#         quote_plus(settings['sqlalchemy.default.url'])
#     engine = engine_from_config(
#         settings, 'sqlalchemy.default.', legacy_schema_aliasing=True, implicit_returning=False)

#     Base.metadata.bind = engine
#     dbConfig['dbSession'] = scoped_session(sessionmaker(bind=engine, autoflush=False))
#     # import_submodule()
#     Base.metadata.create_all(engine)
#     Base.metadata.reflect(views=True, extend_existing=False)

#     return engine