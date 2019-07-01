from sqlalchemy import (
    Column,
    Integer,
    Sequence,
    String
    
)

from ecoreleve_server.ModelDB import MAIN_DB_BASE


class BusinessRules(MAIN_DB_BASE):

    __tablename__ = 'BusinessRules'

    ID = Column(Integer, Sequence('BusinessRules__id_seq'), primary_key=True)
    name =  Column(String(250), nullable=True)
    target =  Column(String(250), nullable=True)
    targetType =  Column(String(250), nullable=True)
    actionType =  Column(String(250), nullable=True)
    executing =  Column(String(250), nullable=True)
    params =  Column(String(250), nullable=True)
    description =  Column(String(250), nullable=True)
    errorValue =  Column(String(250), nullable=True)