from ..Models import Base,DBSession
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
 Table)
from sqlalchemy.dialects.mssql.base import BIT
from sqlalchemy.ext.hybrid import hybrid_property

from sqlalchemy.orm import relationship
from ..GenericObjets.ObjectWithDynProp import ObjectWithDynProp
from ..GenericObjets.ObjectTypeWithDynProp import ObjectTypeWithDynProp


# ------------------------------------------------------------------------------------------------------------------------- #
class Individual (Base,ObjectWithDynProp) :

    __tablename__ = 'Individual'
    ID = Column (Integer,Sequence('Individual__id_seq'), primary_key = True)
    creationDate = Column (DateTime,nullable=False)
    Species = Column (String(250))
    Age = Column(String(250))
    # UnicIdentifier = Column(String(250))
    Birth_date = Column(DateTime)
    Death_date = Column(DateTime)
    Original_ID = Column(String(250))
    FK_IndividualType = Column(Integer, ForeignKey('IndividualType.ID'))
    # Caisse_ID = Column(String(10))

    IndividualDynPropValues = relationship('IndividualDynPropValue',backref='Individual',cascade="all, delete-orphan")
    Locations = relationship('Individual_Location')

    _Status_ = relationship('IndividualStatus',uselist=False, backref="Individual")


    @hybrid_property
    def Status_(self):
        return self._Status_.Status_

    def __init__(self,**kwargs):
        super().__init__(**kwargs)
        ObjectWithDynProp.__init__(self)

    @orm.reconstructor
    def init_on_load(self):
        ''' init_on_load is called on the fetch of object '''
        ObjectWithDynProp.__init__(self)
        
    def GetNewValue(self,nameProp):
        ReturnedValue = IndividualDynPropValue()
        ReturnedValue.IndividualDynProp = self.ObjContext.query(IndividualDynProp).filter(IndividualDynProp.Name==nameProp).first()
        return ReturnedValue

    def GetDynPropValues(self):
        return self.IndividualDynPropValues

    def GetDynProps(self,nameProp):
        return  self.ObjContext.query(IndividualDynProp).filter(IndividualDynProp.Name==nameProp).one()

    def GetType(self):
        if self.IndividualType != None :
            return self.IndividualType
        else :
            return self.ObjContext.query(IndividualType).get(self.FK_IndividualType)

# ------------------------------------------------------------------------------------------------------------------------- #
class IndividualDynProp (Base) :

    __tablename__ = 'IndividualDynProp'
    ID = Column (Integer,Sequence('IndividualDynProp__id_seq'), primary_key = True)
    Name = Column (String(250),nullable=False)
    TypeProp = Column(String(100),nullable=False)

    IndividualType_IndividualDynProps = relationship('IndividualType_IndividualDynProp',backref='IndividualDynProp')
    IndividualDynPropValues = relationship('IndividualDynPropValue',backref='IndividualDynProp')


# ------------------------------------------------------------------------------------------------------------------------- #
class IndividualDynPropValue(Base):

    __tablename__ = 'IndividualDynPropValue'

    ID = Column(Integer,Sequence('IndividualDynPropValue__id_seq'), primary_key=True)
    StartDate =  Column(DateTime,nullable=False)
    ValueInt =  Column(Integer)
    ValueString =  Column(String(250))
    ValueDate =  Column(DateTime)
    ValueFloat =  Column(Numeric(12,5))
    FK_IndividualDynProp = Column(Integer, ForeignKey('IndividualDynProp.ID'))
    FK_Individual = Column(Integer, ForeignKey('Individual.ID'))

# ------------------------------------------------------------------------------------------------------------------------- #
class IndividualType (Base,ObjectTypeWithDynProp) :

    __tablename__ = 'IndividualType'
    ID = Column (Integer,Sequence('IndividualType__id_seq'), primary_key = True)
    Name = Column (String(250))
    Status = Column(Integer)

    IndividualType_IndividualDynProp = relationship('IndividualType_IndividualDynProp',backref='IndividualType')
    Individuals = relationship('Individual',backref='IndividualType')

    @orm.reconstructor
    def init_on_load(self):
        ObjectTypeWithDynProp.__init__(self)

# ------------------------------------------------------------------------------------------------------------------------- #
class IndividualType_IndividualDynProp(Base):

    __tablename__ = 'IndividualType_IndividualDynProp'

    ID = Column(Integer,Sequence('IndividualType_IndividualDynProp__id_seq'), primary_key=True)
    Required = Column(Integer,nullable=False)
    FK_IndividualType = Column(Integer, ForeignKey('IndividualType.ID'))
    FK_IndividualDynProp = Column(Integer, ForeignKey('IndividualDynProp.ID'))


# ------------------------------------------------------------------------------------------------------------------------- #
class Individual_Location(Base):
    __tablename__ = 'Individual_Location'

    ID = Column(Integer,Sequence('Individual_Location__id_seq'), primary_key=True)
    LAT = Column(Numeric(9,5))
    LON = Column(Numeric(9,5))
    ELE = Column(Integer)
    Date = Column(DateTime)
    Precision = Column(Integer)
    FK_Sensor = Column(Integer, ForeignKey('Sensor.ID'))
    FK_Individual = Column(Integer, ForeignKey('Individual.ID'))
    creator =  Column(Integer)
    creationDate = Column(DateTime)
    type_ = Column(String(10))

class IndividualStatus(Base):
    __table__ =  Table('IndividualStatus', Base.metadata,
        Column('FK_Individual', Integer, ForeignKey('Individual.ID'),primary_key= True),
        Column('Status_', String)
        )
    FK_Individual = __table__.c['FK_Individual']
    Status_ = __table__.c['Status_']

    # __mapper_args__ = {
    #     'polymorphic_on':Status_,
    #     'polymorphic_identity':'object'
    # }