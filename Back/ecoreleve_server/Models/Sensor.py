# from ecoreleve_server.Models import Base,DBSession
# from sqlalchemy import (Column,
#  DateTime,
#  Float,
#  ForeignKey,
#  Index,
#  Integer,
#  Numeric,
#  String,
#  Text,
#  Unicode,
#  text,
#  Sequence,
#  orm,
#  and_,
#  func)
# from sqlalchemy.dialects.mssql.base import BIT
# from sqlalchemy.orm import relationship
# from ..GenericObjets.ObjectWithDynProp import ObjectWithDynProp
# from ..GenericObjets.ObjectTypeWithDynProp import ObjectTypeWithDynProp



# class SensorType (Base,ObjectTypeWithDynProp) :

#     __tablename__ = 'SensorType'
#     ID = Column (Integer,Sequence('SensorType__id_seq'), primary_key = True)
#     Name = Column (String)
#     Status = Column(Integer)


# class Sensor (Base,ObjectWithDynProp) :

#     __tablename__ = 'Sensor'
#     ID = Column (Integer,Sequence('Sensor__id_seq'), primary_key = True)
#     Name = Column (String)
#     creationDate = Column (DateTime,nullable=False)


# class SensorDynProp (Base) :

#     __tablename__ = 'SensorDynProp'
#     ID = Column (Integer,Sequence('SensorDynProp__id_seq'), primary_key = True)
#     Name = Column (String,nullable=False)
#     TypeProp = Column(String,nullable=False)


# class SensorDynPropValue(Base):

#     __tablename__ = 'SensorDynPropValue'

#     ID = Column(Integer,Sequence('SensorDynPropValue__id_seq'), primary_key=True)
#     StartDate =  Column(DateTime,nullable=False)
#     ValueInt =  Column(Integer)
#     ValueString =  Column(String)
#     ValueDate =  Column(DateTime)
#     ValueFloat =  Column(Float)
#     FK_SensorDynProp = Column(Integer, ForeignKey('SensorDynProp.ID'))
#     FK_Sensor = Column(Integer, ForeignKey('Sensor.ID'))


# class SensorType_SensorDynProp(Base):

#     __tablename__ = 'SensorType_SensorDynProp'

#     ID = Column(Integer,Sequence('SensorType_SensorDynProp__id_seq'), primary_key=True)
#     Required = Column(Integer,nullable=False)
#     FK_SensorType = Column(Integer, ForeignKey('SensorType.ID'))
#     FK_SensorDynProp = Column(Integer, ForeignKey('SensorDynProp.ID'))