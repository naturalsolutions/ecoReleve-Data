from ..Models import Base,DBSession,ModuleForms
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
 desc,
 select)
from sqlalchemy.dialects.mssql.base import BIT
from sqlalchemy.orm import relationship
from ..GenericObjets.ObjectWithDynProp import ObjectWithDynProp
from ..GenericObjets.ObjectTypeWithDynProp import ObjectTypeWithDynProp
from traceback import print_exc
from datetime import datetime
from ..utils.parseValue import parseValue,find,isEqual
from ..utils.datetime import parse



# ------------------------------------------------------------------------------------------------------------------------- #
class MonitoredSitePosition(Base):

    __tablename__ = 'MonitoredSitePosition'
    ID = Column (Integer,Sequence('MonitoredSitePositions__id_seq'), primary_key = True)
    LAT = Column(Numeric(9,5))
    LON = Column(Numeric(9,5))
    ELE = Column(Integer)
    Precision = Column(Integer)
    StartDate = Column(DateTime)
    Comments = Column(String(250))
    FK_MonitoredSite = Column(Integer, ForeignKey('MonitoredSite.ID'))

# ------------------------------------------------------------------------------------------------------------------------- #
class MonitoredSite (Base,ObjectWithDynProp) :

    __tablename__ = 'MonitoredSite'
    ID = Column (Integer,Sequence('MonitoredSite__id_seq'), primary_key = True)
    Name = Column (String(250), nullable=False)
    Category = Column(String(250), nullable=False)
    Creator = Column(Integer, nullable=False)
    Active = Column(BIT, nullable=False, default = 1)
    creationDate = Column(DateTime,nullable=False, default = func.now())

    FK_MonitoredSiteType = Column(Integer, ForeignKey('MonitoredSiteType.ID'))

    MonitoredSitePositions = relationship('MonitoredSitePosition',backref='MonitoredSite',cascade="all, delete-orphan")
    MonitoredSiteDynPropValues = relationship('MonitoredSiteDynPropValue',backref='MonitoredSite',cascade="all, delete-orphan")

    def __init__(self,**kwargs):
        super().__init__(**kwargs)
        ObjectWithDynProp.__init__(self)

    @orm.reconstructor
    def init_on_load(self):
        ''' init_on_load is called on the fetch of object '''
        ObjectWithDynProp.__init__(self)

    def GetNewValue(self,nameProp):
        ReturnedValue = MonitoredSiteDynPropValue()
        ReturnedValue.MonitoredSiteDynProp = self.ObjContext.query(MonitoredSiteDynProp).filter(MonitoredSiteDynProp.Name==nameProp).first()
        return ReturnedValue

    def GetDynPropValues(self):
        return self.MonitoredSiteDynPropValues

    def GetDynProps(self,nameProp):
        return  self.ObjContext.query(MonitoredSiteDynProp).filter(MonitoredSiteDynProp.Name==nameProp).one()

    def GetType(self):
        if self.MonitoredSiteType != None :
            return self.MonitoredSiteType
        else :
            return self.ObjContext.query(MonitoredSiteType).get(self.FK_MonitoredSiteType)

    def GetAllProp(self):
        props = super(MonitoredSite,self).GetAllProp()
        props.extend([{'name': statProp.key, 'type': statProp.type} for statProp in MonitoredSitePosition.__table__.columns])
        return props

    def GetLastPositionWithDate(self,date_):
        query = select([MonitoredSitePosition]
            ).where(and_(MonitoredSitePosition.FK_MonitoredSite == self.ID,MonitoredSitePosition.StartDate <= date_)
            ).order_by(desc(MonitoredSitePosition.StartDate)).limit(1)
        curPos = dict(self.ObjContext.execute(query).fetchone())
        return curPos

    def LoadNowValues(self):
        super(MonitoredSite,self).LoadNowValues()
        lastPos = self.GetLastPositionWithDate(func.now())
        if lastPos is not None :
            for key in lastPos:
                self.PropDynValuesOfNow[key] = lastPos[key]

    def GetSchemaFromStaticProps(self,FrontModules,DisplayMode):
        Editable = (DisplayMode.lower()  == 'edit')
        resultat = {}
        type_ = self.GetType().ID
        Fields = self.ObjContext.query(ModuleForms).filter(ModuleForms.Module_ID == FrontModules.ID).order_by(ModuleForms.FormOrder).all()
        curEditable = Editable
        SiteProps = dict(self.__table__.columns)
        PoseProps = dict(MonitoredSitePosition.__table__.columns)
        del PoseProps['ID']
        SiteProps.update(PoseProps)

        for curStatProp in SiteProps:
            CurModuleForms = list(filter(lambda x : x.Name == curStatProp and (x.TypeObj== str(type_) or x.TypeObj == None) , Fields))
            if (len(CurModuleForms)> 0 ):
                # Conf définie dans FrontModules
                CurModuleForms = CurModuleForms[0]
                resultat[CurModuleForms.Name] = CurModuleForms.GetDTOFromConf(Editable)
        return resultat

    def GetFlatObject(self,schema=None):
        ''' return flat object with static properties and last existing value of dyn props '''
        resultat = {}
        if self.ID is not None : 
            max_iter = max(len( self.__table__.columns),len(self.PropDynValuesOfNow))
            for i in range(max_iter) :
                #### Get static Properties ####
                try :
                    curStatProp = list(self.__table__.columns)[i]
                    resultat[curStatProp.key] = self.GetProperty(curStatProp.key)
                except :
                    pass
                #### Get dynamic Properties ####
                try :
                    curDynPropName = list(self.PropDynValuesOfNow)[i]
                    resultat[curDynPropName] = self.GetProperty(curDynPropName)
                except Exception as e :
                    # print_exc()
                    pass
        else : 
            max_iter = len( self.__table__.columns)
            for i in range(max_iter) :
                #### Get static Properties ####
                try :
                    curStatProp = list(self.__table__.columns)[i]
                    curVal = self.GetProperty(curStatProp.key)
                    if curVal is not None :
                        resultat[curStatProp.key] = self.GetProperty(curStatProp.key)
                except :
                    pass
        return resultat

    def SetProperty(self,nameProp,valeur,useDate=None) :
        super().SetProperty(nameProp,valeur)
        if hasattr(self.newPosition,nameProp):
            curTypeAttr = str(self.newPosition.__table__.c[nameProp].type).split('(')[0]

            if 'date'.lower() in curTypeAttr.lower() :
                    valeur = parse(valeur.replace(' ',''))
                    setattr(self.newPosition,nameProp,valeur)
                    # valeur = valeur.strftime('%Y-%m-%d %H:%M:%S')
            else :
                setattr(self.newPosition,nameProp,valeur)
            if (nameProp not in self.PropDynValuesOfNow) or (isEqual(self.PropDynValuesOfNow[nameProp],valeur) is False):
                self.positionChanged = True

    def UpdateFromJson(self,DTOObject):
        self.newPosition = MonitoredSitePosition()
        self.positionChanged = False
        super(MonitoredSite,self).UpdateFromJson(DTOObject)
        if self.positionChanged:
            self.MonitoredSitePositions.append(self.newPosition)


# ------------------------------------------------------------------------------------------------------------------------- #
class MonitoredSiteDynProp (Base) :

    __tablename__ = 'MonitoredSiteDynProp'
    ID = Column (Integer,Sequence('MonitoredSiteDynProp__id_seq'), primary_key = True)
    Name = Column (String(250),nullable=False)
    TypeProp = Column(String(100),nullable=False)

    MonitoredSiteType_MonitoredSiteDynProps = relationship('MonitoredSiteType_MonitoredSiteDynProp',backref='MonitoredSiteDynProp')
    MonitoredSiteDynPropValues = relationship('MonitoredSiteDynPropValue',backref='MonitoredSiteDynProp')

# ------------------------------------------------------------------------------------------------------------------------- #
class MonitoredSiteDynPropValue(Base):

    __tablename__ = 'MonitoredSiteDynPropValue'

    ID = Column(Integer,Sequence('MonitoredSiteDynPropValue__id_seq'), primary_key=True)
    StartDate =  Column(DateTime,nullable=False)
    ValueInt =  Column(Integer)
    ValueString =  Column(String(250))
    ValueDate =  Column(DateTime)
    ValueFloat =  Column(Numeric(12,5))
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
    Name = Column (String(250))
    Status = Column(Integer)

    MonitoredSiteType_MonitoredSiteDynProp = relationship('MonitoredSiteType_MonitoredSiteDynProp',backref='MonitoredSiteType')
    MonitoredSites = relationship('MonitoredSite',backref='MonitoredSiteType')

    @orm.reconstructor
    def init_on_load(self):
        ObjectTypeWithDynProp.__init__(self,DBSession)

