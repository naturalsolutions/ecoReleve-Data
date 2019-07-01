from sqlalchemy import (
    Boolean,
    Column,
    ForeignKey,
    Integer,
    Sequence
    )

from ecoreleve_server.ModelDB import MAIN_DB_BASE



class ProtocoleType(MAIN_DB_BASE):

    __tablename__ = 'ProtocoleType'

    ID = Column(Integer, Sequence('ProtocoleType__id_seq'), primary_key=True)
    Name = Column(Unicode(250), nullable=True)
    Status = Column(Integer, nullable=True)
    OriginalId = Column(Unicode(250), nullable=True)
    obsolete = Column(Bolean, nullable=True)

