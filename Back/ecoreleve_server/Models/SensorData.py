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




# ------------------------------------------------------------------------------------------------------------------------- #
# class SensorDataType (Base,ObjectTypeWithDynProp) :

#     __tablename__ = 'SensorDataType'
#     ID = Column (Integer,Sequence('SensorDataType__id_seq'), primary_key = True)
#     Name = Column (String)
#     Status = Column(Integer)

# ------------------------------------------------------------------------------------------------------------------------- #
# class SensorData (Base,ObjectTypeWithDynProp) :

#     __tablename__ = 'SensorData'
#     ID = Column (Integer,Sequence('SensorData__id_seq'), primary_key = True)
#     Name = Column (String)
#     creationDate = Column (DateTime,nullable=False)

# ------------------------------------------------------------------------------------------------------------------------- #
# class SensorDataDynProp (Base) :

#     __tablename__ = 'SensorDataDynProp'
#     ID = Column (Integer,Sequence('SensorDataDynProp__id_seq'), primary_key = True)
#     Name = Column (String,nullable=False)
#     TypeProp = Column(String,nullable=False)


# ------------------------------------------------------------------------------------------------------------------------- #
# class SensorDataDynPropValue(Base):

#     __tablename__ = 'SensorDataDynPropValue'

#     ID = Column(Integer,Sequence('SensorDataDynPropValue__id_seq'), primary_key=True)
#     StartDate =  Column(DateTime,nullable=False)
#     ValueInt =  Column(Integer)
#     ValueString =  Column(String)
#     ValueDate =  Column(DateTime)
#     ValueFloat =  Column(Float)
#     FK_SensorDataDynProp = Column(Integer, ForeignKey('SensorDataDynProp.ID'))
#     FK_SensorData = Column(Integer, ForeignKey('SensorData.ID'))



# ------------------------------------------------------------------------------------------------------------------------- #
# class SensorDataType_SensorDataDynProp(Base):

#     __tablename__ = 'SensorDataType_SensorDataDynProp'

#     ID = Column(Integer,Sequence('SensorDataType_SensorDataDynProp__id_seq'), primary_key=True)
#     Required = Column(Integer,nullable=False)
#     FK_SensorDataType = Column(Integer, ForeignKey('SensorDataType.ID'))
#     FK_SensorDataDynProp = Column(Integer, ForeignKey('SensorDataDynProp.ID'))


# ------------------------------------------------------------------------------------------------------------------------- #
# class Equip_Sensor (Base) :

#     __tablename__ = 'Equip_Sensor'

#     ID = Column(Integer,Sequence('Equip_Sensor__id_seq'), primary_key=True)
#     FK_Sensor = Column(Integer, ForeignKey('Sensor.ID'))
    # FK_Individual = Column(Integer, ForeignKey('Individual.ID'))
    # FK_Site = Column(Integer, ForeignKey('MonitoredSite.ID'))
    # StartDate = Column(DateTime)

