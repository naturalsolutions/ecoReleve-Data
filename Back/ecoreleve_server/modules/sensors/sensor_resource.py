
from collections import OrderedDict
from sqlalchemy.exc import IntegrityError
from sqlalchemy import select, desc, join, outerjoin, and_, not_, or_, exists, Table
from sqlalchemy.orm import aliased, exc

from ecoreleve_server.core import RootCore, Base
from ecoreleve_server.core.base_resource import *
from ecoreleve_server.utils.datetime import parse
from .sensor_model import Sensor
from ..monitored_sites import MonitoredSite
from ..observations import Equipment
from ..permissions import context_permissions

from .sensor_history import SensorValuesResource
from .sensor_collection import SensorCollection

SensorDynPropValue = Sensor.DynamicValuesClass


class SensorResource(DynamicObjectResource):

    model = Sensor
    children = [('history', SensorValuesResource)]
    __acl__ = context_permissions['sensors']

    def getEquipment(self):
        _id = self.objectDB.ID

        table = Base.metadata.tables['SensorEquipment']
        joinTable = join(table, Sensor, table.c['FK_Sensor'] == Sensor.ID)
        joinTable = outerjoin(joinTable, MonitoredSite, table.c[
                        'FK_MonitoredSite'] == MonitoredSite.ID)
        query = select([table.c['StartDate'],
                        table.c['EndDate'],
                        Sensor.UnicIdentifier,
                        MonitoredSite.Name,
                        MonitoredSite.ID.label('MonitoredSiteID'),
                        table.c['FK_Individual']]
                       ).select_from(joinTable
                                     ).where(table.c['FK_Sensor'] == _id
                                             ).order_by(desc(table.c['StartDate']))

        result = self.session.execute(query).fetchall()
        response = []
        for row in result:
            curRow = OrderedDict(row)
            curRow['StartDate'] = curRow['StartDate'].strftime('%Y-%m-%d %H:%M:%S')
            curRow['EndDate'] = curRow['EndDate'].strftime(
                '%Y-%m-%d %H:%M:%S') if curRow['EndDate'] is not None else None
            curRow['format'] = 'YYYY-MM-DD HH:mm:ss'
            response.append(curRow)

        return response


class SensorsResource(DynamicObjectCollectionResource):

    Collection = SensorCollection
    item = SensorResource
    moduleFormName = 'SensorForm'
    moduleGridName = 'SensorFilter'

    children = [('{int}', SensorResource)
                ]
    __acl__ = context_permissions['sensors']

    def search(self, paging=True, params={}, noCount=False):
        params, history, startDate = self.formatParams(params, paging)
        conf_grid = self.getGrid()
        cols = list(map(lambda x: x['field'].replace('.','@'),conf_grid))

        self.collection = SensorCollection(session = self.session)
        dataResult = self.collection.search(selectable=cols,filters=params.get('criteria', []), offset=params.get('offset'), limit=params.get('per_page'), order_by=params.get('order_by'))
        
        # table = Base.metadata.tables['VArgosData_With_EquipIndiv']
        # self.collection = QueryEngine(session = self.session, model=table)
        # dataResult = self.collection.search(filters=params.get('criteria', []), offset=params.get('offset'), limit=params.get('per_page'), order_by=params.get('order_by'))

        countResult = self.collection._count(filters=params.get('criteria', []))
        result = [{'total_entries': countResult}]
        result.append(dataResult)

        return result

    def insert(self):
        try:
            response = DynamicObjectCollectionView.insert(self)
        except IntegrityError as e:
            self.session.rollback()
            self.request.response.status_code = 520
            response = self.request.response
            response.text = "This identifier is already used for another sensor"
            pass
        return response

    def getUnicIdentifier(self):
        sensorType = self.request.params['sensorType']
        query = select([Sensor.UnicIdentifier.label('label'), Sensor.ID.label(
            'val')]).where(Sensor.FK_SensorType == sensorType)
        response = [OrderedDict(row) for row in self.session.execute(query).fetchall()]

        return response


RootCore.children.append(('sensors', SensorsResource))