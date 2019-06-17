from sqlalchemy import (
    Column,
    ForeignKey,
    Integer,
    Numeric,
    Sequence,
    String
)
from ecoreleve_server.ModelDB import MAIN_DB


class ObservationDynPropSubValue (MAIN_DB):

    __tablename__ = 'ObservationDynPropSubValue'

    ID = Column(Integer, Sequence(
        'ObservationDynPropSubValue__id_seq'), primary_key=True)
    FieldName = Column(String(250))
    ValueNumeric = Column(Numeric(30, 10))
    FK_Observation = Column(Integer, ForeignKey('Observation.ID'))
