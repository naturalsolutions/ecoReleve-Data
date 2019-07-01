from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Sequence,
    func
    )
from sqlalchemy.orm import relationship
from ecoreleve_server.ModelDB import MAIN_DB_BASE

from sqlalchemy.ext.hybrid import hybrid_property


class SensorDynProp(MAIN_DB_BASE):

    __tablename__ = 'SensorDynProp'

    ID = Column(Integer, Sequence('SensorDynProp__id_seq'), primary_key=True)
    Name = Column(Unicode(255), nullable=True)
    TypeProp = Column(Unicode(255), nullable=True)
