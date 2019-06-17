from ecoreleve_server.ModelDB import MAIN_DB
from sqlalchemy import (
    Column,
    Integer,
    Sequence,
    String)


class FrontModules(MAIN_DB):
    __tablename__ = 'FrontModules'

    ID = Column(Integer, Sequence('FrontModules__id_seq'), primary_key=True)
    Name = Column(String(250), nullable=True)
    TypeModule = Column(Integer, nullable=True)
    Comments = Column(String(2500), nullable=True)
