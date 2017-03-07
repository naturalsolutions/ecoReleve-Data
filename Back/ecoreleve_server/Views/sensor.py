from ..Models import (
    Sensor,
    MonitoredSite,
    Base,
    SensorList
)
from sqlalchemy import select, desc, join
from collections import OrderedDict
from sqlalchemy.exc import IntegrityError
from ..controllers.security import RootCore
from . import DynamicObjectView, DynamicObjectCollectionView


prefix = 'sensors'


class SensorView(DynamicObjectView):

    model = Sensor

    def __init__(self, ref, parent):
        DynamicObjectView.__init__(self, ref, parent)
        self.actions = {'equipment': self.getEquipment}

    def __getitem__(self, ref):
        if ref in self.actions:
            self.retrieve = self.actions.get(ref)
            return self
        return self.get(ref)

    def getEquipment(self):
        _id = self.objectDB.ID
        curSensorType = self.objectDB.GetType().Name

        if ('RFID' in curSensorType.upper()):
            table = Base.metadata.tables['MonitoredSiteEquipment']
            joinTable = join(table, Sensor, table.c['FK_Sensor'] == Sensor.ID)
            joinTable = join(joinTable, MonitoredSite, table.c[
                            'FK_MonitoredSite'] == MonitoredSite.ID)
            query = select([table.c['StartDate'],
                            table.c['EndDate'],
                            Sensor.UnicIdentifier,
                            MonitoredSite.Name,
                            MonitoredSite.ID.label('MonitoredSiteID')]
                           ).select_from(joinTable
                                         ).where(table.c['FK_Sensor'] == _id
                                                 ).order_by(desc(table.c['StartDate']))

        elif (curSensorType.lower() in ['gsm', 'satellite', 'vhf']):
            table = Base.metadata.tables['IndividualEquipment']
            joinTable = join(table, Sensor, table.c['FK_Sensor'] == Sensor.ID)
            query = select([table.c['StartDate'],
                            table.c['EndDate'],
                            table.c['FK_Individual'],
                            Sensor.UnicIdentifier
                            ]).select_from(joinTable
                                           ).where(table.c['FK_Sensor'] == _id
                                                   ).order_by(desc(table.c['StartDate']))
        else:
            return 'bad request'

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
    formModuleName = 'SensorForm'
    gridModuleName = 'SensorFilter'

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


RootCore.listChildren.append(('sensors', SensorsView))
