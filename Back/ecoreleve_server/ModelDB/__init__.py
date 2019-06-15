from .meta import TheSession, MAIN_DB, SENSOR_DB, EXPORT_DB, LOG_DB
# from .SENSOR_DB import *


""" Models module """
""" will init every things we need relative for DB """


def includeme(config):
    # engine was initialize before we can acces to it with config.registry
    dbUsed = getattr(config.registry, 'dbUsed')
    bindEngineWithBase(config, dbUsed)
    createall(config, dbUsed)
    configureSessionFactory(config, dbUsed)


def bindEngineWithBase(config, dbUsed): 
    for item in dbUsed:
        curBase = globals()[item]
        curEngine = getattr(config.registry, item + 'engine')
        curBase.metadata.bind = curEngine


def configureSessionFactory(config, dbUsed):
    
    dictEngines = {}
    for item in dbUsed:
        dictEngines[eval(item)] = getattr(config.registry, item + 'engine')
    TheSession.configure(binds=dictEngines)
    setattr(config.registry, 'SessionFactory', TheSession)


def createall(config, dbUsed):
    for item in dbUsed:
        curBase = globals()[item]
        curEngine = getattr(config.registry, item + 'engine')
        curBase.metadata.create_all(curEngine)
