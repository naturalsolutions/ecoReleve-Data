from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Integer,
    Sequence,
    String,
    func
)

from ecoreleve_server.ModelDB import MAIN_DB
from ecoreleve_server.core.base_model import HasDynamicProperties


class Sensor (HasDynamicProperties, MAIN_DB):

    __tablename__ = 'Sensor'

    moduleFormName = 'SensorForm'
    moduleGridName = 'SensorFilter'

    ID = Column(Integer, Sequence('Sensor__id_seq'), primary_key=True)
    UnicIdentifier = Column(String(250))
    Model = Column(String(250))
    Compagny = Column(String(250))
    SerialNumber = Column(String(250))
    creationDate = Column(DateTime, nullable=False, default=func.now())
    FK_SensorType = Column(Integer, ForeignKey('SensorType.ID'))
    OldID = Column(Integer, nullable=True)
    Original_ID = Column(String(50), nullable=True)
