from sqlalchemy import select, desc, join, func, outerjoin, and_, not_, or_, exists, Table


from ecoreleve_server.core import Base
from ecoreleve_server.core.base_collection import Query_engine
from . import MonitoredSite
from ..sensors import Sensor

SensorType = Sensor.TypeClass


@Query_engine(MonitoredSite)
class MonitoredSiteCollection:

    # def _select_from(self):

    #     join_table, selectable = super()._select_from(self)
    #     lastPositionView = Base.metadata.tables['MonitoredSitePositionsNow']
        
    #     return join_table, selectable

    def extend_from(self, _from):
        lastPositionView = Base.metadata.tables['MonitoredSitePositionsNow']
        EquipmentTable = Base.metadata.tables['MonitoredSiteEquipment']

        join_table = outerjoin(_from, lastPositionView, MonitoredSite.ID == lastPositionView.c['FK_MonitoredSite'])
        join_table = outerjoin(
            join_table,
            EquipmentTable,
            and_(MonitoredSite.ID == EquipmentTable.c['FK_MonitoredSite'],
                 or_(EquipmentTable.c['EndDate'] == None,
                     EquipmentTable.c['EndDate'] >= func.now())))

        join_table = outerjoin(
            join_table,
            Sensor,
            Sensor.ID == EquipmentTable.c['FK_Sensor'])
        join_table = outerjoin(
            join_table,
            SensorType,
            Sensor._type_id == SensorType.ID)

        self.selectable.extend([lastPositionView.c['LAT'], lastPositionView.c['LON'],lastPositionView.c['ELE']])
        self.selectable.append(Sensor.UnicIdentifier.label('FK_Sensor'))
        self.selectable.append(SensorType.Name.label('FK_SensorType'))
        self.selectable.append(Sensor.Model.label('FK_SensorModel'))

        return join_table
