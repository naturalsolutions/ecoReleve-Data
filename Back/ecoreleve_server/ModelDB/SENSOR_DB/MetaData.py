from sqlalchemy import (
    Column,
    ForeignKey,
    Integer,
    Sequence,
    Unicode
)
from ecoreleve_server.ModelDB.meta import SENSOR_DB


class MetaData(SENSOR_DB):
    __tablename__ = 'MetaData'
    Id = Column(Integer, Sequence('seq_MetaData_Id'), primary_key=True)
    FK_CamTrap = Column('FK_CamTrap', Integer, ForeignKey('CamTrap.pk_id'))
    CommandLine = Column(Unicode(None), nullable=True)
