from ecoreleve_server.Models import Base,DBSession,Station
from sqlalchemy import Column, DateTime, Float, ForeignKey, Index, Integer, Numeric, String, Text, Unicode, text,Sequence,orm,and_
from sqlalchemy.dialects.mssql.base import BIT
from sqlalchemy.orm import relationship


class Region(Base):

    __tablename__ = 'Region'
    ID =  Column(Integer,Sequence('Region__id_seq'), primary_key=True)
    Country = Column(String(250))
    Region = Column(String(250))

# class Place(Base):

#     __tablename__ = 'Place'
#     ID =  Column(Integer,Sequence('Place__id_seq'), primary_key=True)
#     Place = Column(String)
#     FK_Region = Column(Integer,ForeignKey('Region.ID'))
