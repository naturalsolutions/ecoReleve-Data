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
 select)
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

    def InsertDTO (self,DTO) : 

        data_to_insert = []
        format_dt = '%Y-%m-%d %H:%M:%S'
        format_dtBis = '%Y-%d-%m %H:%M:%S'
        dateNow = datetime.now()

        ##### Rename field and convert date #####
        for row in DTO :
            newRow = {}
            newRow['LAT'] = row['latitude']
            newRow['LON'] = row['longitude']
            newRow['Name'] = row['name']
            newRow['fieldActivityId'] = 1
            newRow['precision'] = row['Precision']
            newRow['creationDate'] = dateNow
            newRow['id'] = row['id']
            try :
                newRow['StationDate'] = datetime.strptime(row['waypointTime'],format_dt)
            except :
                newRow['StationDate'] = datetime.strptime(row['waypointTime'],format_dtBis)
            data_to_insert.append(newRow)

        ##### Load date into pandas DataFrame then round LAT,LON into decimal(5) #####
        DF_to_check = pd.DataFrame(data_to_insert)
        DF_to_check['LAT'] = np.round(DF_to_check['LAT'],decimals = 5)
        DF_to_check['LON'] = np.round(DF_to_check['LON'],decimals = 5)
        
        ##### Get min/max Value to query potential duplicated stations #####
        maxDate = DF_to_check['StationDate'].max(axis=1)
        minDate = DF_to_check['StationDate'].min(axis=1)
        maxLon = DF_to_check['LON'].max(axis=1)
        minLon = DF_to_check['LON'].min(axis=1)
        maxLat = DF_to_check['LAT'].max(axis=1)
        minLat = DF_to_check['LAT'].min(axis=1)

        ##### Retrieve potential duplicated stations from Database #####
        query = select([Station]).where(
            and_(
                Station.StationDate.between(minDate,maxDate),
                Station.LAT.between(minLat,maxLat)
                ))
        result_to_check = DBSession.execute(query).fetchall()

        if result_to_check :
            ##### IF potential duplicated stations, load them into pandas DataFrame then join data to insert on LAT,LON,DATE #####
            result_to_check = pd.DataFrame(data=result_to_check, columns = Station.__table__.columns.keys())
            result_to_check['LAT'] = result_to_check['LAT'].astype(float)
            result_to_check['LON'] = result_to_check['LON'].astype(float)

            merge_check = pd.merge(DF_to_check,result_to_check , on =['LAT','LON','StationDate'])

            ##### Get only non existing data to insert #####
            DF_to_check = DF_to_check[~DF_to_check['id'].isin(merge_check['id'])]

        DF_to_check = DF_to_check.drop(['id'],1)
        data_to_insert = json.loads(DF_to_check.to_json(orient='records',date_format='iso'))

        ##### Build block insert statement and returning ID of new created stations #####
        if len(data_to_insert) != 0 :
            stmt = self.__table__.insert(returning=[Station.ID]).values(data_to_insert)
            res = DBSession.execute(stmt).fetchall()
            result = list(map(lambda y: y[0], res))
        else : 
            result = []

        response = {'exist': len(DTO)-len(data_to_insert), 'new': len(data_to_insert)}
        
        return response


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
