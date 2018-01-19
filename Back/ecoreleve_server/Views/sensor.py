from ..Models import (
    Sensor,
    MonitoredSite,
    Base,
    SensorList
)
from sqlalchemy import select, desc, join, outerjoin
from collections import OrderedDict
from sqlalchemy.exc import IntegrityError
from ..controllers.security import RootCore, context_permissions
from . import DynamicObjectView, DynamicObjectCollectionView, DynamicObjectValue, DynamicObjectValues

SensorDynPropValue = Sensor.DynamicValuesClass


class SensorValueView(DynamicObjectValue):
    model = SensorDynPropValue
    item = None

    def retrieve(self):
        pass


class SensorValuesView(DynamicObjectValues):
    model = SensorDynPropValue
    item = SensorValueView


class SensorView(DynamicObjectView):

    model = Sensor

    def __init__(self, ref, parent):
        DynamicObjectView.__init__(self, ref, parent)
        self.actions = {'equipment': self.getEquipment,
                        'locations': self.getLocations}
        self.add_child('history', SensorValuesView)
        print('test')

    def __getitem__(self, ref):
        if ref in self.actions:
            self.retrieve = self.actions.get(ref)
            return self
        return self.get(ref)

    def getLocations(self):
        return 'no locations available'

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


class SensorsView(DynamicObjectCollectionView):

    Collection = SensorList
    item = SensorView
    moduleFormName = 'SensorForm'
    moduleGridName = 'SensorFilter'

    def __init__(self, ref, parent):
        DynamicObjectCollectionView.__init__(self, ref, parent)
        self.actions = {'getUnicIdentifier': self.getUnicIdentifier}
        self.__acl__ = context_permissions[ref]

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


RootCore.listChildren.append(('sensors', SensorsView))
