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


class StationType(MAIN_DB_BASE):

    __tablename__ = 'StationType'

    ID = Column(Integer, Sequence('StationType__id_seq'), primary_key=True)
    Name = Column(String(250), nullable=True)
    Status = Column(Integer, nullable=True)

    Schema = relationship("StationType_StationDynProp", 
                          back_populates="stationType")

