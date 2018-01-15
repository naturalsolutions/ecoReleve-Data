from sqlalchemy import (Column,
                        ForeignKey,
                        String,
                        Integer,
                        Float,
                        Boolean,
                        DateTime,
                        select,
                        join,
                        func,
                        not_,
                        exists,
                        event,
                        Table,
                        Index,
                        UniqueConstraint,
                        Table,
                        text,
                        bindparam,
                        insert,
                        desc)
from sqlalchemy.orm import relationship, aliased, class_mapper, mapper
from sqlalchemy.ext.associationproxy import association_proxy
from sqlalchemy.ext.declarative import declared_attr
from ..Models import Base, dbConfig, BusinessRules
from sqlalchemy import inspect, orm
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.ext.compiler import compiles
from sqlalchemy.sql.expression import Executable, ClauseElement
from ..utils.parseValue import parser, formatValue, isEqual
from datetime import datetime
from .DataBaseObjects import ConfiguredDbObjectMapped
from sqlalchemy.orm.exc import *
from sqlalchemy_utils import get_hybrid_properties
from pyramid import threadlocal


ANALOG_DYNPROP_TYPES = {'String': 'ValueString',
                        'Float': 'ValueFloat',
                        'Date': 'ValueDate',
                        'Integer': 'ValueInt',
                        'Time': 'ValueDate',
                        'Date Only': 'ValueDate'}


class CreateView(Executable, ClauseElement):
    def __init__(self, name, select):
        self.name = name
        self.select = select


@compiles(CreateView)
def visit_create_view(element, compiler, **kw):
    return "CREATE VIEW %s AS %s" % (
        element.name,
        compiler.process(element.select, literal_binds=True)
    )


class ORMUtils(object):
    def as_dict(self):
        hybrid_properties = list(get_hybrid_properties(self.__class__).keys())
        values = {c.key: getattr(self, c.key)
                  for c in inspect(self).mapper.column_attrs}

        for propName in hybrid_properties:
            values[propName] = getattr(self, propName)
        return values


class GenericType(ORMUtils):
    __tablename__ = None
    ID = Column(Integer, primary_key=True)
    Name = Column(String(250), nullable=False)
    Status = Column(Integer)
    parent = None

    @classmethod
    def getPropertiesClass(cls):
        if not hasattr(cls, 'PropertiesClass'):
            class Properties(ORMUtils):
                __tablename__ = cls.parent.__tablename__ + 'DynProp'
                ID = Column(Integer, primary_key=True)
                Name = Column(String(250), nullable=False)
                TypeProp = Column(String(250), nullable=False)

                @declared_attr
                def __table_args__(cls):
                    return (UniqueConstraint(
                        'Name',
                        name='uqc_' + cls.__tablename__ + '_name',
                    ), {}
                    )

            cls.PropertiesClass = type(
                cls.parent.__tablename__ + 'DynProp'.title(), (Properties, Base), {})
        return cls.PropertiesClass

    @declared_attr
    def _properties(cls):
        Properties = cls.getPropertiesClass()
        linkedTable = cls.__tablename__ + '_' + cls.parent.__tablename__ + 'DynProp'
        dynpropTable = Properties.__tablename__

        return relationship(Properties,
                            secondary='join(' + dynpropTable +
                            ',' + linkedTable + ','
                                      + '' + linkedTable + '.c.FK_' + dynpropTable + '==' + dynpropTable + '.c.ID)',
                            primaryjoin=cls.__tablename__ + '.ID==' +
                            linkedTable + '.c.FK_' + cls.__tablename__
                            )

    @declared_attr
    def properties(cls):
        return association_proxy('_properties', 'Name')

    @declared_attr
    def _type_properties(cls):
        if not hasattr(cls, 'TypePropertiesClass'):
            this = cls

            class TypeProperties():
                __tablename__ = cls.__tablename__ + '_' + cls.parent.__tablename__ + 'DynProp'
                ID = Column(Integer, primary_key=True)

                @declared_attr
                def type_id(cls):
                    return Column('FK_' + this.__tablename__,
                                  ForeignKey(this.__tablename__ + '.ID'),
                                  nullable=False
                                   )
                @declared_attr
                def property_id(cls):
                    return Column('FK_' + this.parent.__tablename__ + 'DynProp',
                                     ForeignKey(
                                         this.parent.__tablename__ + 'DynProp.ID'),
                                     nullable=False
                                     )

                linkedTable = Column('LinkedTable', String(255))
                linkedField = Column('LinkedField', String(255))
                linkedID = Column('LinkedID', String(255))
                linkedSourceID = Column('LinkSourceID', String(255))

                @declared_attr
                def _property_name(cls):
                    return relationship(this.getPropertiesClass())
                property_name = association_proxy('_property_name', 'Name')

            cls.TypePropertiesClass = type(
                cls.__tablename__ + '_' + cls.parent.__tablename__ + 'DynProp'.title(), (TypeProperties, Base), {})
        return relationship(cls.TypePropertiesClass)


class EventRuler(object):

    @classmethod
    def getBuisnessRules(cls):
        return dbConfig['dbSession']().query(BusinessRules
                                             ).filter_by(target=cls.__tablename__
                                                         ).all()

    @declared_attr
    def loadBusinessRules(cls):
        @event.listens_for(Base.metadata, 'after_create')
        def afterConfigured(target, connection, **kwargs):
            cls.__constraintRules__ = {'before_update': [],
                                       'after_update': [],
                                       'before_insert': [],
                                       'after_insert': [],
                                       'before_delete': [],
                                       'after_delete': []
                                       }

            rules = cls.getBuisnessRules()
            if rules:
                m = [cls.__constraintRules__[rule.actionType].append(rule)
                     in cls.__constraintRules__
                     for rule in rules
                     if rule.actionType in cls.__constraintRules__]

    @declared_attr
    def onEvent(cls):
        events = ['before_insert', 'before_update']

        @event.listens_for(cls, 'before_update')
        def before_update(mapper, connection, target):
            cls.executeBusinessRules(target, 'before_update')

        @event.listens_for(cls, 'after_update')
        def after_update(mapper, connection, target):
            cls.executeBusinessRules(target, 'after_update')

        @event.listens_for(cls, 'before_insert')
        def before_insert(mapper, connection, target):
            cls.executeBusinessRules(target, 'before_insert')

        @event.listens_for(cls, 'after_insert')
        def after_insert(mapper, connection, target):
            cls.executeBusinessRules(target, 'after_insert')

        @event.listens_for(cls, 'before_delete')
        def before_delete(mapper, connection, target):
            cls.executeBusinessRules(target, 'before_delete')

        @event.listens_for(cls, 'after_delete')
        def after_delete(mapper, connection, target):
            cls.executeBusinessRules(target, 'after_delete')

    @classmethod
    def executeBusinessRules(cls, target, event):
        if cls.__constraintRules__[event]:
            entityDTO = target.values
            for rule in cls.__constraintRules__[event]:
                if (not rule.targetTypes
                        or (hasattr(target, 'type_id') and target.type_id in rule.targetTypes)):
                    result = rule.execute(entityDTO)


class HasStaticProperties(ConfiguredDbObjectMapped, EventRuler, ORMUtils):

    def __init__(self, *args, **kwargs):
        ConfiguredDbObjectMapped.__init__(self)
        ORMUtils.__init__(self)
        EventRuler.__init__(self)

        self.session = kwargs.get('session', None) or threadlocal.get_current_request(
        ).dbsession if threadlocal.get_current_request() else None

        for param, value in kwargs.items():
            if hasattr(self, param):
                setattr(self, param, value)
        if kwargs.get('session', None):
            del kwargs['session']
        Base.__init__(self, **kwargs)

    @orm.reconstructor
    def init_on_load(self):
        self.session = inspect(self).session

    def getValues(self):
        ''' return flat data dict '''
        self.as_dict()

    @property
    def values(self):
        return self.getValues()

    @values.setter
    def values(self, dict_):
        for prop, value in dict_.items():
            self.setValue(prop, value)

    def setValue(self, propertyName, value):
        if hasattr(self, propertyName):
            setattr(self, propertyName, parser(value))
        elif propertyName in self.__table__.c:
            propertyName = class_mapper(inspect(self).class_
                                        ).get_property_by_column(
                                            self.__table__.c[propertyName]
            ).key
            setattr(self, propertyName, parser(value))

    def beforeDelete(self):
        pass

    def afterDelete(self):
        pass

    def beforeUpdate(self):
        pass

    def afterUpdate(self):
        pass

    def getForm(self, displayMode='edit', type_=None, moduleName=None):
        from ..utils.parseValue import formatValue
        isGrid = False
        if (self._type.Status == 10):
            isGrid = True

        form = ConfiguredDbObjectMapped.getForm(
            self, displayMode, self._type_id, moduleName, isGrid=isGrid)

        form['data'] = {'id': 0}
        data = formatValue(form['schema']['defaultValues'], form['schema'])
        form['data'].update(data)
        form['data'][self.fk_table_type_name] = self._type_id
        return form

    def getDataWithSchema(self, displayMode='edit'):
        resultat = self.getForm(displayMode=displayMode)

        '''IF ID is send from front --> get data of this object in order to
        display value into form which will be sent'''
        data = self.values
        data = formatValue(data, resultat['schema'])
        resultat['data'] = data
        resultat['recursive_level'] = 0
        resultat = self.getDefaultValue(resultat)
        if self.ID:
            resultat['data']['id'] = self.ID

        else:
            # add default values for each field in data if exists
            # for attr in schema:
            resultat['data']['id'] = 0
            resultat['data'].update(resultat['schema']['defaultValues'])

        return resultat


class HasDynamicProperties(HasStaticProperties):
    ''' core object creating all stuff to manage dynamic
        properties on a new declaration:
            create automatically tables and relationships:
                - Type
                - Properties
                - PropertyValues
                - Type_Properties

            create automatically indexes, uniques constraints and view
        history_track parameter (default:True) is used to track new property's value
        and get historization of dynamic properties
    '''
    history_track = True
    hasLinkedField = False
    ID = Column(Integer, primary_key=True)

    @declared_attr
    def table_type_name(cls):
        return cls.__tablename__ + 'Type'

    @declared_attr
    def fk_table_name(cls):
        return 'FK_' + cls.__tablename__

    @declared_attr
    def fk_table_type_name(cls):
        return 'FK_' + cls.__tablename__ + 'Type'

    @declared_attr
    def table_DynProp_name(cls):
        return cls.__tablename__ + 'DynProp'

    @declared_attr
    def fk_table_DynProp_name(cls):
        return 'FK_' + cls.__tablename__ + 'DynProp'

    @declared_attr
    def linked_table_name(cls):
        return cls.__tablename__ + 'Type_' + cls.__tablename__ + 'DynProp'

    @declared_attr
    def _type(cls):
        Type = cls.getTypeClass()
        return relationship(Type)

    @declared_attr
    def _type_id(cls):
        return Column('FK_' + cls.__tablename__ + 'Type',
                      ForeignKey(cls.__tablename__ + 'Type' + '.ID'),
                      nullable=False
                      )

    @hybrid_property
    def type_id(self):
        return self._type_id

    @type_id.setter
    def type_id(self, value):
        self._type_id = value
        self._type = self.session.query(self.TypeClass).get(value)

    @classmethod
    def getTypeClass(cls):
        if not hasattr(cls, 'TypeClass'):
            class Type(GenericType):
                __name__ = cls.__tablename__ + 'Type'
                __tablename__ = cls.__tablename__ + 'Type'
                parent = cls
            cls.TypeClass = type(cls.__tablename__ +
                                 'Type'.title(), (Type, Base), {})
        return cls.TypeClass

    @property
    def PropertiesClass(self):
        return self.TypeClass.PropertiesClass

    @classmethod
    def getDynamicValuesClass(cls):
        if not hasattr(cls, 'DynamicValuesClass'):
            this = cls

            class DynamicValues(ORMUtils):
                __tablename__ = cls.__tablename__ + 'DynPropValue'
                ID = Column(Integer, primary_key=True)
                StartDate = Column(DateTime, nullable=False)
                ValueString = Column(String(250))
                ValueDate = Column(DateTime)
                ValueFloat = Column(Float)
                ValueInt = Column(Integer)

                @declared_attr
                def fk_parent(cls):
                    return Column('FK_' + this.__tablename__,
                                   ForeignKey(this.__tablename__ + '.ID'),
                                   nullable=False
                                   )
            
                @declared_attr
                def fk_property(cls):
                    return Column('FK_' + this.__tablename__ + 'DynProp',
                                     Integer,
                                     ForeignKey(
                                         this.__tablename__ + 'DynProp.ID'),
                                     nullable=False
                                     )

                @declared_attr
                def _property(cls):
                    return relationship(this.getTypeClass().PropertiesClass)

                property_name = association_proxy('_property', 'Name')

                @declared_attr
                def __table_args__(cls):
                    return (
                        Index('idx_%s' % this.__tablename__ + '_ValueString',
                              'FK_' + this.__tablename__,
                              'ValueString'),
                        UniqueConstraint(
                            'FK_' + this.__tablename__,
                            'FK_' + this.__tablename__ + 'DynProp',
                            'StartDate',
                            name='uqc_' + cls.__tablename__
                        ),
                    )

                @property
                def realValue(self):
                    val = self.ValueString or self.ValueDate or self.ValueFloat or self.ValueInt
                    return {'value:': val, 'StartDate': self.StartDate, 'name': self.property_name}

            cls.DynamicValuesClass = type(
                cls.__tablename__ + 'DynPropValues'.title(), (DynamicValues, Base), {})
        return cls.DynamicValuesClass

    @declared_attr
    def _dynamicValues(cls):
        DynamicValues = cls.getDynamicValuesClass()
        return relationship(DynamicValues.__name__,
                            cascade="all, delete-orphan",
                            order_by='desc(' +
                            DynamicValues.__name__ + '.StartDate)'
                            )

    @declared_attr
    def type(cls):
        return association_proxy('_type', 'Name')

    @classmethod
    def lastValueQuery(cls):
        ''' build query to retrieve latest values of dynamic properties '''
        DynamicValues = cls.DynamicValuesClass or cls.getDynamicValuesClass()
        Properties = cls.TypeClass.PropertiesClass
        dv2 = aliased(DynamicValues)

        sub_query = select([dv2]).where(
            dv2.fk_property == DynamicValues.fk_property)
        sub_query = sub_query.where(dv2.fk_parent == DynamicValues.fk_parent)
        sub_query = sub_query.where(dv2.StartDate > DynamicValues.StartDate)
        sub_query = sub_query.where(dv2.StartDate <= func.now())

        join_ = join(DynamicValues, Properties,
                     Properties.ID == DynamicValues.fk_property)
        query = select([DynamicValues,
                        Properties.Name.label('Name'),
                        Properties.TypeProp.label('TypeProp')]
                       ).select_from(join_).where(not_(exists(sub_query)))
        return query

    @declared_attr
    def lastValueView(cls):
        ''' create/intialize view of last dynamic properties values,
            return the mapped view'''
        @event.listens_for(Base.metadata, 'after_create')
        def lastValueView(target, connection, **kwargs):
            viewName = cls.DynamicValuesClass.__tablename__ + 'Now'
            table_catalog, table_schema = dbConfig['data_schema'].split('.')
            countViewQuery = text('''
                    SELECT COUNT(*)
                    FROM INFORMATION_SCHEMA.VIEWS
                    where table_schema = :schema
                    and table_catalog = :catalog
                    and table_name = :viewName
            ''').bindparams(schema=table_schema, catalog=table_catalog, viewName=viewName.lower())

            countView = Base.metadata.bind.execute(countViewQuery).scalar()

            if countView == 0:
                createview = CreateView(viewName,
                                        cls.lastValueQuery())
                Base.metadata.bind.execute(
                    createview.execution_options(autocommit=True))

            cls.LastDynamicValueViewClass = Table(viewName.lower(),
                                                  Base.metadata,
                                                  autoload=True)
            return viewName
        return lastValueView

    def getLatestDynamicValues(self):
        ''' retrieve latest values of dynamic properties '''
        if hasattr(self, 'latestValues'):
            return self.latestValues
        if not hasattr(self, 'latestValues') and self.ID:
            table = self.LastDynamicValueViewClass
            query = table.select().where(
                table.c['FK_' + self.__tablename__] == self.ID)
            values = self.session.execute(query).fetchall()

            self.latestValues = [(lambda x: dict(x))(val) for val in values]

        else:
            self.latestValues = []
        return self.latestValues

    def getHistory(self):
        return [row.realValue for row in self._dynamicValues]

    def getValues(self):
        ''' return flat data dict '''
        dictValues = {}
        values = self.getLatestDynamicValues()
        for value in values:
            property_ = self.get_property_by_name(value['Name'])
            valueName = ANALOG_DYNPROP_TYPES[property_.get('TypeProp')]
            dictValues[property_.get('Name')] = value.get(valueName)
        dictValues.update(self.as_dict())
        return dictValues

    @HasStaticProperties.values.setter
    def values(self, dict_):
        '''parameters:
            - data (dict)
        set object properties (static and dynamic), 
        it's possible to set all dynamic properties with date string 
        with __useDate__ key'''
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

            if self.hasLinkedField:
                self.updateLinkedField(dict_, useDate=useDate)

    def setValue(self, propertyName, value, useDate=None):
        ''' Set object properties (static and dynamic)
             value can have two forms:
             {
               value: value
               date: date
             }
 
             or value
         '''
         # extract value and date from dict value
        if isinstance(value, dict) and "date" in value:
            useDate = parser(value.get("date"))
            value = value.get("value", None)

        HasStaticProperties.setValue(self, propertyName, value)
        if not hasattr(self, propertyName) and propertyName not in self.__table__.c:
            if not useDate:
                useDate = datetime.now()
            self.setDynamicValue(propertyName, parser(value), useDate)

    def updateValues(self, data_dict, useDate=None):
        useDate = datetime.now() if not useDate else useDate
        data_dict['__useDate__'] = useDate
        self.values = data_dict

    def setDynamicValue(self, propertyName, value, useDate):
        prop = self.get_property_by_name(propertyName)
        
        if not prop:
            return

        existingValues = list(filter(lambda x: x['Name'] == propertyName,
                                     self.getLatestDynamicValues()))
        if self.history_track:
            curValue = self.getDynamicValueAtDate(propertyName, useDate)
        elif len(existingValues) > 0:
            curValue = self.session.query(self.DynamicValuesClass
                                          ).get(existingValues[0].get('ID'))

        if not curValue:
            curValue = self.DynamicValuesClass(
                fk_property=prop.get('ID'), fk_parent=self.type_id)
            curValue.StartDate = useDate
            self._dynamicValues.append(curValue)
        setattr(curValue, ANALOG_DYNPROP_TYPES[prop.get('TypeProp')], value)

    def getDynamicValueAtDate(self, propertyName, useDate):
        prop = self.get_property_by_name(propertyName)
        if not prop:
            return None
        valueAtDate = list(filter(lambda x: (x.fk_property == prop.get('ID')
                                             and x.StartDate == useDate
                                             ), self._dynamicValues))
        if len(valueAtDate) > 0:
            curValue = valueAtDate[0]
            return curValue
        else:
            return None

    @property
    def properties(self):
        return [prop.as_dict() for prop in self._type._properties]

    @property
    def properties_by_id(self):
        return {prop.as_dict().get('ID'): prop.as_dict() for prop in self._type._properties}

    @property
    def properties_by_name(self):
        return {prop.as_dict().get('Name'): prop.as_dict() for prop in self._type._properties}

    def get_property_by_id(self, id_):
        return self.properties_by_id.get(id_, None)

    def get_property_by_name(self, name):
        return self.properties_by_name.get(name, None)

    def getLinkedField(self):
        try:
            return list(filter(lambda tp: tp.linkedTable is not None, self._type._type_properties))
        except:
            return []

    def linkedFieldDate(self):
        return datetime.now()

    def getLinkedEntity(self, tablename):
        filterEntity = list(filter(lambda e: hasattr(
            e, '__tablename__') and e.__tablename__ == tablename, Base._decl_class_registry.values()))
        if filterEntity:
            return filterEntity[0]
        else:
            return None

    def updateLinkedField(self, DTO, useDate=None, previousState=None):
        previousState = self.previousState or previousState
        if useDate is None:
            useDate = self.linkedFieldDate()

        linkedFields = self.getLinkedField()
        entitiesToUpdate = {}
        for linkProp in linkedFields:
            curPropName = linkProp.property_name
            linkedEntity = self.getLinkedEntity(linkProp.linkedTable)

            linkedPropName = linkProp.linkedField.replace('@Dyn:', '')
            targetID = DTO.get(linkProp.linkedSourceID, None)
            previousTargetID = previousState.get(linkProp.linkedSourceID)

            # remove linked field if target object is different of previous
            if previousState and previousTargetID and str(targetID) != str(previousTargetID):
                self.deleteLinkedField(previousState=previousState)
            try:
                linkedObj = self.session.query(linkedEntity).filter(
                    getattr(linkedEntity, linkProp.linkedID) == targetID).one()
            except NoResultFound:
                continue

            if linkedObj in entitiesToUpdate:
                entitiesToUpdate[linkedObj][linkedPropName] = DTO.get(
                    curPropName, None)
            else:
                entitiesToUpdate[linkedObj] = {
                    linkedPropName: DTO.get(curPropName, None)}

        for entity in entitiesToUpdate:
            data = entitiesToUpdate[entity]
            data['__useDate__'] = useDate
            entity.values = data

    def deleteLinkedField(self, useDate=None, previousState=None):
        session = self.session

        if useDate is None:
            useDate = self.linkedFieldDate()

        for linkProp in self.getLinkedField():
            obj = self.getLinkedEntity(linkProp.linkedTable)
            try:
                linkedPropName = linkProp.linkedField.replace('@Dyn:', '')
                if previousState:
                    linkedSource = previousState.get(linkProp.linkedSourceID)
                else:
                    linkedSource = self.values.get(linkProp.linkedSourceID)
                try:
                    linkedObj = session.query(obj).filter(
                        getattr(obj, linkProp.linkedID) == linkedSource).one()
                except NoResultFound:
                    continue

                if hasattr(linkedObj, linkedPropName):
                    linkedObj.setValue(linkedPropName, None)
                else:
                    dynPropValueToDel = linkedObj.getDynamicValueAtDate(
                        linkedPropName, useDate)
                    if dynPropValueToDel is not None:
                        session.delete(dynPropValueToDel)

            except Exception as e:
                raise e