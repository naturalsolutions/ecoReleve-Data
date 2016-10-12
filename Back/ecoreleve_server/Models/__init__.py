from zope.sqlalchemy import ZopeTransactionExtension
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import scoped_session, sessionmaker
import configparser
from sqlalchemy import event, select, text
from sqlalchemy.exc import TimeoutError
from pyramid import threadlocal
import pandas as pd
import datetime
from traceback import print_exc

AppConfig = configparser.ConfigParser()
AppConfig.read('././development.ini')
print(AppConfig['app:main']['sensor_schema'])
# Create a database session : one for the whole application
#DBSession = scoped_session(sessionmaker(extension=ZopeTransactionExtension()))

pendingSensorData = []
indivLocationData = []
stationData = []
graphDataDate = {'indivLocationData': None, 'pendingSensorData': None}


DBSession = None
Base = declarative_base()
BaseExport = declarative_base()
dbConfig = {
    'dialect': 'mssql',
    'sensor_schema': AppConfig['app:main']['sensor_schema'],
    'cn.dialect': AppConfig['app:main']['cn.dialect'],
}

try:
    dbConfig['dbLog.schema'] = AppConfig['app:main']['dbLog.schema']
    dbConfig['dbLog.url'] = AppConfig['app:main']['dbLog.url']
except:
    print_exc()
    pass

DynPropNames = {
    'ProtocoleType': {
        'DynPropContextTable': 'ProtocoleType_ObservationDynProp',
        'DynPropTable': 'ObservationDynProp',
        'FKToDynPropTable': 'FK_ObservationDynProp'
    }
}


thesaurusDictTraduction = {}
invertedThesaurusDict = {'en': {}, 'fr': {}}
userOAuthDict = {}


def loadThesaurusTrad(config):
    session = config.registry.dbmaker()
    thesTable = Base.metadata.tables['ERDThesaurusTerm']
    query = select(thesTable.c)

    results = session.execute(query).fetchall()

    for row in results:
        thesaurusDictTraduction[row['fullPath']] = {'en': row['nameEn']}
        invertedThesaurusDict['en'][row['nameEn']] = row['fullPath']
        invertedThesaurusDict['fr'][row['nameFr']] = row['fullPath']
    session.close()


def loadUserRole(config):
    global userOAuthDict
    session = config.registry.dbmaker()
    VuserRole = Base.metadata.tables['VUser_Role']
    query = select(VuserRole.c)

    results = session.execute(query).fetchall()
    userOAuthDict = pd.DataFrame.from_records(
        results, columns=['user_id', 'role_id'])

USERS = {2: 'superUser',
         3: 'user',
         1: 'admin'}

GROUPS = {'superUser': ['group:superUsers'],
          'user': ['group:users'],
          'admin': ['group:admins']}


def groupfinder(userid, request):
    currentUserRoleID = userOAuthDict.loc[userOAuthDict[
        'user_id'] == int(userid), 'role_id'].values[0]
    if currentUserRoleID in USERS:
        currentUserRole = USERS[currentUserRoleID]
        return GROUPS.get(currentUserRole, [])


def cache_callback(request, session):
    if isinstance(request.exception, TimeoutError):
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
            cache_callback(request, session)
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
from ..GenericObjets.ObjectWithDynProp import LinkedTables

from .CustomTypes import *
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
from .Log import sendLog


LinkedTables['Individual'] = Individual
LinkedTables['Station'] = Station
LinkedTables['Protocoles'] = Protocoles
LinkedTables['Sensor'] = Sensor
LinkedTables['MonitoredSite'] = MonitoredSite
