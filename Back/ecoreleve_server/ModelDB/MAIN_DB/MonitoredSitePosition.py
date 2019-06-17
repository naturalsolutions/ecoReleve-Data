from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Sequence
    )
from ecoreleve_server.ModelDB import MAIN_DB


class MonitoredSitePosition(MAIN_DB):

    __tablename__ = 'MonitoredSitePosition'
    ID = Column(Integer, Sequence(
        'MonitoredSitePositions__id_seq'), primary_key=True)
    LAT = Column(Numeric(9, 5))
    LON = Column(Numeric(9, 5))
    ELE = Column(Integer)
    Precision = Column(Integer)
    StartDate = Column(DateTime)
    Comments = Column(String(250))
    FK_MonitoredSite = Column(Integer, ForeignKey('MonitoredSite.ID'))
