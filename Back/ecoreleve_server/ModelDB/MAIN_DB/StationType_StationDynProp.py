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


class StationType_StationDynProp(MAIN_DB):

    __tablename__ = 'StationType_StationDynProp'

    ID = Column(Integer,
                Sequence('StationType_StationDynProp__id_seq'),
                primary_key=True)
    Required = Column(Integer,
                      server_default='0')
    FK_StationType = Column(Integer,
                            ForeignKey('StationType.ID'),
                            nullable=False)
    FK_StationDynProp = Column(Integer,
                               ForeignKey('StationDynProp.ID'),
                               nullable=False)

    stationType = relationship("StationType",back_populates="Schema")
    stationDynProp = relationship("StationDynProp",back_populates="StationTypes")                  
