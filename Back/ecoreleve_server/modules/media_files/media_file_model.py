from sqlalchemy import Column, Integer, Sequence, String, DateTime, func, ForeignKey
from sqlalchemy.dialects.mysql import TINYINT
from sqlalchemy.inspection import inspect
from sqlalchemy.orm import relationship

from ecoreleve_server.core import Base


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


class MediasFiles(Base):

    __tablename__ = 'MediasFiles'
    Id = Column(Integer, Sequence('MediasFiles__id_seq'), primary_key=True)
    Path = Column(String(250), nullable=False)
    Name = Column(String(250), nullable=False)
    Extension = Column(String(4), nullable=False)
    Date_Uploaded = Column(DateTime, server_default = func.now(), nullable=False)
    Creator = Column(Integer, nullable=False)
    FK_Station = Column(Integer, ForeignKey('Station.ID'), nullable=False)

    Station = relationship("Station")
    
    def serialize(self):
        return {c: getattr(self, c) for c in inspect(self).attrs.keys()}

    @staticmethod
    def serialize_list(l):
        return [m.serialize() for m in l]

