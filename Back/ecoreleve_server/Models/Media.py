from ..Models import Base
from sqlalchemy import Column, Integer, Sequence, String, DateTime
from sqlalchemy.dialects.mysql import TINYINT

class Photos(Base):

    __tablename__ = 'Photos'
    Id = Column(Integer, Sequence('Photos__id_seq'), primary_key=True)
    Path = Column(String(250), nullable=False)
    FileName = Column(String(250), nullable=False)
    Date = Column(DateTime, nullable = False)
    Fk_MonitoredSite = Column(Integer, nullable=False)
    old_id = Column(Integer, nullable=False)
    Statut = Column(TINYINT, nullable = True)
    Note = Column(Integer, nullable=False, default = 5)
