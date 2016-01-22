from zope.sqlalchemy import ZopeTransactionExtension
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import scoped_session, sessionmaker
import configparser
from sqlalchemy import event
from sqlalchemy.exc import TimeoutError



AppConfig = configparser.ConfigParser()
AppConfig.read('././development.ini')
print(AppConfig['app:main']['sensor_schema'])
### Create a database session : one for the whole application
#DBSession = scoped_session(sessionmaker(extension=ZopeTransactionExtension()))

DBSession = None
Base = declarative_base()
BaseExport = declarative_base()
dbConfig = {
    'dialect': 'mssql',
    'sensor_schema': AppConfig['app:main']['sensor_schema'] 
}

DynPropNames = {
    'ProtocoleType':{
        'DynPropContextTable':'ProtocoleType_ObservationDynProp',
        'DynPropTable':'ObservationDynProp',
        'FKToDynPropTable':'FK_ObservationDynProp'
    }
}

def cache_callback(request,session):
            if isinstance(request.exception,TimeoutError):
                session.get_bind().dispose()

def db(request):
    makerDefault = request.registry.dbmaker
    session = makerDefault()
    
    if 'ecoReleve-Core/export/' in request.url:
        makerExport = request.registry.dbmakerExport
        session = makerExport()

    def cleanup(request):
        if request.exception is not None:
            session.rollback()
            cache_callback(request,session)
        else:
            session.commit()
        session.close()
        makerDefault.remove()

    request.add_finished_callback(cleanup)
    return session

# def remove_session(request):
#     request.dbsession.close()
#     DBSession.remove()

# def setup_post_request(event):
#     event.request.add_finished_callback(remove_session)

from .Protocoles import *
from .User import User
from .Station import * 
from .Region import * 
from .FieldActivity import *
from .Individual import *
from .Sensor import *
from .MonitoredSite import *
from .Equipment import *
from .SensorData import *
from .List import *

