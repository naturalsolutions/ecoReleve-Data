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
    select)

from sqlalchemy.orm import relationship
from ..GenericObjets.ObjectWithDynProp import ObjectWithDynProp
from ..GenericObjets.ObjectTypeWithDynProp import ObjectTypeWithDynProp
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

    # FK_MonitoredSiteType = Column(Integer, ForeignKey('MonitoredSiteType.ID'))

    MonitoredSitePositions = relationship(
        'MonitoredSitePosition',
        backref='MonitoredSite',
        cascade="all,delete-orphan")
    # MonitoredSiteDynPropValues = relationship(
    #     'MonitoredSiteDynPropValue',
    #     backref='MonitoredSite',
    #     cascade="all,delete-orphan")
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

        return values

    # def GetSchemaFromStaticProps(self, FrontModules, DisplayMode):
    #     Editable = (DisplayMode.lower() == 'edit')
    #     resultat = {}
    #     type_ = self.GetType().ID
    #     Fields = self.session.query(ModuleForms).filter(
    #         ModuleForms.Module_ID == FrontModules.ID
    #     ).order_by(ModuleForms.FormOrder).all()
    #     SiteProps = dict(self.__table__.columns)
    #     PoseProps = dict(MonitoredSitePosition.__table__.columns)
    #     del PoseProps['ID']
    #     SiteProps.update(PoseProps)

    #     for curStatProp in SiteProps:
    #         CurModuleForms = list(filter(lambda x: x.Name == curStatProp and (
    #             x.TypeObj == str(type_) or x.TypeObj == None), Fields))

    #         if (len(CurModuleForms) > 0):
    #             CurModuleForms = CurModuleForms[0]
    #             resultat[CurModuleForms.Name] = CurModuleForms.GetDTOFromConf(
    #                 DisplayMode.lower())
    #     return resultat

    # def getFlatObject(self, schema=None):
    #     ''' return flat object with static properties and
    #     last existing value of dyn props '''
    #     resultat = {}
    #     if self.ID is not None:
    #         max_iter = max(len(self.__table__.columns),
    #                        len(self.__properties__))
    #         for i in range(max_iter):
    #             try:
    #                 curStatProp = list(self.__table__.columns)[i]
    #                 resultat[curStatProp.key] = self.getProperty(
    #                     curStatProp.key)
    #             except:
    #                 pass
    #             try:
    #                 curDynPropName = list(self.__properties__)[i]
    #                 resultat[curDynPropName] = self.getProperty(curDynPropName)
    #             except Exception as e:
    #                 # print_exc()
    #                 pass
    #     else:
    #         max_iter = len(self.__table__.columns)
    #         for i in range(max_iter):
    #             try:
    #                 curStatProp = list(self.__table__.columns)[i]
    #                 curVal = self.getProperty(curStatProp.key)
    #                 if curVal is not None:
    #                     resultat[curStatProp.key] = self.getProperty(
    #                         curStatProp.key)
    #             except:
    #                 pass
    #     if not schema and hasattr(self, 'getForm'):
    #         schema = self.getForm()['schema']
    #     if schema:
    #         resultat = formatValue(resultat, schema)
    #     return resultat

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
            type_id = dict_.get(self.fk_table_type_name, None) or dict_.get('type_id', None) or self.type_id
            self._type = self.session.query(self.TypeClass).get(type_id)
            useDate = parser(dict_.get('__useDate__', None)) or self.linkedFieldDate()
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

    # def updateFromJSON(self, DTOObject):
    #     self.newPosition = MonitoredSitePosition()
    #     self.positionChanged = False
    #     super(MonitoredSite, self).updateFromJSON(DTOObject)
    #     if self.positionChanged:
    #         sameDatePosition = list(filter(lambda x: x.StartDate == datetime.strptime(
    #             DTOObject['StartDate'], '%d/%m/%Y %H:%M:%S'), self.MonitoredSitePositions))
    #         if len(sameDatePosition) > 0:
    #             sameDatePosition[0].LAT = DTOObject['LAT']
    #             sameDatePosition[0].LON = DTOObject['LON']
    #             sameDatePosition[0].ELE = DTOObject['ELE']
    #             sameDatePosition[0].Precision = DTOObject['Precision']
    #             sameDatePosition[0].Comments = DTOObject['Comments']
    #         else:
    #             self.MonitoredSitePositions.append(self.newPosition)


# class MonitoredSiteDynProp (Base):

#     __tablename__ = 'MonitoredSiteDynProp'
#     ID = Column(Integer, Sequence(
#         'MonitoredSiteDynProp__id_seq'), primary_key=True)
#     Name = Column(String(250), nullable=False)
#     TypeProp = Column(String(100), nullable=False)

#     MonitoredSiteType_MonitoredSiteDynProps = relationship(
#         'MonitoredSiteType_MonitoredSiteDynProp', backref='MonitoredSiteDynProp')
#     MonitoredSiteDynPropValues = relationship(
#         'MonitoredSiteDynPropValue', backref='MonitoredSiteDynProp')


# class MonitoredSiteDynPropValue(Base):

#     __tablename__ = 'MonitoredSiteDynPropValue'

#     ID = Column(Integer, Sequence(
#         'MonitoredSiteDynPropValue__id_seq'), primary_key=True)
#     StartDate = Column(DateTime, nullable=False)
#     ValueInt = Column(Integer)
#     ValueString = Column(String(250))
#     ValueDate = Column(DateTime)
#     ValueFloat = Column(Numeric(12, 5))
#     FK_MonitoredSiteDynProp = Column(
#         Integer, ForeignKey('MonitoredSiteDynProp.ID'))
#     FK_MonitoredSite = Column(Integer, ForeignKey('MonitoredSite.ID'))


# class MonitoredSiteType_MonitoredSiteDynProp(Base):

#     __tablename__ = 'MonitoredSiteType_MonitoredSiteDynProp'

#     ID = Column(Integer, Sequence(
#         'MonitoredSiteType_MonitoredSiteDynProp__id_seq'), primary_key=True)
#     Required = Column(Integer, nullable=False)
#     FK_MonitoredSiteType = Column(Integer, ForeignKey('MonitoredSiteType.ID'))
#     FK_MonitoredSiteDynProp = Column(
#         Integer, ForeignKey('MonitoredSiteDynProp.ID'))


# class MonitoredSiteType (Base, ObjectTypeWithDynProp):

#     __tablename__ = 'MonitoredSiteType'
#     ID = Column(Integer, Sequence(
#         'MonitoredSiteType__id_seq'), primary_key=True)
#     Name = Column(String(250))
#     Status = Column(Integer)

#     MonitoredSiteType_MonitoredSiteDynProp = relationship(
#         'MonitoredSiteType_MonitoredSiteDynProp', backref='MonitoredSiteType')
#     MonitoredSites = relationship('MonitoredSite', backref='MonitoredSiteType')

#     @orm.reconstructor
#     def init_on_load(self):
#         ObjectTypeWithDynProp.__init__(self)
