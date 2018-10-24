from datetime import datetime
from sqlalchemy import select, join, desc
from collections import OrderedDict

from ecoreleve_server.core import Base, RootCore
from ecoreleve_server.core.base_resource import *
from ..sensors.sensor_model import Sensor
from ..stations.station_model import Station
from .individual_model import Individual, ErrorCheckIndividualCodes
from .individual_collection import IndividualCollection
from .individual_history import IndividualValuesResource
from .individual_locations import IndividualLocationsResource
from ..permissions import context_permissions

SensorType = Sensor.TypeClass


class IndividualResource(DynamicObjectResource):
    model = Individual

    children = [('locations', IndividualLocationsResource),
                ('history', IndividualValuesResource)
                ]

    __acl__ = context_permissions['individuals']

    def getEquipment(self):
        table = Base.metadata.tables['IndividualEquipment']
        joinTable = join(table, Sensor, table.c['FK_Sensor'] == Sensor.ID)
        joinTable = join(joinTable,
                         SensorType,
                         Sensor.type_id == SensorType.ID)
        query = select([table.c['StartDate'],
                        table.c['EndDate'],
                        Sensor.UnicIdentifier,
                        Sensor.ID.label('SensorID'),
                        table.c['FK_Individual'],
                        SensorType.Name.label('Type')]
                       ).select_from(joinTable
                                     ).where(table.c['FK_Individual'] == self.objectDB.ID
                                             ).order_by(desc(table.c['StartDate']))

        result = self.session.execute(query).fetchall()
        response = []
        for row in result:
            curRow = OrderedDict(row)
            curRow['StartDate'] = curRow['StartDate'].strftime('%Y-%m-%d %H:%M:%S')
            if curRow['EndDate'] is not None:
                curRow['EndDate'] = curRow['EndDate'].strftime('%Y-%m-%d %H:%M:%S')
            else:
                curRow['EndDate'] = ''
            response.append(curRow)
        return response


class IndividualsResource(DynamicObjectCollectionResource):

    Collection = IndividualCollection
    model = Individual
    moduleFormName = 'IndivForm'
    moduleGridName = 'IndivFilter'

    children = [('{int}', IndividualResource)]
    __acl__ = context_permissions['individuals']

    def __init__(self, ref, parent):
        DynamicObjectCollectionResource.__init__(self, ref, parent)

        if not self.typeObj:
            self.typeObj = 1

    def insert(self):
        # if set True create automatically a new indiv  = not what we want
        self.session.autoflush = False
        data = {}
        startDate = None

        for items, value in self.request.json_body.items():
            data[items] = value
        existingIndivID = None

        if 'stationID' in data:
            curSta = self.session.query(Station).get(data['stationID'])
            startDate = curSta.StationDate

        newIndiv = self.model()
        try:
            data['__useDate__'] = startDate
            newIndiv.values = data

            if self.typeObj == 2:
                existingIndivID = self.checkExisting(newIndiv)
                if existingIndivID is not None:
                    self.session.rollback()
                    self.session.close()
                    indivID = existingIndivID

            if existingIndivID is None:
                self.session.add(newIndiv)
                self.session.flush()
                indivID = newIndiv.ID
            return {'ID': indivID}
        except ErrorCheckIndividualCodes as e:
            self.request.response.status_code = 520
            return str(e)

    def checkExisting(self, indiv):
        indivData = indiv.__properties__

        searchInfo = {'criteria':
                            [{'Column': key,
                              'Operator': 'is',
                              'Value': val}
                             for key, val in indivData.items()],
                      'order_by': ['ID:asc']}

        moduleFront = self.getConf(self.moduleGridName)

        listObj = IndividualCollection(moduleFront, typeObj=2)
        dataResult = listObj.GetFlatDataList(searchInfo)

        if len(dataResult) > 0:
            existingID = dataResult[0]['ID']
        else:
            existingID = None

        return existingID


RootCore.children.append(('individuals', IndividualsResource))
