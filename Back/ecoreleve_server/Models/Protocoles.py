from ..Models import Base
from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Unicode,
    Sequence,
    orm,
    func,
    event,
    select)
from sqlalchemy.dialects.mssql.base import BIT
from sqlalchemy.orm import relationship
from ..GenericObjets.ObjectWithDynProp import ObjectWithDynProp
from ..GenericObjets.ObjectTypeWithDynProp import ObjectTypeWithDynProp
from datetime import datetime, timedelta
from sqlalchemy.ext.hybrid import hybrid_property
from ..utils.parseValue import isNumeric


class Observation(Base, ObjectWithDynProp):
    __tablename__ = 'Observation'

    moduleFormName = 'ObservationForm'
    moduleGridName = None

    ID = Column(Integer, Sequence('Observation__id_seq'), primary_key=True)
    FK_ProtocoleType = Column(Integer, ForeignKey('ProtocoleType.ID'))
    ObservationDynPropValues = relationship(
        'ObservationDynPropValue',
        backref='Observation',
        cascade="all, delete-orphan")
    FK_Station = Column(Integer, ForeignKey('Station.ID'))
    creationDate = Column(DateTime, default=func.now())
    Parent_Observation = Column(Integer, ForeignKey('Observation.ID'))
    Comments = Column(String(250))
    FK_Individual = Column(Integer, ForeignKey('Individual.ID'))
    original_id = Column(String(250))

    Observation_children = relationship(
        "Observation", cascade="all, delete-orphan", order_by='Observation.ID')
    SubObservation_children = relationship(
        "ObservationDynPropSubValue", cascade="all, delete-orphan")
    Equipment = relationship(
        "Equipment",
        backref='Observation',
        cascade="all, delete-orphan",
        uselist=False)
    Station = relationship("Station")
    Individual = relationship('Individual')

    def __init__(self, **kwargs):
        Base.__init__(self, **kwargs)
        ObjectWithDynProp.__init__(self)

    def getTypeObjectFKName(self):
        return 'FK_ProtocoleType'

    def GetNewValue(self, nameProp):
        ReturnedValue = ObservationDynPropValue()
        ReturnedValue.ObservationDynProp = self.session.query(
            ObservationDynProp).filter(ObservationDynProp.Name == nameProp).first()
        return ReturnedValue

    def GetDynPropValues(self):
        return self.ObservationDynPropValues

    def GetDynProps(self, nameProp):
        return self.session.query(ObservationDynProp
                                  ).filter(ObservationDynProp.Name == nameProp).one()

    def GetType(self):
        if self.ProtocoleType is not None:
            return self.ProtocoleType
        else:
            return self.session.query(ProtocoleType).get(self.FK_ProtocoleType)

    def linkedFieldDate(self):
        try:
            Station = Base.metadata.tables['Station']
            if not self.Station:
                linkedDate = self.session.execute(select([Station.c['StationDate']]).where(
                    Station.c['ID'] == self.FK_Station)).scalar()
            else:
                linkedDate = self.Station.StationDate
        except:
            linkedDate = datetime.utcnow()

        if 'unequipment' in self.GetType().Name.lower():
            linkedDate = linkedDate - timedelta(seconds=1)
        return linkedDate

    @hybrid_property
    def Observation_childrens(self):
        if self.Observation_children is not None or self.Observation_children != []:
            return True
        else:
            return False

    @Observation_childrens.setter
    def Observation_childrens(self, listOfSubProtocols):
        listObs = []
        if isinstance(listOfSubProtocols, list) and len(listOfSubProtocols) > 0:

            for curData in listOfSubProtocols:
                if self.GetType().Status == 8:

                    subDictList = []
                    for k, v in curData.items():
                        subDict = {}
                        col = k
                        if (isNumeric(v) and 'C' in k
                                and isNumeric(col.split('C')[1])):
                            subDict['FieldName'] = k
                            subDict['valeur'] = v
                            subDictList.append(subDict)
                    curData['listOfSubObs'] = subDictList

                if 'ID' in curData and curData['ID']:
                    subObs = list(filter(lambda x: x.ID == curData[
                                  'ID'], self.Observation_children))[0]
                    subObs.LoadNowValues()
                else:
                    subObs = Observation(
                        FK_ProtocoleType=curData['FK_ProtocoleType'],
                        Parent_Observation=self.ID,
                        FK_Station=self.FK_Station)
                    subObs.init_on_load()

                if subObs is not None:
                    subObs.updateFromJSON(curData)
                    listObs.append(subObs)
                    self.session.add(subObs)
                    self.session.flush()
        self.Observation_children = listObs

    @hybrid_property
    def SubObservation_childrens(self):
        dictToUpdate = {}
        if self.SubObservation_children is not None or self.SubObservation_children != []:
            for row in self.SubObservation_children:
                dictToUpdate[row.FieldName] = row.ValueNumeric
        return dictToUpdate

    @SubObservation_childrens.setter
    def SubObservation_childrens(self, listOfSubObs):
        listSubValues = []
        if isinstance(listOfSubObs, list) and len(listOfSubObs) > 0:
            for curData in listOfSubObs:
                if 'FK_Observation' in curData:
                    subObsValue = list(filter(lambda x: x.FK_Observation == curData[
                                       'FK_Observation'] and x.FieldName == curData['FieldName'],
                        self.SubObservation_children))[0]
                else:
                    subObsValue = ObservationDynPropSubValue(
                        FK_Observation=self.ID)

                if subObsValue is not None:
                    subObsValue.ValueNumeric = curData['valeur']
                    subObsValue.FieldName = curData['FieldName']
                    listSubValues.append(subObsValue)
        self.SubObservation_children = listSubValues

    def updateFromJSON(self, DTOObject, startDate=None):
        # delattr(self,'getForm')
        previousState = self.getFlatObject()
        ObjectWithDynProp.updateFromJSON(self, DTOObject, None)
        if 'listOfSubObs' in DTOObject:
            self.SubObservation_childrens = DTOObject['listOfSubObs']
        self.updateLinkedField(DTOObject, previousState=previousState)

    def getFlatObject(self, schema=None):
        result = super().getFlatObject(schema=schema)
        subObsList = []
        typeName = 'children'
        if self.Observation_children != []:
            typeName = self.Observation_children[0].GetType().Name

            for subObs in self.Observation_children:
                subObs.LoadNowValues()
                if schema:
                    subschema = schema[subObs.GetType().Name]['subschema']
                else:
                    subschema = None
                flatObs = subObs.getFlatObject(schema=subschema)
                if len(subObs.SubObservation_children) > 0:
                    flatObs.update(subObs.SubObservation_childrens)
                subObsList.append(flatObs)
        result[typeName] = subObsList
        return result

    def beforeDelete(self):
        self.LoadNowValues()


@event.listens_for(Observation, 'after_delete')
def unlinkLinkedField(mapper, connection, target):
    target.deleteLinkedField()


class ObservationDynPropValue(Base):

    __tablename__ = 'ObservationDynPropValue'

    ID = Column(Integer, Sequence(
        'ObservationDynPropValue__id_seq'), primary_key=True)
    StartDate = Column(DateTime, nullable=False)
    ValueInt = Column(Integer)
    ValueString = Column(String(250))
    ValueDate = Column(DateTime)
    ValueFloat = Column(Numeric(12, 5))
    FK_ObservationDynProp = Column(
        Integer, ForeignKey('ObservationDynProp.ID'))
    FK_Observation = Column(Integer, ForeignKey('Observation.ID'))


class ObservationDynProp(Base):

    __tablename__ = 'ObservationDynProp'

    ID = Column(Integer, Sequence(
        'ObservationDynProp__id_seq'), primary_key=True)
    Name = Column(Unicode(250), nullable=False)
    TypeProp = Column(Unicode(250), nullable=False)
    ProtocoleType_ObservationDynProps = relationship(
        'ProtocoleType_ObservationDynProp', backref='ObservationDynProp')
    ObservationDynPropValues = relationship(
        'ObservationDynPropValue', backref='ObservationDynProp')


class ProtocoleType(Base, ObjectTypeWithDynProp):

    @orm.reconstructor
    def init_on_load(self):
        ObjectTypeWithDynProp.__init__(self)

    __tablename__ = 'ProtocoleType'

    ID = Column(Integer, Sequence('ProtocoleType__id_seq'), primary_key=True)
    Name = Column(Unicode(250))
    Status = Column(Integer)
    obsolete = Column(BIT)
    ProtocoleType_ObservationDynProps = relationship(
        'ProtocoleType_ObservationDynProp', backref='ProtocoleType')
    Observations = relationship('Observation', backref='ProtocoleType')


class ProtocoleType_ObservationDynProp(Base):

    __tablename__ = 'ProtocoleType_ObservationDynProp'

    ID = Column(Integer, Sequence(
        'ProtocoleType_ObservationDynProp__id_seq'), primary_key=True)
    Required = Column(Integer, nullable=False)
    FK_ProtocoleType = Column(Integer, ForeignKey('ProtocoleType.ID'))
    FK_ObservationDynProp = Column(
        Integer, ForeignKey('ObservationDynProp.ID'))


class ObservationDynPropSubValue (Base):

    __tablename__ = 'ObservationDynPropSubValue'

    ID = Column(Integer, Sequence(
        'ObservationDynPropSubValue__id_seq'), primary_key=True)
    FieldName = Column(String(250))
    ValueNumeric = Column(Numeric(30, 10))
    FK_Observation = Column(Integer, ForeignKey('Observation.ID'))
