from ecoreleve_server.ModelDB import MAIN_DB_BASE
from sqlalchemy import (
    Column,
    Integer,
    Sequence,
    String,
    Unicode
    )


class FrontModules(MAIN_DB_BASE):
    __tablename__ = 'FrontModules'

    ID = Column(Integer, Sequence('FrontModules__id_seq'), primary_key=True)
    Name = Column(Unicode(250), nullable=True)
    TypeModule = Column(Integer, nullable=True)
    Comments = Column(Unicode(2500), nullable=True)
