import unittest,os
import transaction
import configparser
from pyramid import testing
from urllib.parse import quote_plus
from sqlalchemy.orm import sessionmaker
from .Models import Base,DBSession
from sqlalchemy import create_engine, engine_from_config
from paste.deploy.loadwsgi import appconfig
from webtest import TestApp
from ecoreleve_server import main


here = os.path.dirname(__file__)
settings = appconfig('config:' + os.path.join(here,'../','development.ini'))

settings['sqlalchemy.url'] = settings['cn.dialect'] + quote_plus(settings['sqlalchemy.url'])
TestPrefix = '%%Test%%'
con_string = settings['cn.dialect'] + quote_plus(settings['sqlalchemy.url'])
TestPrefix = '%%Test%%'


class BaseTest(unittest.TestCase):


    def setUp(self):

        print ('TEST setup')
        self.config = testing.setUp()
        from sqlalchemy import create_engine

        engine = create_engine(settings['sqlalchemy.url'])
        from .Models import (
            Base, ObservationDynProp,
            ProtocoleType,
            ProtocoleType_ObservationDynProp,
            ObservationDynPropValue,
            Observation
            )

        self.engine = create_engine(settings['sqlalchemy.url'])
        self.config = testing.setUp()
        # self.engine = create_engine(settings['sqlalchemy.url'])
        self.connection = self.engine.connect()
        self.trans = self.connection.begin()

        DBSession.configure(bind=self.connection)
        self.DBSession = DBSession()

        Base.session = self.DBSession

    def tearDown(self):

        print ('TearDown')
        testing.tearDown()
        self.trans.rollback()
        self.DBSession.rollback()
        self.DBSession.close()

class IntegrationTestBase(BaseTest):
    @classmethod
    def setUpClass(cls):
        cls.ecoreleve_server = main({}, **settings)
        super(IntegrationTestBase, cls).setUpClass()

    def setUp(self):
        self.ecoreleve_server = TestApp(self.ecoreleve_server)
        self.config = testing.setUp()
        super(IntegrationTestBase, self).setUp()

class TestView(BaseTest) :
    def setUp(self):
        """ This sets up the application registry with the
        registrations your application declares in its ``includeme``
        function.
        """
        from ecoreleve_server import main
        app = main({},**settings)
        self.config = testing.setUp()
        self.config.include('app')
    
    InsertedInfo = {
    'Obs1' :
    {
    'name' : 'one'
    }
    }

    def test_passing_getObservation(self):

        from .Views.views import getObservation
        self.InsertDataForTest()
        request = testing.DummyRequest( matchdict={'ID': 91}, json_body = {})
        info = getObservation(request)
        self.assertEqual(info['data']['Name'], self.InsertedInfo['Obs1']['name'])

    def test_passing_setObservation(self):

        from .Views.views import setObservation
        self.InsertDataForTest()
        request = testing.DummyRequest(
            matchdict={
            'ID': 91
            },
            json_body = {
            'Toto': 'MaValeurTOTO',
            'Tutu': '18'
            })

        info = setObservation(request)
        self.assertEqual(info['data']['Toto'],'MaValeurTOTO')
    
    def InitDynProp(self):

        protocol = ProtocoleType(Name = 'Prot_Test', Status=4)
        obsDynProp1 = ObservationDynProp(Name = 'Toto', TypeProp = 'String')
        obsDynProp2 = ObservationDynProp(Name = 'Tutu', TypeProp = 'Float')
        protContext1 = ProtocoleType_ObservationDynProp(Required = 1, ProtocoleType = protocol, ObservationDynProp = obsDynProp1)
        protContext2 = ProtocoleType_ObservationDynProp(Required = 1, ProtocoleType = protocol, ObservationDynProp = obsDynProp2)

        self.DBSession.add(protContext1)
        self.DBSession.add(protContext2)

    def InsertDataForTest(self):

        print('insert DATA for test ')
        self.InsertedInfo = {}
        from .Models import (
            Base, ObservationDynProp,
            ProtocoleType,
            ProtocoleType_ObservationDynProp,
            ObservationDynPropValue,
            Observation
            )
        with transaction.manager:
            obs = Observation(Name=TestPrefix + 'one',ProtocoleType = self.DBSession.query(ProtocoleType).get(4))
            self.DBSession.add(obs)
            self.DBSession.flush()
            self.InsertedInfo['Obs1'] = {
                'id':obs.ID,
                'name': TestPrefix + 'one'
            }

# class TestMyViewFailureCondition(unittest.TestCase):


#     def setUp(self):
#         self.config = testing.setUp()
#         from sqlalchemy import create_engine
#         engine = create_engine(con_string)
#         from .Models import (
#             Base,Observation
            
#             )
#         self.DBSession.configure(bind=engine)

#     def tearDown(self):
#         self.DBSession.remove()
#         testing.tearDown()

#     def test_failing_view(self):
#         from .views import my_view
#         request = testing.DummyRequest()
#         info = my_view(request)
#         self.assertEqual(info.status_int, 500)
