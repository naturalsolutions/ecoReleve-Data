from ..Models import Base
from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Sequence,
    orm,
    func)
from sqlalchemy.orm import relationship
from ..GenericObjets.ObjectWithDynProp import ObjectWithDynProp
from ..GenericObjets.ObjectTypeWithDynProp import ObjectTypeWithDynProp


class Sensor (Base, ObjectWithDynProp):

    __tablename__ = 'Sensor'
    ID = Column(Integer, Sequence('Sensor__id_seq'), primary_key=True)
    UnicIdentifier = Column(String(250))
    Model = Column(String(250))
    Compagny = Column(String(250))
    SerialNumber = Column(String(250))
    creationDate = Column(DateTime, nullable=False, default=func.now())
    FK_SensorType = Column(Integer, ForeignKey('SensorType.ID'))

    SensorDynPropValues = relationship(
        'SensorDynPropValue', backref='Sensor', cascade="all, delete-orphan")
    Equipments = relationship('Equipment')
    Locations = relationship('Individual_Location')

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        ObjectWithDynProp.__init__(self)

    @orm.reconstructor
    def init_on_load(self):
        ''' init_on_load is called on the fetch of object '''
        self.__init__()

    def GetNewValue(self, nameProp):
        ReturnedValue = SensorDynPropValue()
        ReturnedValue.SensorDynProp = self.ObjContext.query(
            SensorDynProp).filter(SensorDynProp.Name == nameProp).first()
        return ReturnedValue

    def GetDynPropValues(self):
        return self.SensorDynPropValues

    def GetDynProps(self, nameProp):
        return self.ObjContext.query(SensorDynProp).filter(SensorDynProp.Name == nameProp).one()

    def GetType(self):
        if self.SensorType is not None:
            return self.SensorType
        else:
            return self.ObjContext.query(SensorType).get(self.FK_SensorType)


class SensorDynProp (Base):

    __tablename__ = 'SensorDynProp'
    ID = Column(Integer, Sequence('SensorDynProp__id_seq'), primary_key=True)
    Name = Column(String(250), nullable=False)
    TypeProp = Column(String(250), nullable=False)

    SensorType_SensorDynProps = relationship(
        'SensorType_SensorDynProp', backref='SensorDynProp')
    SensorDynPropValues = relationship(
        'SensorDynPropValue', backref='SensorDynProp')


class SensorDynPropValue(Base):

    __tablename__ = 'SensorDynPropValue'

    ID = Column(Integer, Sequence(
        'SensorDynPropValue__id_seq'), primary_key=True)
    StartDate = Column(DateTime, nullable=False)
    ValueInt = Column(Integer)
    ValueString = Column(String(250))
    ValueDate = Column(DateTime)
    ValueFloat = Column(Numeric(12, 5))
    FK_SensorDynProp = Column(Integer, ForeignKey('SensorDynProp.ID'))
    FK_Sensor = Column(Integer, ForeignKey('Sensor.ID'))


class SensorType_SensorDynProp(Base):

    __tablename__ = 'SensorType_SensorDynProp'

    ID = Column(Integer, Sequence(
        'SensorType_SensorDynProp__id_seq'), primary_key=True)
    Required = Column(Integer, nullable=False)
    FK_SensorType = Column(Integer, ForeignKey('SensorType.ID'))
    FK_SensorDynProp = Column(Integer, ForeignKey('SensorDynProp.ID'))


class SensorType (Base, ObjectTypeWithDynProp):

    __tablename__ = 'SensorType'
    ID = Column(Integer, Sequence('SensorType__id_seq'), primary_key=True)
    Name = Column(String(250))
    Status = Column(Integer)

    SensorType_SensorDynProp = relationship(
        'SensorType_SensorDynProp', backref='SensorType')
    Sensors = relationship('Sensor', backref='SensorType')

    @orm.reconstructor
    def init_on_load(self):
        ObjectTypeWithDynProp.__init__(self)
