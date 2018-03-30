from sqlalchemy import (
    and_,
    func,
    select,
    exists,
    join,
    cast,
    not_,
    or_,
    DATE,
    outerjoin)
from sqlalchemy.orm import aliased
from sqlalchemy.sql.expression import union_all

from ecoreleve_server.core import Base
from ecoreleve_server.core.base_collection import Query_engine, eval_
from . import Station, Station_FieldWorker
from ..observations import Observation
from ..individuals import Individual
from ..users import User


@Query_engine(Station)
class StationCollection:
    pass


@Query_engine.add_filter(StationCollection, 'FK_Individual')
def individual_filter(self, query, criteria):
    if criteria['Operator'].lower() in ['is null', 'is not null']:
        subSelect = select([Observation]).where(
            and_(Station.ID == Observation.FK_Station,
                 Observation.__table__.c[curProp] != None)
        )
        if criteria['Operator'].lower() == 'is':
            query = query.where(~exists(subSelect))
        else:
            query = query.where(exists(subSelect))
    return query

@Query_engine.add_filter(StationCollection, 'FK_FieldWorker')
def fieldworker_filter(self, query, criteria):
    joinTable = join(Station_FieldWorker, User, Station_FieldWorker.FK_FieldWorker == User.id)
    subSelect = select([Station_FieldWorker]
                        ).select_from(joinTable).where(
        and_(Station.ID == Station_FieldWorker.FK_Station,
                eval_.eval_binary_expr(User.__table__.c['Login'],
                                    criteria['Operator'],
                                    criteria['Value'])))
    query = query.where(exists(subSelect))
    return query

@Query_engine.add_filter(StationCollection, 'FK_ProtocoleType')
def protocoleType_filter(self, query, criteria):
    o = aliased(Observation)
    subSelect = select([o.ID]
                        ).where(
        and_(Station.ID == o.FK_Station,
                eval_.eval_binary_expr(o._type_id, criteria['Operator'],
                                    criteria['Value'])))
    query = query.where(exists(subSelect))
    return query

@Query_engine.add_filter(StationCollection, 'LastImported')
def last_imported_filter(self, query, criteria):
    st = aliased(Station)
    subSelect2 = select([st]).where(
        cast(st.creationDate, DATE) > cast(Station.creationDate, DATE))
    query = query.where(~exists(subSelect2))

    return query

@Query_engine.add_filter(StationCollection, 'Species')
def species_filter(self, query, criteria):
    obsValTable = Base.metadata.tables['ObservationDynPropValuesNow']
    o2 = aliased(Observation)
    s2 = aliased(Station)

    joinStaObs = join(s2, o2, s2.ID == o2.FK_Station)

    operator = criteria['Operator']
    if 'not' in criteria['Operator']:
        operator = operator.replace('not ', '').replace(' not', '')

    existInd = select([Individual.ID]
                        ).where(and_(o2.FK_Individual == Individual.ID,
                                    eval_.eval_binary_expr(Individual.Species, operator, criteria['Value']))
                                )

    existObs = select([obsValTable.c['ID']]
                        ).where(and_(obsValTable.c['FK_Observation'] == o2.ID,
                                    and_(or_(obsValTable.c['Name'].like('%taxon'), obsValTable.c['Name'].like('%species%')),
                                        eval_.eval_binary_expr(obsValTable.c['ValueString'], operator, criteria['Value']))
                                    )
                                )

    selectCommon = select([s2.ID]).select_from(joinStaObs)

    selectInd = selectCommon.where(exists(existInd))
    selectObs = selectCommon.where(exists(existObs))

    unionQuery = union_all(selectInd, selectObs)
    if 'not' in criteria['Operator']:
        query = query.where(~Station.ID.in_(unionQuery))
    else:
        query = query.where(Station.ID.in_(unionQuery))
    return query