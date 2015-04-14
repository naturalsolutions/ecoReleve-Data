import unittest
import transaction
import configparser
from pyramid import testing
from urllib.parse import quote_plus
from .Models import DBSession

AppConfig = configparser.ConfigParser()
AppConfig.read('./development.ini')
settings = AppConfig['app:main']
con_string = settings['cn.dialect'] + quote_plus(settings['sqlalchemy.url'])
TestPrefix = '%%Test%%'

class TestMyViewSuccessCondition(unittest.TestCase):

    

    def setUp(self):
        print ('TEST setup')
        self.config = testing.setUp()
        from sqlalchemy import create_engine

        engine = create_engine(con_string)
        from .Models import (
            Base, ObservationDynProp,
            ProtocoleType,
            ProtocoleType_ObservationDynProp,
            ObservationDynPropValue,
            Observation
            )
        DBSession.configure(bind=engine)
        Base.metadata.create_all(engine)
        self.InsertDataForTest()

            # protocol = ProtocoleType(Name = 'Prot_Test', Status=4)
            # obsDynProp1 = ObservationDynProp(Name = 'Toto', TypeProp = 'String')
            # obsDynProp2 = ObservationDynProp(Name = 'Tutu', TypeProp = 'Float')

            # protContext1 = ProtocoleType_ObservationDynProp(Required = 1, ProtocoleType = protocol, ObservationDynProp = obsDynProp1)
            # protContext2 = ProtocoleType_ObservationDynProp(Required = 1, ProtocoleType = protocol, ObservationDynProp = obsDynProp2)

            # obs = Observation(Name='one',ProtocoleType = protocol)
            # DBSession.add(protContext1)
            # DBSession.add(protContext2)
            # DBSession.add(obs)

    def tearDown(self):
        print ('TearDown')
        DBSession.remove()
        testing.tearDown()

    def test_passing_view(self):
        from .Views.views import getObservation
        print ('in the test loop')
        request = testing.DummyRequest( matchdict={'ID': self.InsertedInfo['Obs1']['id']})
       
        print (request)
        info = getObservation(request)
        print (info)

        self.assertEqual(info['data']['Name'], self.InsertedInfo['Obs1']['name'])
        # self.assertEqual(info['project'], 'ecoReleve_Server')

    def CleanData(self):
        # delete from ObservationDynPropValue
        # delete from ProtocoleType_ObservationDynProp
        # delete from ObservationDynProp
        # delete from observation
        # delete from protocoletype
        # 
        return 

    def InsertDataForTest(self):
        self.InsertedInfo = {}
        from .Models import (
            Base, ObservationDynProp,
            ProtocoleType,
            ProtocoleType_ObservationDynProp,
            ObservationDynPropValue,
            Observation
            )
        with transaction.manager:
            obs = Observation(Name=TestPrefix + 'one',ProtocoleType = DBSession.query(ProtocoleType).get(4))
            DBSession.add(obs)
            DBSession.flush()
            self.InsertedInfo['Obs1'] = {
                'id':obs.ID,
                'name': TestPrefix + 'one'
            }


            # obsDynProp1 = ObservationDynProp(Name = 'Toto', TypeProp = 'String')
            # obsDynProp2 = ObservationDynProp(Name = 'Tutu', TypeProp = 'Float')

            # protContext1 = ProtocoleType_ObservationDynProp(Required = 1, ProtocoleType = protocol, ObservationDynProp = obsDynProp1)
            # protContext2 = ProtocoleType_ObservationDynProp(Required = 1, ProtocoleType = protocol, ObservationDynProp = obsDynProp2)

            # obs = Observation(Name='one',ProtocoleType = protocol)
# class TestMyViewFailureCondition(unittest.TestCase):


#     def setUp(self):
#         self.config = testing.setUp()
#         from sqlalchemy import create_engine
#         engine = create_engine(con_string)
#         from .Models import (
#             Base,Observation
            
#             )
#         DBSession.configure(bind=engine)

#     def tearDown(self):
#         DBSession.remove()
#         testing.tearDown()

#     def test_failing_view(self):
#         from .views import my_view
#         request = testing.DummyRequest()
#         info = my_view(request)
#         self.assertEqual(info.status_int, 500)
