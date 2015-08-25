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
 func)
from sqlalchemy.dialects.mssql.base import BIT
from sqlalchemy.orm import relationship
from ..GenericObjets.ObjectWithDynProp import ObjectWithDynProp
from ..GenericObjets.ObjectTypeWithDynProp import ObjectTypeWithDynProp


# ------------------------------------------------------------------------------------------------------------------------- #
class IndividualType (Base,ObjectTypeWithDynProp) :

    __tablename__ = 'IndividualType'
    ID = Column (Integer,Sequence('IndividualType__id_seq'), primary_key = True)
    Name = Column (String)
    Status = Column(Integer)


# ------------------------------------------------------------------------------------------------------------------------- #
class Individual (Base,ObjectWithDynProp) :

    __tablename__ = 'Individual'
    ID = Column (Integer,Sequence('Individual__id_seq'), primary_key = True)
    Name = Column (String)
    creationDate = Column (DateTime,nullable=False)
    Age = Column(String)
    Sex = Column(String)
    Birth_date = Column(DateTime,nullable=False)
    Death_date = Column(DateTime)


# ------------------------------------------------------------------------------------------------------------------------- #
class IndividualDynProp (Base) :

    __tablename__ = 'IndividualDynProp'
    ID = Column (Integer,Sequence('IndividualDynProp__id_seq'), primary_key = True)
    Name = Column (String,nullable=False)
    TypeProp = Column(String,nullable=False)


# ------------------------------------------------------------------------------------------------------------------------- #
class IndividualDynPropValue(Base):

    __tablename__ = 'IndividualDynPropValue'

    ID = Column(Integer,Sequence('IndividualDynPropValue__id_seq'), primary_key=True)
    StartDate =  Column(DateTime,nullable=False)
    ValueInt =  Column(Integer)
    ValueString =  Column(String)
    ValueDate =  Column(DateTime)
    ValueFloat =  Column(Float)
    FK_IndividualDynProp = Column(Integer, ForeignKey('IndividualDynProp.ID'))
    FK_Individual = Column(Integer, ForeignKey('Individual.ID'))


# ------------------------------------------------------------------------------------------------------------------------- #
class IndividualType_IndividualDynProp(Base):

    __tablename__ = 'IndividualType_IndividualDynProp'

    ID = Column(Integer,Sequence('IndividualType_IndividualDynProp__id_seq'), primary_key=True)
    Required = Column(Integer,nullable=False)
    FK_IndividualType = Column(Integer, ForeignKey('IndividualType.ID'))
    FK_IndividualDynProp = Column(Integer, ForeignKey('IndividualDynProp.ID'))


# ------------------------------------------------------------------------------------------------------------------------- #
# class Individual_Location(Base):
#      __tablename__ = 'Individual_Location'

#     ID = Column(Integer,Sequence('Individual_Location__id_seq'), primary_key=True)
#     LAT = Column(Numeric(9,5))
#     LON = Column(Numeric(9,5))
#     Date = Column(DateTime)
#     FK_Sensor = Column(Integer, ForeignKey('Sensor.ID'))
#     FK_Individual = Column(Integer, ForeignKey('Individual.ID'))