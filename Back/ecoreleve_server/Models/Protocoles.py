from ecoreleve_server.Models import Base,DBSession
from sqlalchemy import Column, DateTime, Float, ForeignKey, Index, Integer, Numeric, String, Text, Unicode, text,Sequence,orm,and_
from sqlalchemy.dialects.mssql.base import BIT
from sqlalchemy.orm import relationship
from ..GenericObjets.ObjectWithDynProp import ObjectWithDynProp
from ..GenericObjets.ObjectTypeWithDynProp import ObjectTypeWithDynProp
from ..GenericObjets.FrontModules import FrontModule,ModuleField


class Observation(Base,ObjectWithDynProp):
    __tablename__ = 'Observation'
    ID =  Column(Integer,Sequence('Observation__id_seq'), primary_key=True)
    Name = Column(Unicode(250))
    FK_ProtocoleType = Column(Integer, ForeignKey('ProtocoleType.ID'))
    ObservationDynPropValues = relationship('ObservationDynPropValue',backref='Observation')
    FK_Station = Column(Integer, ForeignKey('Station.ID'))

    @orm.reconstructor
    def init_on_load(self):
        ObjectWithDynProp.__init__(self,DBSession)
        
        
    def GetNewValue(self,nameProp):
        ReturnedValue = ObservationDynPropValue()
        ReturnedValue.ObservationDynProp = DBSession.query(ObservationDynProp).filter(ObservationDynProp.Name==nameProp).first()
        return ReturnedValue

    def GetDynPropValues(self):
        return self.ObservationDynPropValues

    def GetDynProps(self,nameProp):
        print(nameProp)
        return  DBSession.query(ObservationDynProp).filter(ObservationDynProp.Name==nameProp).one()

    def GetType(self):
        return self.ProtocoleType



class ObservationDynPropValue(Base):

    __tablename__ = 'ObservationDynPropValue'

    ID = Column(Integer,Sequence('ObservationDynPropValue__id_seq'), primary_key=True)
    StartDate =  Column(DateTime,nullable=False)
    ValueInt =  Column(Integer)
    ValueString =  Column(String)
    ValueDate =  Column(DateTime)
    ValueFloat =  Column(Float)
    FK_ObservationDynProp = Column(Integer, ForeignKey('ObservationDynProp.ID'))
    FK_Observation = Column(Integer, ForeignKey('Observation.ID'))


class ObservationDynProp(Base):

    __tablename__ = 'ObservationDynProp'

    ID = Column(Integer,Sequence('ObservationDynProp__id_seq'), primary_key=True)
    Name = Column(Unicode(250),nullable=False)
    TypeProp = Column(Unicode(250),nullable=False)
    ProtocoleType_ObservationDynProps = relationship('ProtocoleType_ObservationDynProp',backref='ObservationDynProp')
    ObservationDynPropValues = relationship('ObservationDynPropValue',backref='ObservationDynProp')


class ProtocoleType(Base,ObjectTypeWithDynProp):

    @orm.reconstructor
    def init_on_load(self):        
        ObjectTypeWithDynProp.__init__(self,DBSession)

    __tablename__ = 'ProtocoleType'

    ID = Column(Integer,Sequence('ProtocoleType__id_seq'), primary_key=True)
    Name = Column(Unicode(250))
    Status = Column(Integer)
    ProtocoleType_ObservationDynProps = relationship('ProtocoleType_ObservationDynProp',backref='ProtocoleType')
    Observations = relationship('Observation',backref='ProtocoleType')


class ProtocoleType_ObservationDynProp(Base):

    __tablename__ = 'ProtocoleType_ObservationDynProp'

    ID = Column(Integer,Sequence('ProtocoleType_ObservationDynProp__id_seq'), primary_key=True)
    Required = Column(Integer,nullable=False)
    FK_ProtocoleType = Column(Integer, ForeignKey('ProtocoleType.ID'))
    FK_ObservationDynProp = Column(Integer, ForeignKey('ObservationDynProp.ID'))


class Station(Base,ObjectWithDynProp):

    __tablename__ = 'Station'

    ID = Column(Integer,Sequence('Stations__id_seq'), primary_key=True)
    StationDate =  Column(DateTime, index=True, nullable=False)
    Name = Column( String)
    LAT = Column(Numeric(9,5))
    LON = Column(Numeric(9,5))
    ELE = Column(Integer)
    precision = Column( Integer)
    fieldActivityId = Column(Integer, ForeignKey('fieldActivity.ID'))
    creator = Column( Integer)
    creationDate = Column(DateTime)
    Observations = relationship('Observation',backref='Station')
    StationDynPropValues = relationship('StationDynPropValue',backref='Station')
    FK_StationType = Column(Integer, ForeignKey('StationType.ID'))
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
        return self.StationType


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
    ProtocoleType_ObservationDynProps = relationship('StationType_StationDynProp',backref='StationType')
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


    
    