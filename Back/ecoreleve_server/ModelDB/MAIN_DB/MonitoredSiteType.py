from sqlalchemy import (
    Column,
    Integer,
    Sequence
    )
from ecoreleve_server.ModelDB import MAIN_DB_BASE


class MonitoredSiteType(MAIN_DB_BASE):

    __tablename__ = 'MonitoredSiteType'

    ID = Column(Integer, Sequence('MonitoredSiteType__id_seq'), primary_key=True)
    Name = Column(Unicode(250), nullable=True)
    Status = Column(Integer, nullable=True)

