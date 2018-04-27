from ..Models import Base, ModuleForms
from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Boolean,
    Integer,
    Numeric,
    String,
    Sequence,
    orm,
    and_,
    func,
    desc,
    select,
    event,
    text,
    bindparam)
from sqlalchemy.dialects.mssql.base import BIT
from sqlalchemy.orm import relationship
from datetime import datetime
from ..utils.parseValue import isEqual, formatValue, parser
from ..utils.datetime import parse
from ..GenericObjets.OrmModelsMixin import HasDynamicProperties, GenericType


class MonitoredSitePosition(Base):

    __tablename__ = 'MonitoredSitePosition'
    ID = Column(Integer, Sequence(
        'MonitoredSitePositions__id_seq'), primary_key=True)
    LAT = Column(Numeric(9, 5))
    LON = Column(Numeric(9, 5))
    ELE = Column(Integer)
    Precision = Column(Integer)
    StartDate = Column(DateTime)
    Comments = Column(String(250))
    FK_MonitoredSite = Column(Integer, ForeignKey('MonitoredSite.ID'))


class MonitoredSite (HasDynamicProperties, Base):

    __tablename__ = 'MonitoredSite'
    moduleFormName = 'MonitoredSiteForm'
    moduleGridName = 'MonitoredSiteGrid'

    ID = Column(Integer, Sequence('MonitoredSite__id_seq'), primary_key=True)
    Name = Column(String(250), nullable=False)
    Category = Column(String(250), nullable=False)
    Creator = Column(Integer, nullable=False)
    Active = Column(Boolean, nullable=False, default=1)
    creationDate = Column(DateTime, nullable=False, default=func.now())
    Place = Column(String(250))

    MonitoredSitePositions = relationship(
        'MonitoredSitePosition',
        backref='MonitoredSite',
        cascade="all,delete-orphan")
    Stations = relationship('Station')
    Equipments = relationship('Equipment')

    def GetLastPositionWithDate(self, date_):
        query = select([MonitoredSitePosition]
                       ).where(
            and_(MonitoredSitePosition.FK_MonitoredSite == self.ID,
                 MonitoredSitePosition.StartDate <= date_)
        ).order_by(desc(MonitoredSitePosition.StartDate)
                   ).limit(1)
        curPos = dict(self.session.execute(query).fetchone())
        return curPos

    def getValues(self):
        values = HasDynamicProperties.getValues(self)
        lastPos = self.GetLastPositionWithDate(func.now())
        if lastPos is not None:
            for key in lastPos:
                if key != 'ID':
                    values[key] = lastPos[key]
        self.__values__.update(values)
        return values

    def setValue(self, propertyName, value, useDate=None):
        super().setValue(propertyName, value)
        if hasattr(self.newPosition, propertyName):
            curTypeAttr = str(self.newPosition.__table__.c[
                              propertyName].type).split('(')[0]

            if 'date'.lower() in curTypeAttr.lower():
                value = parse(value.replace(' ', ''))
                setattr(self.newPosition, propertyName, value)
            else:
                setattr(self.newPosition, propertyName, value)
            if ((propertyName not in self.values)
                    or (isEqual(self.values[propertyName], value) is False)):
                self.positionChanged = True

    @HasDynamicProperties.values.setter
    def values(self, dict_):
        '''parameters:
            - data (dict)
        set object properties (static and dynamic), 
        it's possible to set all dynamic properties with date string with __useDate__ key'''
        self.newPosition = MonitoredSitePosition()
        self.positionChanged = False
        self.previousState = self.values
        if dict_.get('ID', None):
            del dict_['ID']
        if self.fk_table_type_name not in dict_ and 'type_id' not in dict_ and not self.type_id:
            raise Exception('object type not exists')
        else:
            type_id = dict_.get(self.fk_table_type_name, None) or dict_.get(
                'type_id', None) or self.type_id
            self._type = self.session.query(self.TypeClass).get(type_id)
            useDate = parser(dict_.get('__useDate__', None)
                             ) or self.linkedFieldDate()
            for prop, value in dict_.items():
                self.setValue(prop, value, useDate)

            self.setPosition(dict_)
            self.updateLinkedField(dict_, useDate=useDate)

    def setPosition(self, DTOObject):
        if self.positionChanged:
            sameDatePosition = list(filter(lambda x: x.StartDate == datetime.strptime(
                DTOObject['StartDate'], '%d/%m/%Y %H:%M:%S'), self.MonitoredSitePositions))
            if len(sameDatePosition) > 0:
                sameDatePosition[0].LAT = DTOObject['LAT']
                sameDatePosition[0].LON = DTOObject['LON']
                sameDatePosition[0].ELE = DTOObject['ELE']
                sameDatePosition[0].Precision = DTOObject['Precision']
                sameDatePosition[0].Comments = DTOObject['Comments']
            else:
                self.MonitoredSitePositions.append(self.newPosition)
