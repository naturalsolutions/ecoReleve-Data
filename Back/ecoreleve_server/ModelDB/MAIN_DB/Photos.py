from sqlalchemy import (
    Column,
    DateTime,
    Integer,
    String,
    Sequence
    )
from ecoreleve_server.ModelDB import MAIN_DB


class Photos(MAIN_DB):

    __tablename__ = 'Photos'
    Id = Column(Integer, Sequence('Photos__id_seq'), primary_key=True)
    Path = Column(String(250), nullable=False)
    FileName = Column(String(250), nullable=False)
    Date = Column(DateTime, nullable=False)
    Fk_MonitoredSite = Column(Integer, nullable=False)
    old_id = Column(Integer, nullable=False)
    Statut = Column(Integer, nullable=True)
    Note = Column(Integer, nullable=False, default=5)
