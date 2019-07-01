from sqlalchemy import (
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Sequence
    )
from ecoreleve_server.ModelDB.meta import MAIN_DB_BASE



class ObservationPropValue(MAIN_DB_BASE):

    __tablename__ = 'ObservationPropValue'

    ID = Column(Integer,
                Sequence('ObservationPropValue__id_seq'),
                primary_key=True)
    StartDate = Column(DateTime,
                       nullable=False)
    ValueInt = Column(Integer,
                      nullable=True)
    ValueString = Column(String(255),
                         nullable=True)
    ValueDate = Column(DateTime,
                       nullable=True)
    ValueFloat = Column(Float,
                        nullable=True)
    FK_ObservationDynProp = Column(Integer,
                               ForeignKey('ObservationDynProp.ID'),
                               nullable=False)
    FK_Observation = Column(Integer,
                        ForeignKey('Observation.ID'),
                        nullable=False)
