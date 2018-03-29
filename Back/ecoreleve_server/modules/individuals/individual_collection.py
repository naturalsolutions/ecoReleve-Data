from datetime import datetime
from sqlalchemy import select, desc, join, outerjoin, and_, not_, or_, exists, Table

from ecoreleve_server.core import Base
from ecoreleve_server.core.base_collection import Query_engine, eval_
from . import Individual
from ..sensors import Sensor
from ..observations import Observation

SensorType = Sensor.TypeClass


@Query_engine(Individual)
class IndividualCollection:

    def extend_from(self, _from):
        startDate = datetime.now()

        if self.from_history not in [None, 'all']:
            startDate = self.from_history

        StatusTable = Base.metadata.tables['IndividualStatus']
        EquipmentTable = Base.metadata.tables['IndividualEquipment']

        # releaseFilter = list(
        #     filter(lambda x: x['Column'] == 'LastImported', searchInfo['criteria']))
        # if len(releaseFilter) > 0:
        #     return joinTable

        table_join = outerjoin(_from, StatusTable, StatusTable.c[
                              'FK_Individual'] == Individual.ID)

        self.selectable.append(StatusTable.c['Status_'].label('Status_'))

        table_join = outerjoin(table_join, EquipmentTable,
                              and_(Individual.ID == EquipmentTable.c['FK_Individual'],
                                   and_(or_(EquipmentTable.c['EndDate'] >= startDate,
                                            EquipmentTable.c['EndDate'] == None),
                                        EquipmentTable.c['StartDate'] <= startDate)))

        table_join = outerjoin(table_join, Sensor,
                              Sensor.ID == EquipmentTable.c['FK_Sensor'])
        table_join = outerjoin(table_join, SensorType,
                              Sensor.type_id == SensorType.ID)

        self.selectable.append(Sensor.UnicIdentifier.label('FK_Sensor'))
        self.selectable.append(SensorType.Name.label('FK_SensorType'))
        self.selectable.append(Sensor.Model.label('FK_SensorModel'))

        return table_join


@Query_engine.add_filter(IndividualCollection, 'LastImported')
def lastImported_filter(self, query, criteria):
    subSelect = select([Observation]).where(
    Observation.FK_Individual == Individual.ID)
    query = query.where(
        and_(~exists(subSelect), Individual.Original_ID.like('TRACK_%')))
    
    return query


@Query_engine.add_filter(IndividualCollection, 'FK_Sensor')
def FK_Sensor_filter(self, query, criteria):
       #         if self.history:
    #             query = self.whereInEquipement(query, [criteriaObj])
    if self.from_history is None:
        query = query.where(eval_.eval_binary_expr(
            Sensor.UnicIdentifier, criteria['Operator'], criteria['Value']))

    return query


@Query_engine.add_filter(IndividualCollection, 'FK_SensorType')
def FK_SensorType_filter(self, query, criteria):
       #         if self.history:
    #             query = self.whereInEquipement(query, [criteria])
    if self.from_history is None:
        query = query.where(eval_.eval_binary_expr(
            Sensor._type_id, criteria['Operator'], criteria['Value']))
    return query


@Query_engine.add_filter(IndividualCollection, 'Status_')
def Status_filter(self, query, criteria):
        StatusTable = Base.metadata.tables['IndividualStatus']
        query = query.where(eval_.eval_binary_expr(
            StatusTable.c['Status_'], criteria['Operator'], criteria['Value']))

        return query