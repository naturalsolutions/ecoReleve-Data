from datetime import datetime
from sqlalchemy import select, desc, join, outerjoin, and_, not_, or_, exists, Table
from sqlalchemy.orm import aliased, exc

from ecoreleve_server.core import Base
from ecoreleve_server.core.base_collection import Query_engine, eval_
from . import Individual
from ..sensors import Sensor
from ..observations import Observation, Equipment

SensorType = Sensor.TypeClass


@Query_engine(Individual)
class IndividualCollection:

    def extend_from(self, _from):
        releaseFilter = list(
            filter(lambda x: x['Column'] == 'LastImported', self.filters))
        if len(releaseFilter) > 0:
            return _from

        startDate = datetime.now()

        if self.from_history not in [None, 'all']:
            startDate = self.from_history

        StatusTable = Base.metadata.tables['IndividualStatus']
        EquipmentTable = Base.metadata.tables['IndividualEquipment']

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
        self.selectable.append(SensorType.Name.label('FK_SensorType_Name'))
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
def fk_sensor_filter(self, query, criteria):
    ## TODO FK_sensor on history
       #         if self.history:
    #             query = self.whereInEquipement(query, [criteriaObj])
    if self.from_history is None:
        query = query.where(eval_.eval_binary_expr(
            Sensor.UnicIdentifier, criteria['Operator'], criteria['Value']))

    return query


@Query_engine.add_filter(IndividualCollection, 'FK_SensorType')
def fk_sensorType_filter(self, query, criteria):
    ## TODO FK_SensorType on history
       #         if self.history:
    #             query = self.whereInEquipement(query, [criteria])
    if self.from_history is None:
        query = query.where(eval_.eval_binary_expr(
            Sensor._type_id, criteria['Operator'], criteria['Value']))
    return query


@Query_engine.add_filter(IndividualCollection, 'Status_')
def status_filter(self, query, criteria):
        StatusTable = Base.metadata.tables['IndividualStatus']
        query = query.where(eval_.eval_binary_expr(
            StatusTable.c['Status_'], criteria['Operator'], criteria['Value']))

        return query


@Query_engine.add_filter(IndividualCollection, 'frequency')
def frequency_VHF_filter(self, query, criteria):
    startDate = datetime.now()

    if self.from_history not in [None, 'all']:
        startDate = self.startDate

    freq = criteria['Value']
    e2 = aliased(Equipment)
    vs = Base.metadata.tables['SensorDynPropValuesNow']
    join_table_exist = join(Equipment, Sensor, Equipment.FK_Sensor == Sensor.ID)
    join_table_exist = join(join_table_exist, vs, vs.c['FK_Sensor'] == Sensor.ID)

    if self.from_history == 'all':
        queryExist = select([e2]).where(
            Equipment.FK_Individual == e2.FK_Individual)
        fullQueryExist = select([Equipment.FK_Individual]).select_from(
            join_table_exist).where(Equipment.FK_Individual == Individual.ID)
        fullQueryExist = fullQueryExist.where(
            and_(vs.c['FK_SensorDynProp'] == 9, Sensor.type_id == 4))

    else:
        queryExist = select([e2]).where(
            and_(Equipment.FK_Individual == e2.FK_Individual,
                    and_(e2.StartDate > Equipment.StartDate, e2.StartDate < startDate)))

        fullQueryExist = select(
            [Equipment.FK_Individual]).select_from(join_table_exist)
        fullQueryExist = fullQueryExist.where(and_(
            ~exists(queryExist), and_(vs.c['FK_SensorDynProp'] == 9,
                                        and_(Sensor.type_id == 4,
                                            and_(Equipment.Deploy == 1,
                                                and_(Equipment.StartDate < startDate,
                                                        Equipment.FK_Individual == Individual.ID)
                                                )))))

    if criteria['Operator'].lower() in ['is null']:
        query = query.where(~exists(fullQueryExist))
    else:
        fullQueryExist = fullQueryExist.where(eval_.eval_binary_expr(
            vs.c['ValueInt'], criteria['Operator'], freq))
        query = query.where(exists(fullQueryExist))

    return query
