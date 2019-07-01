from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Integer,
    Sequence,
    String,
    Unicode,
    func
)

from ecoreleve_server.ModelDB import MAIN_DB_BASE


class Sensor (MAIN_DB_BASE):

    __tablename__ = 'Sensor'

    ID = Column(Integer, Sequence('Sensor__id_seq'), primary_key=True)
    UnicIdentifier = Column(Unicode(250), nullable=True)
    Model = Column(Unicode(255), nullable=True)
    Compagny = Column(Unicode(255), nullable=True)
    SerialNumber = Column(Unicode(255), nullable=True)
    creationDate = Column(DateTime, nullable=False, default=func.now())
    FK_SensorType = Column(Integer, ForeignKey('SensorType.ID'), nullable=True)
    OldID = Column(Integer, nullable=True)
    Original_ID = Column(Unicode(50), nullable=True)
