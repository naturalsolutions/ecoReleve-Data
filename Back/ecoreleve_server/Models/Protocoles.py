from ..Models import Base,DBSession,Station,Individual,Sensor
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
    func,
    event)
from sqlalchemy.dialects.mssql.base import BIT
from sqlalchemy.orm import relationship
from ..GenericObjets.ObjectWithDynProp import ObjectWithDynProp
from ..GenericObjets.ObjectTypeWithDynProp import ObjectTypeWithDynProp
from ..GenericObjets.FrontModules import FrontModules,ModuleForms
from datetime import datetime
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.orm import relationship, backref

#--------------------------------------------------------------------------
class Observation(Base,ObjectWithDynProp):
    __tablename__ = 'Observation'
    ID =  Column(Integer,Sequence('Observation__id_seq'), primary_key=True)
    FK_ProtocoleType = Column(Integer, ForeignKey('ProtocoleType.ID'))
    ObservationDynPropValues = relationship('ObservationDynPropValue',backref='Observation')
    FK_Station = Column(Integer, ForeignKey('Station.ID'))
    creationDate = Column(DateTime,default = func.now())
    Parent_Observation = Column(Integer,ForeignKey('Observation.ID'))

    FK_Individual = Column(Integer,ForeignKey('Individual.ID'))

    Observation_children = relationship("Observation", cascade="all, delete-orphan")
    DynPropValues = relationship("ObservationDynPropValue", cascade="all, delete-orphan")
    Equipment = relationship("Equipment", backref = 'Observation',cascade = "all, delete-orphan", uselist=False)
    Station = relationship("Station", back_populates = 'Observations')

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
        return  DBSession.query(ObservationDynProp).filter(ObservationDynProp.Name==nameProp).one()

    def GetType(self):
        if self.ProtocoleType != None :
            return self.ProtocoleType
        else :
            return DBSession.query(ProtocoleType).get(self.FK_ProtocoleType)

    @hybrid_property
    def Observation_childrens(self):
        if self.Observation_children:
            return self.Observation_children
        else:
            return []


    @Observation_childrens.setter
    def Observation_childrens(self,listOfSubProtocols):
        listObs = []
        if len(listOfSubProtocols) !=0 :
            for curData in listOfSubProtocols :
                if 'ID' in curData :
                    subObs = list(filter(lambda x : x.ID==curData['ID'],self.Observation_children))[0]
                else :
                    subObs = Observation(FK_ProtocoleType = curData['FK_ProtocoleType']
                        ,Parent_Observation=self.ID,FK_Station=self.FK_Station)
                    subObs.init_on_load()
                if subObs is not None:
                    subObs.UpdateFromJson(curData)
                    listObs.append(subObs)
            # self.deleteSubObs(listObs)
        self.Observation_children = listObs

    ###### Don't need that ORM do the job #####
    # def deleteSubObs(self,listObs):
    #     print('------- DELETE SUBOBS')
    #     objToDel = list(set(listObs).symmetric_difference(self.Observation_children))
    #     for obj in objToDel:
    #         DBSession.delete(obj)

    def GetFlatObject(self,schema=None):
        result = super().GetFlatObject()
        subObsList = []
        typeName = 'children'
        sub_ProtocoleType = None
        if self.Observation_childrens != []:
            print ('CHILDREN !!!!!!!!!!') ### Append flatdata to list of data for existing subProto 
            typeName = self.Observation_childrens[0].GetType().Name
            for subObs in self.Observation_childrens:
                subObs.LoadNowValues()
                sub_ProtocoleType = subObs.GetType().ID
                subObsList.append(subObs.GetFlatObject())
        result[typeName] = subObsList
        return result


#--------------------------------------------------------------------------
class ObservationDynPropValue(Base):

    __tablename__ = 'ObservationDynPropValue'

    ID = Column(Integer,Sequence('ObservationDynPropValue__id_seq'), primary_key=True)
    StartDate =  Column(DateTime,nullable=False)
    ValueInt =  Column(Integer)
    ValueString =  Column(String(250))
    ValueDate =  Column(DateTime)
    ValueFloat =  Column(Float)
    FK_ObservationDynProp = Column(Integer, ForeignKey('ObservationDynProp.ID'))
    FK_Observation = Column(Integer, ForeignKey('Observation.ID'))


#--------------------------------------------------------------------------
class ObservationDynProp(Base):

    __tablename__ = 'ObservationDynProp'

    ID = Column(Integer,Sequence('ObservationDynProp__id_seq'), primary_key=True)
    Name = Column(Unicode(250),nullable=False)
    TypeProp = Column(Unicode(250),nullable=False)
    ProtocoleType_ObservationDynProps = relationship('ProtocoleType_ObservationDynProp',backref='ObservationDynProp')
    ObservationDynPropValues = relationship('ObservationDynPropValue',backref='ObservationDynProp')


#--------------------------------------------------------------------------
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


#--------------------------------------------------------------------------
class ProtocoleType_ObservationDynProp(Base):

    __tablename__ = 'ProtocoleType_ObservationDynProp'

    ID = Column(Integer,Sequence('ProtocoleType_ObservationDynProp__id_seq'), primary_key=True)
    Required = Column(Integer,nullable=False)
    FK_ProtocoleType = Column(Integer, ForeignKey('ProtocoleType.ID'))
    FK_ObservationDynProp = Column(Integer, ForeignKey('ObservationDynProp.ID'))

