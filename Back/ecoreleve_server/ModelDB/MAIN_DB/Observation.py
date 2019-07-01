from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Integer,
    Sequence,
    String,
    func
)

from ecoreleve_server.ModelDB import MAIN_DB_BASE



class Observation(MAIN_DB_BASE):
    __tablename__ = 'Observation'

    ID = Column(Integer, Sequence('Observations__id_seq'), primary_key=True)
    FK_ProtocoleType = Column(Integer, ForeignKey('ProtocoleType.ID'), nullable=True)
    FK_Station = Column(Integer, ForeignKey('Station.ID'), nullable=True)
    creationDate = Column(DateTime, default=func.now(), nullable=True)
    Parent_Observation = Column(Integer, nullable=True)
    # Parent_Observation = Column(Integer, ForeignKey('Observation.ID'))
    FK_Individual = Column(Integer, ForeignKey('Individual.ID'), nullable=True)
    original_id = Column(String(255), nullable=True)
    Comments = Column(String(255), nullable=True)



    