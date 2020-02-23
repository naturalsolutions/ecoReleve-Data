from sqlalchemy import (
    and_,
    or_
)

from ecoreleve_server.core.base_collection import Query_engine, eval_
from . import Station, Station_FieldWorker
from ..observations import Observation
from ..users import User


@Query_engine(Station)
class StationCollection:
    pass


@Query_engine.add_filter(StationCollection, 'FK_Individual')
def individual_filter(self, modelToAdd, modelRel, criteria):

    if Observation.ID not in modelToAdd:
        modelToAdd.append(Observation.ID)
        modelRel.append(Station.ID == Observation.FK_Station)

    clauseToAdd = eval_.eval_binary_expr(
                Observation.FK_Individual,
                criteria['Operator'],
                criteria['Value']
            )

    return clauseToAdd


@Query_engine.add_filter(StationCollection, 'FK_FieldWorker')
def fieldworker_filter(self, modelToAdd, modelRel, criteria):

    modelToAdd.append(Station_FieldWorker.ID)
    modelToAdd.append(Station_FieldWorker.FK_Station)
    modelToAdd.append(Station_FieldWorker.FK_FieldWorker)
    modelToAdd.append(User.id)
    modelRel.append(Station.ID == Station_FieldWorker.FK_Station)
    modelRel.append(Station_FieldWorker.FK_FieldWorker == User.id)

    clauseToAdd = eval_.eval_binary_expr(
                User.Login,
                criteria['Operator'],
                criteria['Value']
            )

    return clauseToAdd


@Query_engine.add_filter(StationCollection, 'FK_ProtocoleType')
def protocoleType_filter(self, modelToAdd, modelRel, criteria):

    if Observation.ID not in modelToAdd:
        modelToAdd.append(Observation.ID)
        modelRel.append(Station.ID == Observation.FK_Station)

    clauseToAdd = eval_.eval_binary_expr(
                Observation._type_id,
                criteria['Operator'],
                criteria['Value']
            )

    return clauseToAdd


@Query_engine.add_filter(StationCollection, 'Species')
def species_filter(self, modelToAdd, modelRel, criteria):

    if Observation.ID not in modelToAdd:
        modelToAdd.append(Observation.ID)
        modelRel.append(Station.ID == Observation.FK_Station)

    observationDynPropValue = Observation.DynamicValuesClass
    observationDynProp = Observation.TypeClass.PropertiesClass
    if Observation.DynamicValuesClass.ID not in modelToAdd:
        modelToAdd.append(observationDynPropValue.ID)
        modelToAdd.append(observationDynProp.ID)
        modelToAdd.append(observationDynPropValue.fk_parent)
        modelToAdd.append(observationDynPropValue.fk_property)
        modelRel.append(
            Observation.ID == observationDynPropValue.fk_parent
            )
        modelRel.append(
            observationDynProp.ID == observationDynPropValue.fk_property
            )

    clauseToAdd = and_(
        or_(
            observationDynProp.Name.like('%taxon'),
            observationDynProp.Name.like('%species%')
            ),
        eval_.eval_binary_expr(
            observationDynPropValue.ValueString,
            criteria['Operator'],
            criteria['Value']
            )
    ).self_group()
    return clauseToAdd
