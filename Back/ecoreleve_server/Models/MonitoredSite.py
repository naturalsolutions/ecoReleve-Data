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
class MonitoredSite (Base,ObjectWithDynProp) :

    __tablename__ = 'MonitoredSite'
    ID = Column (Integer,Sequence('MonitoredSite__id_seq'), primary_key = True)
    Name = Column (String, nullable=False)
    Category = Column(String, nullable=False)
    Creator = Column(Integer, nullable=False)
    Active = Column(BIT, nullable=False)
    creationDate = Column(DateTime,nullable=False)

    FK_MonitoredSiteType = Column(Integer, ForeignKey('MonitoredSiteType.ID'))


    MonitoredSiteDynPropValues = relationship('MonitoredSiteDynPropValue',backref='MonitoredSite',cascade="all, delete-orphan")

    @orm.reconstructor
    def init_on_load(self):
        ''' init_on_load is called on the fetch of object '''
        ObjectWithDynProp.__init__(self,DBSession)
        
    def GetNewValue(self,nameProp):
        ReturnedValue = MonitoredSiteDynPropValue()
        ReturnedValue.MonitoredSiteDynProp = DBSession.query(MonitoredSiteDynProp).filter(MonitoredSiteDynProp.Name==nameProp).first()
        return ReturnedValue

    def GetDynPropValues(self):
        return self.MonitoredSiteDynPropValues

    def GetDynProps(self,nameProp):
        print(nameProp)
        return  DBSession.query(MonitoredSiteDynProp).filter(MonitoredSiteDynProp.Name==nameProp).one()

    def GetType(self):
        if self.MonitoredSiteType != None :
            return self.MonitoredSiteType
        else :
            return DBSession.query(MonitoredSiteType).get(self.FK_MonitoredSiteType)

# ------------------------------------------------------------------------------------------------------------------------- #
class MonitoredSiteDynProp (Base) :

    __tablename__ = 'MonitoredSiteDynProp'
    ID = Column (Integer,Sequence('MonitoredSiteDynProp__id_seq'), primary_key = True)
    Name = Column (String,nullable=False)
    TypeProp = Column(String,nullable=False)

    MonitoredSiteType_MonitoredSiteDynProps = relationship('MonitoredSiteType_MonitoredSiteDynProp',backref='MonitoredSiteDynProp')
    MonitoredSiteDynPropValues = relationship('MonitoredSiteDynPropValue',backref='MonitoredSiteDynProp')

# ------------------------------------------------------------------------------------------------------------------------- #
class MonitoredSiteDynPropValue(Base):

    __tablename__ = 'MonitoredSiteDynPropValue'

    ID = Column(Integer,Sequence('MonitoredSiteDynPropValue__id_seq'), primary_key=True)
    StartDate =  Column(DateTime,nullable=False)
    ValueInt =  Column(Integer)
    ValueString =  Column(String)
    ValueDate =  Column(DateTime)
    ValueFloat =  Column(Float)
    FK_MonitoredSiteDynProp = Column(Integer, ForeignKey('MonitoredSiteDynProp.ID'))
    FK_MonitoredSite = Column(Integer, ForeignKey('MonitoredSite.ID'))



# ------------------------------------------------------------------------------------------------------------------------- #
class MonitoredSiteType_MonitoredSiteDynProp(Base):

    __tablename__ = 'MonitoredSiteType_MonitoredSiteDynProp'

    ID = Column(Integer,Sequence('MonitoredSiteType_MonitoredSiteDynProp__id_seq'), primary_key=True)
    Required = Column(Integer,nullable=False)
    FK_MonitoredSiteType = Column(Integer, ForeignKey('MonitoredSiteType.ID'))
    FK_MonitoredSiteDynProp = Column(Integer, ForeignKey('MonitoredSiteDynProp.ID'))


# ------------------------------------------------------------------------------------------------------------------------- #
class MonitoredSiteType (Base,ObjectTypeWithDynProp) :

    __tablename__ = 'MonitoredSiteType'
    ID = Column (Integer,Sequence('MonitoredSiteType__id_seq'), primary_key = True)
    Name = Column (String)
    Status = Column(Integer)

    MonitoredSiteType_MonitoredSiteDynProp = relationship('MonitoredSiteType_MonitoredSiteDynProp',backref='MonitoredSiteType')
    MonitoredSites = relationship('MonitoredSite',backref='MonitoredSiteType')

    @orm.reconstructor
    def init_on_load(self):
        ObjectTypeWithDynProp.__init__(self,DBSession)

