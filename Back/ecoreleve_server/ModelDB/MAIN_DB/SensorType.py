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
from ecoreleve_server.ModelDB import MAIN_DB_BASE



class SensorType(MAIN_DB_BASE):

    __tablename__ = 'SensorType'

    ID = Column(Integer, Sequence('SensorType__id_seq'), primary_key=True)
    Name = Column(Unicode(255), nullable=True)
    Status = Column(Integer, nullable=True)

