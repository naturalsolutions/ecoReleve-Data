from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Integer,
    Sequence,
    String,
    func
)
from sqlalchemy.orm import relationship
from ecoreleve_server.ModelDB import MAIN_DB_BASE
from sqlalchemy.inspection import inspect


class MediasFiles(MAIN_DB_BASE):

    __tablename__ = 'MediasFiles'
    Id = Column(Integer, Sequence('MediasFiles__id_seq'), primary_key=True)
    Path = Column(String(250), nullable=False)
    Name = Column(String(250), nullable=False)
    Extension = Column(String(4), nullable=False)
    Date_Uploaded = Column(DateTime, server_default=func.now(), nullable=False)
    Creator = Column(Integer, nullable=False)
    FK_Station = Column(Integer, ForeignKey('Station.ID'), nullable=False)

    Station = relationship("Station")
    
    def serialize(self):
        return {c: getattr(self, c) for c in inspect(self).attrs.keys()}

    @staticmethod
    def serialize_list(l):
        return [m.serialize() for m in l]
