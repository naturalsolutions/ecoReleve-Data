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
from ecoreleve_server.ModelDB import MAIN_DB
from ecoreleve_server.core.base_model import HasDynamicProperties
from sqlalchemy.ext.hybrid import hybrid_property


class StationType(MAIN_DB):

    __tablename__ = 'StationType'

    ID = Column(Integer, Sequence('StationType__id_seq'), primary_key=True)
    Name = Column(String(250), nullable=True)
    Status = Column(Integer, nullable=True)

    Schema = relationship("StationType_StationDynProp", 
                          back_populates="stationType")

