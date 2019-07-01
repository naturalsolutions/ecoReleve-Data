from sqlalchemy import (
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Sequence,
    func
    )
from sqlalchemy.orm import relationship
from ecoreleve_server.ModelDB.meta import MAIN_DB_BASE

from sqlalchemy.ext.hybrid import hybrid_property


class IndividualPropValue(MAIN_DB_BASE):

    __tablename__ = 'IndividualPropValue'

    ID = Column(Integer,
                Sequence('IndividualPropValue__id_seq'),
                primary_key=True)
    StartDate = Column(DateTime,
                       nullable=False)
    ValueInt = Column(Integer,
                      nullable=True)
    ValueString = Column(String(500),
                         nullable=True)
    ValueDate = Column(DateTime,
                       nullable=True)
    ValueFloat = Column(Float,
                        nullable=True)
    FK_IndividualDynProp = Column(Integer,
                               ForeignKey('IndividualDynProp.ID'),
                               nullable=False)
    FK_Individual = Column(Integer,
                        ForeignKey('Individual.ID'),
                        nullable=False)
