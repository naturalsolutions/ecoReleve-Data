import sqlalchemy as sa
from sqlalchemy.orm import aliased, exc

from ecoreleve_server.core import Base
from ecoreleve_server.utils.datetime import parse
from ecoreleve_server.core.base_collection import Query_engine
from . import Sensor
from ..monitored_sites import MonitoredSite
from ..observations import Equipment



        # if 'FK_MonitoredSiteName' == curProp:
        #     MonitoredSiteTable = Base.metadata.tables['MonitoredSite']
        #     val = criteriaObj['Value']
        #     query = query.where(eval_.eval_binary_expr(
        #         MonitoredSiteTable.c['Name'], criteriaObj['Operator'], val))



@Query_engine(Sensor)
class SensorCollection:

    def extend_from(self, _from):
        curEquipmentTable = Base.metadata.tables['CurrentlySensorEquiped']
        MonitoredSiteTable = Base.metadata.tables['MonitoredSite']
        table_join = sa.outerjoin(_from,
                        curEquipmentTable,
                        curEquipmentTable.c['FK_Sensor'] == Sensor.ID)
        
        table_join = sa.outerjoin(
            table_join,
            MonitoredSite,
            MonitoredSiteTable.c['ID'] == curEquipmentTable.c[
                'FK_MonitoredSite'])
        
        self.selectable.append(MonitoredSiteTable.c[
                               'Name'].label('FK_MonitoredSiteName'))
        self.selectable.append(curEquipmentTable.c[
                               'FK_Individual'].label('FK_Individual'))
        self.selectable.append(Sensor.ID) ### need to put in db configuration???
        return table_join


@Query_engine.add_filter(SensorCollection, 'availableOn')
def available_filter(self, query, criteria):
    date = criteria['Value']
    try:
        date = parse(date.replace(' ', ''))
    except:
        pass
    e = aliased(Equipment)
    e2 = aliased(Equipment)
    e3 = aliased(Equipment)

    subQueryEquip = sa.select([e2]).where(
        sa.and_(e.FK_Sensor == e2.FK_Sensor,
                sa.and_(e.StartDate < e2.StartDate, e2.StartDate <= date)))

    querySensor = sa.select([e]).where(
        sa.and_(e.StartDate <= date,
                sa.and_(e.Deploy == 0,
                    sa.and_(Sensor.ID == e.FK_Sensor,
                        sa.not_(sa.exists(subQueryEquip)))
                    )
                ))

    subQueryNotEquip = sa.select([e3]).where(
        sa.and_(Sensor.ID == e3.FK_Sensor,
                e3.StartDate < date))

    if criteria['Operator'].lower() != 'is not':
        query = query.where(sa.or_(sa.exists(querySensor),
                                sa.not_(sa.exists(subQueryNotEquip))))
    else:
        query = query.where(sa.or_(sa.not_(sa.exists(querySensor)),
                                sa.not_(sa.exists(subQueryNotEquip))))
    return query

# @Query_engine.add_filter(SensorCollection, 'FK_Individual')
# def available_filter(self, query, criteria):

#             curEquipmentTable = Base.metadata.tables['CurrentlySensorEquiped']
#             val = criteriaObj['Value']
#             query = query.where(eval_.eval_binary_expr(
#                 curEquipmentTable.c['FK_Individual'],
#                 criteriaObj['Operator'],
#                 val))
#         return query