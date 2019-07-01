from sqlalchemy import (
    Boolean,
    Column,
    Integer,
    Sequence
    )

from ecoreleve_server.ModelDB import MAIN_DB_BASE


class MonitoredSiteDynProp (MAIN_DB_BASE):

    __tablename__ = 'MonitoredSiteDynProp'


    ID = Column(Integer, Sequence('MonitoredSiteDynProp__id_seq'), primary_key=True)
    Name = Column(Unicode(250), nullable=False)
    TypeProp = Column(Unicode(250), nullable=False)
