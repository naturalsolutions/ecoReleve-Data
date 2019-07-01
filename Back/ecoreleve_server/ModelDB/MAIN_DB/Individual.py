from sqlalchemy import (
    Column,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Sequence,
    Unicode,
    func
    )

from ecoreleve_server.ModelDB import MAIN_DB_BASE



class Individual (MAIN_DB_BASE):

    __tablename__ = 'Individual'


    ID = Column(Integer, Sequence('Individual__id_seq'), primary_key=True)
    creationDate = Column(DateTime, nullable=False, default=func.now())
    Species = Column(Unicode(255), nullable=True)
    Age = Column(Unicode(255), nullable=True )
    Birth_date = Column(Date, nullable=True )
    Death_date = Column(Date, nullable=True)
    FK_IndividualType = Column(Integer,ForeignKey('IndividualType.ID'), nullable=True)
    Original_ID = Column(String(100), default='0', nullable = False)




