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


class StationDynProp(MAIN_DB):

    __tablename__ = 'StationDynProp'

    ID = Column(Integer, Sequence('StationDynProp__id_seq'), primary_key=True)
    Name = Column(String(250), nullable=True)
    TypeProp = Column(String(250), nullable=True)

    StationTypes = relationship("StationType_StationDynProp",
                          back_populates="stationDynProp")
    
    Stations = relationship("StationDynPropValue",
                            back_populates="dynProp")
 
