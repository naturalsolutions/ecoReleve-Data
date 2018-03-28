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
    select,
    Boolean)
from sqlalchemy.orm import relationship
from datetime import datetime, timedelta
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.ext.declarative import declared_attr

from ecoreleve_server.core import Base, HasDynamicProperties, GenericType
from ecoreleve_server.utils.parseValue import isNumeric
from ecoreleve_server.utils.parseValue import formatValue


class Observation(HasDynamicProperties, Base):
    __tablename__ = 'Observation'
    hasLinkedField = True

    moduleFormName = 'ObservationForm'
    moduleGridName = None

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

    @declared_attr
    def table_type_name(cls):
        return 'ProtocoleType'

    @declared_attr
    def fk_table_type_name(cls):
        return 'FK_ProtocoleType'

    @classmethod
    def getTypeClass(cls):
        if not hasattr(cls, 'TypeClass'):
            class Type(GenericType, Base):
                __name__ = 'ProtocoleType'
                __tablename__ = 'ProtocoleType'
                obsolete = Column(Boolean)
                parent = cls
            cls.TypeClass = type('ProtocoleType', (Type, ), {})
        return cls.TypeClass

    @declared_attr
    def _type_id(cls):
        Type = cls.getTypeClass()
        return Column('FK_ProtocoleType',
                      ForeignKey(Type.ID),
                      nullable=False
                      )

    @declared_attr
    def _type(cls):
        Type = cls.getTypeClass()
        return relationship(Type)

    def linkedFieldDate(self):
        try:
            Station = Base.metadata.tables['Station']
            if not self.Station:
                linkedDate = self.session.execute(select([Station.c['StationDate']]).where(
                    Station.c['ID'] == self.FK_Station)).scalar()
            else:
                linkedDate = self.Station.StationDate
        except:
            from traceback import print_exc
            print_exc()
            linkedDate = datetime.utcnow()
        if 'unequipment' in self._type.Name.lower():
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
                if self._type.Status == 8:

                    subDictList = []
                    for k, v in curData.items():
                        subDict = {}
                        col = k
                        if (isNumeric(v) and 'C' in k
                                and isNumeric(col.split('C')[1])):
                            subDict['FieldName'] = k
                            subDict['valeur'] = v
                            subDictList.append(subDict)
                    curData['SubObservation_childrens'] = subDictList

                if 'ID' in curData and curData['ID']:
                    subObs = list(filter(lambda x: x.ID == curData[
                                  'ID'], self.Observation_children))[0]
                else:
                    subObs = Observation(
                        Parent_Observation=self.ID,
                        FK_Station=self.FK_Station,
                    )
                    subObs.session = self.session
                    subObs.type_id = curData['FK_ProtocoleType']
                if subObs is not None:
                    subObs.values = curData
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

    def getValues(self):
        values = HasDynamicProperties.getValues(self)
        if self.Observation_children:
            typeName = self.Observation_children[0]._type.Name
            subObsList = []

            for subObs in self.Observation_children:
                flatObs = subObs.values
                if len(subObs.SubObservation_children) > 0:
                    flatObs.update(subObs.SubObservation_childrens)
                subObsList.append(flatObs)
            self.__values__[typeName] = subObsList
        return values

    def getDataWithSchema(self, displayMode='edit'):
        resultat = HasDynamicProperties.getDataWithSchema(
            self, displayMode=displayMode)

        if self.Observation_children:
            typeName = self.Observation_children[0]._type.Name
            schema = resultat['schema'][typeName]['subschema']
            resultat['data'][typeName] = [formatValue(
                subObs, schema) for subObs in resultat['data'][typeName]]

        return resultat

    def beforeDelete(self):
        self.deleteLinkedField()

# @event.listens_for(Observation, 'after_delete')
# def unlinkLinkedField(mapper, connection, target):
#     target.deleteLinkedField()


class ObservationDynPropSubValue (Base):

    __tablename__ = 'ObservationDynPropSubValue'

    ID = Column(Integer, Sequence(
        'ObservationDynPropSubValue__id_seq'), primary_key=True)
    FieldName = Column(String(250))
    ValueNumeric = Column(Numeric(30, 10))
    FK_Observation = Column(Integer, ForeignKey('Observation.ID'))