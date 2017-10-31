from sqlalchemy.ext.declarative import declarative_base
import configparser
from sqlalchemy import select
from sqlalchemy.exc import TimeoutError
import pandas as pd
from traceback import print_exc

AppConfig = configparser.ConfigParser()
AppConfig.read('././development.ini')
print(AppConfig['app:main']['sensor_schema'])

pendingSensorData = []
indivLocationData = []
stationData = []
graphDataDate = {'indivLocationData': None, 'pendingSensorData': None}
DBSession = None


class myBase(object):

    __table_args__ = {'implicit_returning': False}

Base = declarative_base(cls=myBase)
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
        thesaurusDictTraduction[row['fullPath']] = {'en': row['nameEn'], 'fr':row['nameFr']}
        invertedThesaurusDict['en'][row['nameEn']] = row['fullPath']
        invertedThesaurusDict['fr'][row['nameFr']] = row['fullPath']
    session.close()


def loadUserRole(session):
    global userOAuthDict
    # session = config.registry.dbmaker()
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
    session = request.dbsession
    Tuser_role = Base.metadata.tables['VUser_Role']
    query_check_role = select([Tuser_role.c['role']]).where(Tuser_role.c['userID'] == int(userid))
    currentUserRoleID = session.execute(query_check_role).scalar()

    if currentUserRoleID in USERS:
        currentUserRole = USERS[currentUserRoleID]
        return GROUPS.get(currentUserRole, [])


def cache_callback(request, session):
    if isinstance(request.exception, TimeoutError):
        session.get_bind().dispose()


from ..GenericObjets.Business import *
import json


def db(request):
    makerDefault = request.registry.dbmaker
    session = makerDefault()

    def cleanup(request):
        if request.exception is not None:
            session.rollback()
            cache_callback(request, session)
        else:
            try:
                session.commit()
            except BusinessRuleError as e :
                session.rollback()
                request.response.status_code = 409
                request.response.text= e.value
            except Exception as e:
                session.rollback()
            finally:
                session.close()
                makerDefault.remove()
            

    request.add_finished_callback(cleanup)
    return session

from ..GenericObjets.ObjectWithDynProp import LinkedTables
from ..GenericObjets.FrontModules import *
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
from .Import import *
from .SensorData import *
from .List import *
from .Log import sendLog


LinkedTables['Individual'] = Individual
LinkedTables['Station'] = Station
LinkedTables['Protocoles'] = Protocoles
LinkedTables['Sensor'] = Sensor
LinkedTables['MonitoredSite'] = MonitoredSite
