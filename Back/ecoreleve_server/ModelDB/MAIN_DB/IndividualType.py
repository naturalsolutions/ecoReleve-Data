from sqlalchemy import (
    Column,
    Date,
    DateTime,
    Integer,
    String,
    Sequence,
    Unicode,
    func
    )

from ecoreleve_server.ModelDB import MAIN_DB_BASE



class IndividualType (MAIN_DB_BASE):

    __tablename__ = 'IndividualType'


    ID = Column(Integer, Sequence('IndividualType__id_seq'), primary_key=True)
    Name = Column(Unicode(255), nullable=True)
    Status = Column(Integer, nullable=True)




