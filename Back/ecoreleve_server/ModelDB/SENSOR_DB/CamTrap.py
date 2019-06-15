from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    func,
    Integer,
    Sequence,
    String
)
from ecoreleve_server.ModelDB.meta import SENSOR_DB


class CamTrap(SENSOR_DB):
    __tablename__ = 'TcameraTrap'
    pk_id = Column(Integer, Sequence('seq_camtrap_pk_id'), primary_key=True)
    fk_sensor = Column(Integer, nullable=False)
    path = Column(String(250), nullable=False)
    name = Column(String(250), nullable=False)
    extension = Column(String(250), nullable=False)
    checked = Column(Boolean, nullable=True)
    validated = Column(Integer, nullable=True)
    date_creation = Column(DateTime, nullable=True)
    date_uploaded = Column(DateTime, server_default=func.now())
    tags = Column(String, nullable=True)
    note = Column(Integer, nullable=False)
    stationId = Column(Integer, nullable=True)
    processed = Column(Integer, nullable=False, server_default='0')
    databaseTarget = Column(String(255), nullable=True)
    FK_Import = Column('FK_Import', Integer, ForeignKey('Import.ID'))
