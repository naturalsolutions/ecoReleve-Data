from ecoreleve_server.Models import Base,DBSession,Station
from sqlalchemy import (
    Column,
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
    func)
from sqlalchemy.dialects.mssql.base import BIT
from sqlalchemy.orm import relationship
from ..GenericObjets.ObjectWithDynProp import ObjectWithDynProp
from ..GenericObjets.ObjectTypeWithDynProp import ObjectTypeWithDynProp
from ..GenericObjets.FrontModules import FrontModule,ModuleField
from datetime import datetime

class Observation(Base,ObjectWithDynProp):
    __tablename__ = 'Observation'
    ID =  Column(Integer,Sequence('Observation__id_seq'), primary_key=True)
    FK_ProtocoleType = Column(Integer, ForeignKey('ProtocoleType.ID'))
    ObservationDynPropValues = relationship('ObservationDynPropValue',backref='Observation')
    FK_Station = Column(Integer, ForeignKey('Station.ID'))
    creationDate = Column(DateTime,default = func.now())
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
        if self.ProtocoleType != None :
            print ('___________GET TYPE ________') 
            print (self.ProtocoleType.ID)
            return self.ProtocoleType
        else :
            return DBSession.query(ProtocoleType).get(self.FK_ProtocoleType)



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

