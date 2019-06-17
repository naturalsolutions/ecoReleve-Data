from sqlalchemy import (
    Column,
    ForeignKey,
    Integer,
    Sequence,
    )
from sqlalchemy.orm import relationship
from sqlalchemy.ext.hybrid import hybrid_property
from ecoreleve_server.ModelDB import MAIN_DB


class Station_FieldWorker (MAIN_DB):

    __tablename__ = 'Station_FieldWorker'

    ID = Column(Integer, Sequence(
        'Station_FieldWorker__id_seq'), primary_key=True)
    FK_Station = Column(Integer, ForeignKey('Station.ID'))
    FK_FieldWorker = Column(Integer, ForeignKey('User.ID'))

    FieldWorker = relationship('User')

    @hybrid_property
    def FieldWorkerName(self):
        if self.FieldWorker:
            return self.FieldWorker.Login
        else:
            return None

    @hybrid_property
    def FieldWorkerID(self):
        if self.FieldWorker:
            return self.FieldWorker.id
        else:
            return None
