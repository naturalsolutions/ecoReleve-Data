from ecoreleve_server.Models import Base,DBSession,FieldActivity
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
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.dialects.mssql.base import BIT
from sqlalchemy.orm import relationship
from ..GenericObjets.ObjectWithDynProp import ObjectWithDynProp
from ..GenericObjets.ObjectTypeWithDynProp import ObjectTypeWithDynProp
from ..GenericObjets.FrontModules import FrontModules,ModuleGrids
from ..GenericObjets.ListObjectWithDynProp import ListObjectWithDynProp
from datetime import datetime
from collections import OrderedDict
import pandas as pd 
import numpy as np 
import json


#--------------------------------------------------------------------------
class Station(Base,ObjectWithDynProp):

    __tablename__ = 'Station'

    ID = Column(Integer,Sequence('Stations__id_seq'), primary_key=True)
    StationDate =  Column(DateTime, index=True, nullable=False)
    Name = Column( String(250))
    LAT = Column(Numeric(9,5))
    LON = Column(Numeric(9,5))
    ELE = Column(Integer)
    precision = Column( Integer)
    fieldActivityId = Column(Integer, ForeignKey('fieldActivity.ID'),nullable=True)
    creator = Column( Integer)
    creationDate = Column(DateTime, default=func.now())
    Observations = relationship('Observation', back_populates = 'Station',cascade="all, delete-orphan")
    StationDynPropValues = relationship('StationDynPropValue',backref='Station',cascade="all, delete-orphan")
    FK_StationType = Column(Integer, ForeignKey('StationType.ID'))


    FK_Region = Column(Integer, ForeignKey('Region.ID'), nullable=True)
    FK_MonitoredSite = Column(Integer, ForeignKey('MonitoredSite.ID'), nullable=True)

    
    Place = Column(String(250))

    Station_FieldWorkers = relationship('Station_FieldWorker', backref='Station',cascade="all, delete-orphan")
    __table_args__ = (UniqueConstraint('StationDate', 'LAT', 'LON', name='_unique_constraint_lat_lon_date'),)

    ''' hybrid property on relationship '''
    @hybrid_property
    def FieldWorkers(self):
        if self.Station_FieldWorkers:
            fws = []
            for curFW in self.Station_FieldWorkers:
                fws.append({'FieldWorker':curFW.FK_FieldWorker,'ID':curFW.ID })
            return fws
        else:
            return []

    ''' Configure a setter for this hybrid property '''
    @FieldWorkers.setter
    def FieldWorkers(self, values):
            fws=[]
            if len(values) !=0 :
                for item in values:
                    if 'ID' in item:
                        curFW = list(filter(lambda x : x.ID==item['ID'],self.Station_FieldWorkers))[0]
                        curFW.FK_FieldWorker = int(item['FieldWorker'])
                    else:
                        curFW = Station_FieldWorker( FK_FieldWorker = int(item['FieldWorker']), FK_Station=self.ID)
                    fws.append(curFW)
            self.Station_FieldWorkers = fws

    @FieldWorkers.expression
    def FieldWorkers(cls):
        return Station_FieldWorker.id

    @orm.reconstructor
    def init_on_load(self):
        ''' init_on_load is called on the fetch of object '''
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

    def GetDTOWithSchema(self,FrontModules,DisplayMode):
        ''' Override this super method to add fieldworker '''
        resultat = super().GetDTOWithSchema(FrontModules,DisplayMode)
        if self.ID :
            resultat['data']['FieldWorkers'] = self.FieldWorkers
        else:
            resultat['data']['FieldWorkers'] = [{'id' : 0}]
        return resultat


#--------------------------------------------------------------------------
class StationDynProp(Base):

    __tablename__ = 'StationDynProp'

    ID = Column(Integer,Sequence('StationDynProp__id_seq'), primary_key=True)
    Name = Column(Unicode(250),nullable=False)
    TypeProp = Column(Unicode(250),nullable=False)
    StationType_StationDynProps = relationship('StationType_StationDynProp',backref='StationDynProp')
    StationDynPropValues = relationship('StationDynPropValue',backref='StationDynProp')


#--------------------------------------------------------------------------
class StationDynPropValue(Base):

    __tablename__ = 'StationDynPropValue'

    ID = Column(Integer,Sequence('StationDynPropValue__id_seq'), primary_key=True)
    StartDate =  Column(DateTime,nullable=False)
    ValueInt =  Column(Integer)
    ValueString =  Column(String(250))
    ValueDate =  Column(DateTime)
    ValueFloat =  Column(Float)
    FK_StationDynProp = Column(Integer, ForeignKey('StationDynProp.ID'))
    FK_Station = Column(Integer, ForeignKey('Station.ID'))
    # station = relationship('Station',cascade="all, delete-orphan", single_parent = True)


#--------------------------------------------------------------------------
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


#--------------------------------------------------------------------------
class StationType_StationDynProp(Base):

    __tablename__ = 'StationType_StationDynProp'

    ID = Column(Integer,Sequence('StationType_StationDynProp__id_seq'), primary_key=True)
    Required = Column(Integer,nullable=False)
    FK_StationType = Column(Integer, ForeignKey('StationType.ID'))
    FK_StationDynProp = Column(Integer, ForeignKey('StationDynProp.ID'))


#--------------------------------------------------------------------------
class Station_FieldWorker (Base) :

    __tablename__ = 'Station_FieldWorker'

    ID = Column(Integer,Sequence('Station_FieldWorker__id_seq'), primary_key=True)
    FK_Station = Column(Integer,ForeignKey('Station.ID'))
    FK_FieldWorker = Column(Integer,ForeignKey('User.ID'))

    FieldWorker = relationship('User')

    @hybrid_property
    def FieldWorkerName (self):
        if self.FieldWorker:
            return self.FieldWorker.Login
        else:
            return None

    @hybrid_property
    def FieldWorkerID (self):
        if self.FieldWorker:
            return self.FieldWorker.id
        else:
            return None
