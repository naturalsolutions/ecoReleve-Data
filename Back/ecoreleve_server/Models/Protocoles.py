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
from ..utils.parseValue import isNumeric

#--------------------------------------------------------------------------
class Observation(Base,ObjectWithDynProp):
    __tablename__ = 'Observation'
    ID =  Column(Integer,Sequence('Observation__id_seq'), primary_key=True)
    FK_ProtocoleType = Column(Integer, ForeignKey('ProtocoleType.ID'))
    ObservationDynPropValues = relationship('ObservationDynPropValue',backref='Observation', cascade="all, delete-orphan")
    FK_Station = Column(Integer, ForeignKey('Station.ID'))
    creationDate = Column(DateTime,default = func.now())
    Parent_Observation = Column(Integer,ForeignKey('Observation.ID'))
    Comments = Column(String(250))
    FK_Individual = Column(Integer,ForeignKey('Individual.ID'))

    Observation_children = relationship("Observation", cascade="all, delete-orphan")
    SubObservation_children = relationship("ObservationDynPropSubValue", cascade="all, delete-orphan")
    Equipment = relationship("Equipment", backref = 'Observation',cascade = "all, delete-orphan", uselist=False)
    Station = relationship("Station", back_populates = 'Observations')
    Individual = relationship('Individual')

    def __init__(self,**kwargs):
        Base.__init__(self,**kwargs)
        ObjectWithDynProp.__init__(self)

    @orm.reconstructor
    def init_on_load(self):
        ObjectWithDynProp.__init__(self)

    def GetNewValue(self,nameProp):
        ReturnedValue = ObservationDynPropValue()
        ReturnedValue.ObservationDynProp = self.ObjContext.query(ObservationDynProp).filter(ObservationDynProp.Name==nameProp).first()
        return ReturnedValue

    def GetDynPropValues(self):
        return self.ObservationDynPropValues

    def GetDynProps(self,nameProp):
        return  self.ObjContext.query(ObservationDynProp).filter(ObservationDynProp.Name==nameProp).one()

    def GetType(self):
        if self.ProtocoleType != None :
            return self.ProtocoleType
        else :
            return self.ObjContext.query(ProtocoleType).get(self.FK_ProtocoleType)

    def linkedFieldDate(self):
        try :
            return self.Station.StationDate
        except :
            return datetime.now()


    @hybrid_property
    def Observation_childrens(self):
        if self.Observation_children is not None or self.Observation_children != []:
            return True
        else:
            return []

    @Observation_childrens.setter
    def Observation_childrens(self,listOfSubProtocols):
        listObs = []
        if len(listOfSubProtocols) !=0 :

            for curData in listOfSubProtocols :
                if self.GetType().Status == 8 :
                # if self.GetType().Name == 'Transects' :
                    subDictList = []
                    for k,v in curData.items():
                        subDict = {}
                        col = k
                        if isNumeric(v) and 'C' in k and isNumeric(col.split('C')[1]):
                            newRow = {k:v}
                            subDict['FieldName'] = k
                            subDict['valeur'] = v
                            # del curData[k]
                            subDictList.append(subDict)
                    curData['listOfSubObs'] = subDictList

                if 'ID' in curData and curData['ID'] is not None:
                    subObs = list(filter(lambda x : x.ID==curData['ID'],self.Observation_children))[0]
                    subObs.LoadNowValues()
                else :
                    subObs = Observation(FK_ProtocoleType =  curData['FK_ProtocoleType'] ,Parent_Observation=self.ID,FK_Station=self.FK_Station)
                    subObs.init_on_load()

                if subObs is not None:
                    subObs.UpdateFromJson(curData)
                    listObs.append(subObs)
            # self.deleteSubObs(listObs)
        self.Observation_children = listObs

    @hybrid_property
    def SubObservation_childrens(self):
        dictToUpdate = {}
        if self.SubObservation_children is not None or self.SubObservation_children != []:
            for row in self.SubObservation_children:
                dictToUpdate[row.FieldName] = row.ValueNumeric
        return dictToUpdate

    @SubObservation_childrens.setter
    def SubObservation_childrens(self,listOfSubObs):
        listSubValues = []
        if len(listOfSubObs)>0 :
            for curData in listOfSubObs :
                if 'FK_Observation' in curData :
                    subObsValue = list(filter(lambda x : x.FK_Observation==curData['FK_Observation'] and x.FieldName == curData['FieldName']
                        ,self.SubObservation_children))[0]
                else :
                    subObsValue = ObservationDynPropSubValue(FK_Observation = self.ID)

                if subObsValue is not None:
                    subObsValue.ValueNumeric = curData['valeur']
                    subObsValue.FieldName = curData['FieldName']
                    listSubValues.append(subObsValue)
            # self.deleteSubObs(listSubValues)
        self.SubObservation_children = listSubValues

    def UpdateFromJson(self,DTOObject,startDate = None):
        ObjectWithDynProp.UpdateFromJson(self,DTOObject,None)
        if 'listOfSubObs' in DTOObject :
            self.SubObservation_childrens = DTOObject['listOfSubObs']
        self.updateLinkedField()

    def GetFlatObject(self,schema=None):
        result = super().GetFlatObject()
        subObsList = []
        typeName = 'children'
        sub_ProtocoleType = None
        if self.Observation_children != []:
            ### Append flatdata to list of data for existing subProto
            typeName = self.Observation_children[0].GetType().Name
            for subObs in self.Observation_children:
                subObs.LoadNowValues()
                sub_ProtocoleType = subObs.GetType().ID
                flatObs = subObs.GetFlatObject()
                if len(subObs.SubObservation_children) > 0 :
                    flatObs.update(subObs.SubObservation_childrens)
                subObsList.append(flatObs)
        result[typeName] = subObsList
        return result

@event.listens_for(Observation, 'after_delete')
def unlinkLinkedField(mapper, connection, target):
    target.deleteLinkedField()

#--------------------------------------------------------------------------
class ObservationDynPropValue(Base):

    __tablename__ = 'ObservationDynPropValue'

    ID = Column(Integer,Sequence('ObservationDynPropValue__id_seq'), primary_key=True)
    StartDate =  Column(DateTime,nullable=False)
    ValueInt =  Column(Integer)
    ValueString =  Column(String(250))
    ValueDate =  Column(DateTime)
    ValueFloat =  Column(Numeric(12,5))
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
        ObjectTypeWithDynProp.__init__(self)

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


class ObservationDynPropSubValue (Base):

    __tablename__ = 'ObservationDynPropSubValue'

    ID = Column(Integer,Sequence('ObservationDynPropSubValue__id_seq'), primary_key=True)
    FieldName = Column(String(250))
    ValueNumeric =  Column(Numeric(30,10))
    FK_Observation = Column(Integer, ForeignKey('Observation.ID'))
