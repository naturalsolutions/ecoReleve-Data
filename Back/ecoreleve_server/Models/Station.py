from ecoreleve_server.Models import Base,DBSession
from sqlalchemy import (Column,
 DateTime,
 Float,
 ForeignKey,
 Index,
 Integer,
 Numeric,
 String,
 Text,
 Unicode,
 text,
 Sequence,
 orm,
 and_,
 func,
 insert,
 select,
 UniqueConstraint)
from sqlalchemy.dialects.mssql.base import BIT
from sqlalchemy.orm import relationship
from ..GenericObjets.ObjectWithDynProp import ObjectWithDynProp
from ..GenericObjets.ObjectTypeWithDynProp import ObjectTypeWithDynProp
from ..GenericObjets.FrontModules import FrontModule,ModuleField
from datetime import datetime
from collections import OrderedDict
import pandas as pd 
import numpy as np 
import json

class Station(Base,ObjectWithDynProp):

    __tablename__ = 'Station'

    ID = Column(Integer,Sequence('Stations__id_seq'), primary_key=True)
    StationDate =  Column(DateTime, index=True, nullable=False)
    Name = Column( String)
    LAT = Column(Numeric(9,5))
    LON = Column(Numeric(9,5))
    ELE = Column(Integer)
    precision = Column( Integer)
    fieldActivityId = Column(Integer, ForeignKey('fieldActivity.ID'),nullable=True)
    creator = Column( Integer)
    creationDate = Column(DateTime, server_default=func.now())
    Observations = relationship('Observation',backref='Station')
    StationDynPropValues = relationship('StationDynPropValue',backref='Station')
    FK_StationType = Column(Integer, ForeignKey('StationType.ID'))
    FK_Region = Column(Integer, ForeignKey('Region.ID'), nullable=True)

    __table_args__ = (UniqueConstraint('StationDate', 'LAT', 'LON', name='_unique_constraint_lat_lon_date'),)

    
    @orm.reconstructor
    def init_on_load(self):
        ObjectWithDynProp.__init__(self,DBSession)
        
        
    def GetNewValue(self,nameProp):
        ReturnedValue = StationDynPropValue()
        ReturnedValue.StationDynProp = DBSession.query(StationDynProp).filter(StationDynProp.Name==nameProp).first()
        return ReturnedValue

    def GetDynPropValues(self):
        return self.StationDynPropValues

    def GetDynProps(self,nameProp):
        print(nameProp)
        return  DBSession.query(StationDynProp).filter(StationDynProp.Name==nameProp).one()

    def GetType(self):
        if self.StationType != None :
            return self.StationType
        else :
            return DBSession.query(StationType).get(self.FK_StationType)


class StationDynProp(Base):

    __tablename__ = 'StationDynProp'

    ID = Column(Integer,Sequence('StationDynProp__id_seq'), primary_key=True)
    Name = Column(Unicode(250),nullable=False)
    TypeProp = Column(Unicode(250),nullable=False)
    StationType_StationDynProps = relationship('StationType_StationDynProp',backref='StationDynProp')
    StationDynPropValues = relationship('StationDynPropValue',backref='StationDynProp')

class StationDynPropValue(Base):

    __tablename__ = 'StationDynPropValue'

    ID = Column(Integer,Sequence('StationDynPropValue__id_seq'), primary_key=True)
    StartDate =  Column(DateTime,nullable=False)
    ValueInt =  Column(Integer)
    ValueString =  Column(String)
    ValueDate =  Column(DateTime)
    ValueFloat =  Column(Float)
    FK_StationDynProp = Column(Integer, ForeignKey('StationDynProp.ID'))
    FK_Station = Column(Integer, ForeignKey('Station.ID'))


class StationType(Base,ObjectTypeWithDynProp):

    @orm.reconstructor
    def init_on_load(self):        
        ObjectTypeWithDynProp.__init__(self,DBSession)

    __tablename__ = 'StationType'

    ID = Column(Integer,Sequence('StationType__id_seq'), primary_key=True)
    Name = Column(Unicode(250))
    Status = Column(Integer)
    StationType_StationDynProp = relationship('StationType_StationDynProp',backref='StationType')
    Stations = relationship('Station',backref='StationType')


class StationType_StationDynProp(Base):

    __tablename__ = 'StationType_StationDynProp'

    ID = Column(Integer,Sequence('StationType_StationDynProp__id_seq'), primary_key=True)
    Required = Column(Integer,nullable=False)
    FK_StationType = Column(Integer, ForeignKey('StationType.ID'))
    FK_StationDynProp = Column(Integer, ForeignKey('StationDynProp.ID'))


class fieldActivity(Base):

    __tablename__ = 'fieldActivity'

    ID = Column(Integer,Sequence('fieldActivity__id_seq'), primary_key=True)
    Name = Column(Unicode(250),nullable=False)
