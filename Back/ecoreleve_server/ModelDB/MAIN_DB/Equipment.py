from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Integer,
    Sequence,
    Boolean,
    func
    )
from sqlalchemy.orm import relationship

from ecoreleve_server.ModelDB import MAIN_DB_BASE


class Equipment(MAIN_DB_BASE):
    __tablename__ = 'Equipment'

    ID = Column(Integer, Sequence('Equipment__id_seq'), primary_key=True)
    FK_Sensor = Column(Integer, ForeignKey('Sensor.ID'), nullable=True)
    FK_Individual = Column(Integer, ForeignKey('Individual.ID'), nullable=True)
    FK_MonitoredSite = Column(Integer, ForeignKey('MonitoredSite.ID'), nullable=True)
    FK_Observation = Column(Integer, ForeignKey('Observation.ID'), nullable=True)
    StartDate = Column(DateTime, default=func.now(), nullable=True)
    Deploy = Column(Boolean, nullable=True)
