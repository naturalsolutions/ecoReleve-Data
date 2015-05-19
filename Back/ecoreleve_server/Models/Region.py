from ecoreleve_server.Models import Base,DBSession,Station
from sqlalchemy import Column, DateTime, Float, ForeignKey, Index, Integer, Numeric, String, Text, Unicode, text,Sequence,orm,and_
from sqlalchemy.dialects.mssql.base import BIT
from sqlalchemy.orm import relationship


class Region(Base):

	__tablename__ = 'Region'
	ID =  Column(Integer,Sequence('Region__id_seq'), primary_key=True)
	Country = Column(String)
	Region = Column(String)