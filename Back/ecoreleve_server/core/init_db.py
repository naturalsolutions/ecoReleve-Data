from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import engine_from_config
from sqlalchemy.orm import sessionmaker, scoped_session

from sqlalchemy.engine.url import URL

from ecoreleve_server.modules import import_submodule


def get_redis_con():
    try:
        import redis
        pool = redis.ConnectionPool(host='localhost', db=0)
        localRedis = redis.StrictRedis(connection_pool=pool)
    except:
        localRedis = None
    return localRedis


class myBase:
    __table_args__ = {'implicit_returning': False}

#TODO should remove this global variable not safe 
Base = declarative_base(cls=myBase) 
BaseExport = declarative_base()
dbConfig = {'dialect': 'mssql'}


def initialize_engines(settings, config):
    # CHECK DB WILL USE
    dbsUsed = check_db_used(config, settings) 

    # will store infos for futur use
    load_db_config(settings, dbsUsed)

    engines = {}
    for db in dbsUsed:
        engines[db] = None
        build_urlConnectionsString(settings, db)
        engines[db] = create_engine(settings, db)

    for key in engines:
        enginetmp = engines[key]
        init_session_factory_and_bind_it(enginetmp, key, config)
    

    # Base.metadata.bind = engines['MAIN_DB']
    # dbConfig['dbSession'] = scoped_session(sessionmaker(bind=engines['MAIN_DB'], autoflush=False))
    # import_submodule()
    # Base.metadata.create_all(engines['MAIN_DB'])
    # Base.metadata.reflect(views=True, extend_existing=False)

    # BaseExport.metadata.bind = engines['EXPORT_DB']
    # BaseExport.metadata.create_all(engines['EXPORT_DB'])
    # BaseExport.metadata.reflect(views=True, extend_existing=False)

    return engines


def check_db_used(config, settings):
    dbPossible = ['MAIN_DB', 'SENSOR_DB', 'EXPORT_DB', 'LOG_DB']
    dbsUsed = []

    for item in dbPossible:
        if 'DBUSED.' + item not in settings:
            raise SystemExit('Error: Your config file should have DBUSED.' + item + ' = True or False')
        else:
            if settings.get('DBUSED.' + item) == 'True':
                dbsUsed.append(item)
    setattr(config.registry, 'dbUsed', dbsUsed) # save the list of db used for application
    return dbsUsed


def load_db_config(settings, dbs):
    dbConfig['wsThesaurus'] = {}
    dbConfig['wsThesaurus']['wsUrl'] = settings['wsThesaurus.wsUrl']
    dbConfig['wsThesaurus']['lng'] = settings['wsThesaurus.lng']
    dbConfig['data_schema'] = settings['data_schema']
    dbConfig['sensor_schema'] = settings['sensor_schema']
    # dbConfig['cn.dialect'] = settings['cn.dialect']
    dbConfig['dbLog.url'] = settings['dbLog.url']
    dbConfig['dbLog.schema'] = settings['dbLog.schema']
    
    for item in dbs:
        dbConfig[item] = {}
        dbConfig[item]['dialect'] = settings.get(item + '.DIALECT')


def build_urlConnectionsString(settings, db):
    """ Will create connection string with URL method from sqlalchemy.engine.url with values set in *.ini config file
        and append it in settings dict with concatenate ('sqlalchemy.' + db + '.url') as key

        :params settings: dict created from *.ini config file.

        :params db: ''META name of db used'' could be MAIN_DB, SENSOR_DB, EXPORT_DB, LOG_DB.
    """
    dbConfig[db]['url'] = URL(
                                drivername=settings.get(db + '.DIALECT'),
                                username=settings.get(db + '.UID'),
                                password=settings.get(db + '.PWD'),
                                host=settings.get(db + '.SERVER'),
                                port=settings.get(db + '.PORT'),
                                database=settings.get(db + '.DATABASE'),
                                query=dict(driver=settings.get(db + '.ODBCDRIVER')))
    settings['sqlalchemy.' + db + '.url'] = dbConfig[db]['url']


def create_engine(settings, db):
    """ Will create a SQLAlchemy Engine instance.

        :params settings: dict created from *.ini config file.

        :params db: ''META name of db used'' could be MAIN_DB, SENSOR_DB, EXPORT_DB, LOG_DB.
    """
    tmpEngine = None
    tmpEngine = engine_from_config(configuration=settings,
                            prefix='sqlalchemy.' + db + '.',
                            legacy_schema_aliasing=True,
                            implicit_returning=False)                  

    return tmpEngine


def init_session_factory_and_bind_it(engine, key, config):
    """ Will create a session factory with sessionmaker for an given engine and
        set it as an attribute composed by concatenate (key +'maker') in pyramid registry app.

        :param engine: SQLAlchemy Engine instance.

        :param key: ''META name of db used'' could be MAIN_DB, SENSOR_DB, EXPORT_DB, LOG_DB.

        :param config: Pyramid Configurator instance.
    """
    setattr(config.registry, key + 'maker', sessionmaker(bind=engine, autoflush=False))
    setattr(config.registry, key + 'engine', engine)

