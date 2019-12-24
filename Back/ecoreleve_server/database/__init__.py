from sqlalchemy import (
    engine_from_config,
    event
)
from sqlalchemy.engine.url import URL
from sqlalchemy.orm import (
    sessionmaker,
    configure_mappers
)
import zope.sqlalchemy
from ecoreleve_server.database.meta import (
    Main_Db_Base,
    Sensor_Db_Base,
    Export_Db_Base,
    Log_Db_Base
) # noqa
from pyramid.events import NewRequest
from pyramid.events import subscriber

__all__ = [
    "Main_Db_Base",
    "Sensor_Db_Base",
    "Export_Db_Base",
    "Log_Db_Base"
]
'''
you should have this key in your *.ini

DBUSED           = MAIN_DB
MAIN_DB.UID      = username will access
MAIN_DB.PWD      = password for username
MAIN_DB.SERVER   = server adress
MAIN_DB.PORT     = server port
MAIN_DB.DATABASE = database name
'''


# import or define all models here to ensure they are attached to the
# Base.metadata prior to any initialization routines
from .main_db import *     # noqa
from .sensor_db import * # noqa
from ecoreleve_server.core.configuration_model.Business import (
    BusinessRuleError
)

# run configure_mappers after defining all of the models to ensure
# all relationships can be setup
configure_mappers()


def includeme(config):
    myConfig = config.get_settings()

    # myConfig['tm.manager_hook'] = 'pyramid_tm.explicit_manager'

    # use pyramid_tm to hook the transaction lifecycle to the request
    # config.include('pyramid_tm')

    # use pyramid_retry to retry a request when transient exceptions occur
    # config.include('pyramid_retry')

    dbPossible = getDBUsed(myConfig=myConfig)
    engines = createEngines(myConfig=myConfig, dbPossible=dbPossible)

    session_factory = get_session_factory(engines)
    config.registry['dbsession_factory'] = session_factory

    # make request.dbsession available for use in Pyramid
    # config.add_request_method(
    #     # r.tm is the transaction manager used by pyramid_tm
    #     lambda r: get_tm_session(session_factory, r.tm),
    #     'dbsession',
    #     reify=True
    # )

    # createSession() #peut être a mettre en premier ça serait plus top level
    # On a de toute façon une session a binder pour chaque requête
    # (LOL ? peut être pas mais bon)


def checkConfigDBUsed(myConfig):
    if 'DBUSED' not in myConfig:
        raise KeyError('DBUSED key should be present in .ini')

    dbDefineInConfig = myConfig.get('DBUSED', None)
    if dbDefineInConfig is None or dbDefineInConfig == '':
        raise ValueError(
            f'Expected string for DBUSED key got ({dbDefineInConfig}) '
            f'no values please define one db in *.ini'
            )


def getDBUsed(myConfig):

    checkConfigDBUsed(myConfig=myConfig)

    dbDefineInConfig = myConfig.get('DBUSED')
    return dbDefineInConfig.split(',')


def checkConfigURL(configOptions, databaseName):
    keysNeeded = [
        'DATABASE',
        'DIALECT',
        'ODBCDRIVER',
        'PORT',
        'PWD',
        'SERVER',
        'UID',
    ]
    for item in keysNeeded:
        concatKey = '.'.join([databaseName, item])
        if concatKey not in configOptions:
            raise KeyError('{!r} must be defined in *.ini'.format(concatKey))

        valueFind = configOptions.get(concatKey)
        if valueFind is None or valueFind == '':
            raise ValueError(
                'Expected string value for {!r}'.format(concatKey))

def buildConfigURLAccordingToDialect(myConfig, db):
    dialectConfigURL = {
        'drivername': myConfig.get(db + '.DIALECT'),
        'username': myConfig.get(db + '.UID'),
        'password': myConfig.get(db + '.PWD'),
        'host': myConfig.get(db + '.SERVER'),
        'port': myConfig.get(db + '.PORT'),
        'database': myConfig.get(db + '.DATABASE'),
        'query': dict(driver=myConfig.get(db + '.ODBCDRIVER'))
    }
    dialect = dialectConfigURL.get("drivername")
    # When connecting to a SQL Server named instance,
    # need instance name OR port number, not both.
    if 'mssql' in dialect:
        # So if named instance
        if '\\' in dialectConfigURL.get("host"):
            # remove port number
            del dialectConfigURL["port"]
    return dialectConfigURL

def buildURL(myConfig, db):
    """
    Will create connection string with URL
    method from sqlalchemy.engine.url with values set in *.ini config file

    ``myConfig``
        Dict created from *.ini config file.

    ``db``
        META name of db used could be MAIN_DB, SENSOR_DB, EXPORT_DB, LOG_DB.
    """
    checkConfigURL(myConfig, db)    
    dictDialectConfigURL = buildConfigURLAccordingToDialect(myConfig, db)
    return URL(**dictDialectConfigURL)

def createEngines(myConfig, dbPossible):
    engines = {}
    for item in dbPossible:
        engines[item] = engine_from_config(
            configuration=myConfig,
            prefix='sqlalchemy.' + item + '.',
            url=buildURL(myConfig=myConfig, db=item),
            legacy_schema_aliasing=False,
            implicit_returning=False,
            use_scope_identity=False
        )
        mapAndBindEngineWithBaseWeUse(item, engines[item])
        '''
        that shouldn't be here but for now... dont have choice
        '''

    return engines


def mapAndBindEngineWithBaseWeUse(baseName, engineToBind):
    '''
    dunno if it's the good way
    but (maybe it's just for dev and not for production )
    take a coffee and read carefully...
    if we stop execution of script here
    and we looks in globals()
    the class Main_Db_Base is imported and defined
    so we can bind metadata with engine directly
    '''

    # print("et le global ? ? ? ?")
    print(f"Binding Engine for {baseName}_Base")
    eval(str(baseName)+'_Base').metadata.bind = engineToBind
    # will drop all model and recreate it
    # if you need data test youshould restore juste after
    # eval( str(baseName)+'_BASE' ).metadata.drop_all(engineToBind)
    # create models only if table don't exist yet!!
    print(f"Create ALL for {baseName}_Base")
    eval(str(baseName)+'_Base').metadata.create_all(engineToBind)
    print(f"Reflectdatabase {baseName}_Base")
    eval(str(baseName)+'_Base').metadata.reflect(
                                                views=True,
                                                extend_existing=False
                                                )  # scan database


def get_session_factory(engines):
    factory = sessionmaker(autoflush=True)

    # class on fly
    # yeah i know that's not cool
    # engine classes name are dynamical that's all
    engineClassesDict = {}
    for item in engines:
        engineClassesDict[eval(str(item)+'_Base')] = engines[item]

    factory.configure(binds=engineClassesDict)
    return factory


def get_tm_session(session_factory, transaction_manager):
    """
    Get a ``sqlalchemy.orm.Session`` instance backed by a transaction.

    This function will hook the session to the transaction manager which
    will take care of committing any changes.

    - When using pyramid_tm it will automatically be committed or aborted
    depending on whether an exception is raised.

    - When using scripts you should wrap the session in a manager yourself.
    For example::

        import transaction

        engine = get_engine(settings)
        session_factory = get_session_factory(engine)
        with transaction.manager:
        dbsession = get_tm_session(session_factory, transaction.manager)

    """
    dbsession = session_factory()

    @event.listens_for(dbsession, 'before_flush')
    def receive_before_flush(dbsession, flush_context, instances):
        for instance_state, current_instance in dbsession._deleted.items():
            if hasattr(current_instance, 'executeBusinessRules'):
                current_instance.executeBusinessRules('before_delete')

    zope.sqlalchemy.register(
        dbsession, transaction_manager=transaction_manager)
    return dbsession


def get_session(request):
    session = request.registry.get('dbsession_factory')()
    session.begin_nested()

    @event.listens_for(session, 'before_flush')
    def receive_before_flush(session, flush_context, instances):
        for instance_state, current_instance in session._deleted.items():
            if hasattr(current_instance, 'executeBusinessRules'):
                current_instance.executeBusinessRules('before_delete',flush_context)

    def cleanup(request):
        if request.exception is not None:
            session.rollback()
            # cache_callback(request, session)
            session.close()
            # session.remove()
        else:
            try:
                session.commit()
            except BusinessRuleError as e:
                session.rollback()
                request.response.status_code = 409
                request.response.text = e.value
            except Exception as e:
                print_exc()
                session.rollback()
                request.response.status_code = 500
            finally:
                session.close()
                # session.remove()

    request.add_finished_callback(cleanup)

    return session


@subscriber(NewRequest)
def new_request(event):
    request = event.request
    request.set_property(get_session, 'dbsession', reify=True)