from zope.sqlalchemy import ZopeTransactionExtension
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import scoped_session, sessionmaker
import configparser


AppConfig = configparser.ConfigParser()
AppConfig.read('././development.ini')
print(AppConfig['app:main']['sensor_schema'])
### Create a database session : one for the whole application
DBSession = scoped_session(sessionmaker(extension=ZopeTransactionExtension()))
Base = declarative_base()
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

def remove_session(request):
    DBSession.remove()

def setup_post_request(event):
    event.request.add_finished_callback(remove_session)

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

