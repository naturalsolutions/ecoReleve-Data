from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Sequence
    )
from ecoreleve_server.ModelDB import MAIN_DB_BASE


class Photos(MAIN_DB_BASE):

    __tablename__ = 'Photos'
    Id = Column(Integer, Sequence('Photos__id_seq'), primary_key=True)
    Path = Column(String(250), nullable=False)
    FileName = Column(String(250), nullable=False)
    Date = Column(DateTime, nullable=False)
    Fk_MonitoredSite = Column(Integer,ForeignKey('MonitoredSite.ID'), nullable=False)
    old_id = Column(Integer, nullable=False)
    Statut = Column(Integer, nullable=True)
    Note = Column(Integer, nullable=False, default=5)
