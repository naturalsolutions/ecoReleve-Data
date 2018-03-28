
from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Sequence,
    orm,
    func)
from sqlalchemy.orm import relationship

from ecoreleve_server.core import Base, HasDynamicProperties, GenericType


class Sensor (HasDynamicProperties, Base):

    __tablename__ = 'Sensor'

    moduleFormName = 'SensorForm'
    moduleGridName = 'SensorFilter'

    # ID = Column(Integer, Sequence('Sensor__id_seq'), primary_key=True)
    UnicIdentifier = Column(String(250))
    Model = Column(String(250))
    Compagny = Column(String(250))
    SerialNumber = Column(String(250))
    creationDate = Column(DateTime, nullable=False, default=func.now())
    # FK_SensorType = Column(Integer, ForeignKey('SensorType.ID'))

    Equipments = relationship('Equipment')
    Locations = relationship('Individual_Location')