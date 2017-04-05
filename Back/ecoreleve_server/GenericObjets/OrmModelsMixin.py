from sqlalchemy import (Column,
                        ForeignKey,
                        String,
                        Integer,
                        Float,
                        DateTime,
                        select,
                        join,
                        func,
                        not_,
                        exists,
                        event,
                        Table)
from sqlalchemy.orm import relationship, aliased, class_mapper
from sqlalchemy.ext.associationproxy import association_proxy
from sqlalchemy.ext.declarative import declared_attr
from ..Models import Base
from sqlalchemy import inspect, orm
from sqlalchemy.ext.compiler import compiles
from sqlalchemy.sql.expression import Executable, ClauseElement
from ..utils.parseValue import parser
from datetime import datetime


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
        return {c.key: getattr(self, c.key)
                for c in inspect(self).mapper.column_attrs}


class GenericType(ORMUtils):
    __tablename__ = None
    id = Column(Integer, primary_key=True)
    name = Column(String(250), nullable=False)
    parent = None

    # @staticmethod
    @classmethod
    def getPropertiesClass(cls):

        class Properties(ORMUtils, Base):
            __tablename__ = cls.parent.__tablename__+'DynProp'
            id = Column(Integer, primary_key=True)
            name = Column(String(250), nullable=False)
            typeProp = Column(String(250), nullable=False)

        cls.PropertiesClass = Properties
        return Properties

    @declared_attr
    def _type_properties(cls):
        class TypeProperties(Base):
            __tablename__ = cls.__tablename__+'_'+cls.parent.__tablename__+'DynProp'
            id = Column(Integer, primary_key=True)
            type_id = Column('FK_'+cls.__tablename__,
                             ForeignKey(cls.__tablename__+'.id'),
                             nullable=False
                             )
            property_id = Column('FK_'+cls.parent.__tablename__+'DynProp',
                                 ForeignKey(cls.parent.__tablename__+'DynProp.id'),
                                 nullable=False
                                 )
        return relationship(TypeProperties)

    @declared_attr
    def _properties(cls):
        linkedTable = cls.__tablename__+'_'+cls.parent.__tablename__+'DynProp'
        dynpropTable = cls.parent.__tablename__+'DynProp'

        Properties = cls.getPropertiesClass()
        return relationship(Properties,
                            secondary='join(' + dynpropTable + ',' + linkedTable + ','
                                      + '' + linkedTable + '.c.FK_' + dynpropTable + '==' + dynpropTable + '.c.id)',
                            primaryjoin=cls.__tablename__ + '.c.id==' + linkedTable + '.c.FK_' + cls.__tablename__
                            )

    @declared_attr
    def properties(cls):
        return association_proxy('_properties', 'name')


class HasDynamicProperties(ORMUtils):

    history_track = True

    id = Column(Integer(), primary_key=True)

    def __init__(self, **kwargs):
        self.session = kwargs.get('session', None)
        pass

    @orm.reconstructor
    def init_on_load(self):
        self.session = inspect(self).session

    @declared_attr
    def table_type_name(cls):
        return cls.__tablename__+'Type'

    @declared_attr
    def fk_table_type_name(cls):
        return 'FK_'+cls.__tablename__+'Type'

    @declared_attr
    def table_DynProp_name(cls):
        return cls.__tablename__+'DynProp'

    @declared_attr
    def fk_table_DynProp_name(cls):
        return 'FK_'+cls.__tablename__+'DynProp'

    @declared_attr
    def linked_table_name(cls):
        return cls.__tablename__+'Type_'+cls.__tablename__+'DynProp'

    @declared_attr
    def _type(cls):
        Type = cls.getTypeClass()
        return relationship(Type)

    @declared_attr
    def type_id(cls):
        return Column('FK_'+cls.__tablename__+'Type',
                      ForeignKey(cls.__tablename__+'Type'+'.id'),
                      nullable=False
                      )

    @classmethod
    def getTypeClass(cls):
        class Type(GenericType, Base):
            __tablename__ = cls.__tablename__+'Type'
            parent = cls
        cls.TypeClass = Type
        return Type

    @classmethod
    def getDynamicValuesClass(cls):
        class DynamicValues(ORMUtils, Base):
            __tablename__ = cls.__tablename__+'DynPropValues'
            id = Column(Integer, primary_key=True)
            StartDate = Column(DateTime, nullable=False)
            ValueString = Column(String(250))
            ValueDate = Column(DateTime)
            ValueFloat = Column(Float)
            ValueInteger = Column(Integer)
            fk_parent = Column('FK_'+cls.__tablename__,
                               ForeignKey(cls.__tablename__+'.id'),
                               nullable=False
                               )
            fk_property = Column('FK_'+cls.__tablename__+'DynProp',
                                 ForeignKey(cls.__tablename__+'DynProp.id'),
                                 nullable=False
                                 )
            property_name = association_proxy('property_id', 'name')

        cls.DynamicValuesClass = DynamicValues
        return DynamicValues

    @declared_attr
    def _dynamicValues(cls):
        DynamicValues = cls.getDynamicValuesClass()
        return relationship(DynamicValues,
                            cascade="all, delete-orphan")

    @declared_attr
    def type(cls):
        return association_proxy('_type', 'name')

    @classmethod
    def lastValueQuery(cls):
        ''' build query to retrieve latest values of dynamic properties '''
        DynamicValues = cls.DynamicValuesClass or cls.getDynamicValuesClass()
        Properties = cls.TypeClass.PropertiesClass
        dv2 = aliased(DynamicValues)

        sub_query = select([dv2]).where(dv2.fk_property == DynamicValues.fk_property)
        sub_query = sub_query.where(dv2.fk_parent == DynamicValues.fk_parent)
        sub_query = sub_query.where(dv2.StartDate > DynamicValues.StartDate)
        sub_query = sub_query.where(dv2.StartDate <= func.now())

        join_ = join(DynamicValues, Properties, Properties.id == DynamicValues.fk_property)
        query = select([DynamicValues,
                        Properties.name.label('Name'),
                        Properties.typeProp.label('TypeProp')]
                       ).select_from(join_).where(not_(exists(sub_query)))
        return query

    @declared_attr
    def lastValueView(cls):
        ''' create/intialize view of last dynamic properties values,
            return the mapped view'''
        @event.listens_for(cls, 'mapper_configured')
        def initView(mapper, t):
            cls = mapper.class_
            viewName = cls.DynamicValuesClass.__tablename__+'Now'
            if viewName not in Base.metadata.tables:
                createview = CreateView(viewName,
                                        cls.lastValueQuery())
                Base.metadata.bind.execute(createview)

            cls.LastDynamicValueViewClass = Table(viewName,
                                                  Base.metadata,
                                                  autoload=True)
            return viewName
        return initView

    def getLatestDynamicValues(self):
        ''' retrieve latest values of dynamic properties '''
        if not hasattr(self, 'latestValues'):
            table = self.LastDynamicValueViewClass
            query = table.select().where(table.c['FK_'+self.__tablename__] == self.id)
            values = self.session.execute(query).fetchall()
            self.latestValues = [(lambda x: dict(x))(val) for val in values]
        return self.latestValues

    @property
    def values(self):
        ''' return flat data object '''
        dictValues = {}
        values = self.getLatestDynamicValues()

        for value in values:
            property_ = self.get_property_by_name(value['Name'])
            valueName = 'Value'+property_.get('typeProp')
            dictValues[property_.get('name')] = value.get(valueName)
        dictValues.update(self.as_dict())
        return dictValues

    @values.setter
    def values(self, dict_):
        ''' set object properties (static and dynamic), 
        it's possible to set all dynamic properties with date string with __useDate__ key'''

        if self.fk_table_type_name not in dict_ and 'type_id' not in dict_:
            raise Exception('object type not exists')
        else:
            type_id = dict_.get(self.fk_table_type_name, None) or dict_.get('type_id', None)
            self._type = self.session.query(self.TypeClass).get(type_id)
            for prop, value in dict_.items():
                self.setValue(prop, value, parser(dict_.get('__useDate__', None)))

    def setValue(self, propertyName, value, useDate=None):
        if hasattr(self, propertyName):
            setattr(self, propertyName, parser(value))
        elif propertyName in self.__table__.c:
            propertyName = class_mapper(inspect(self).class_
                                        ).get_property_by_column(self.__table__.c[propertyName]
                                                                 ).key
            setattr(self, propertyName, parser(value))
            pass
        else:
            if not useDate:
                useDate = datetime.now()
            self.setDynamicValue(propertyName, parser(value), useDate)
        pass

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
                                          ).get(existingValues[0].get('id'))

        if not curValue:
            curValue = self.DynamicValuesClass(fk_property=prop.get('id'))
            self._dynamicValues.append(curValue)

        curValue.StartDate = useDate
        setattr(curValue, 'Value'+prop.get('typeProp'), value)

    def getDynamicValueAtDate(self, propertyName, useDate):
        prop = self.get_property_by_name(propertyName)
        valueAtDate = list(filter(lambda x: (x.fk_property == prop.get('id')
                                             and x.StartDate == useDate
                                             ), self._dynamicValues))
        if len(valueAtDate) > 0:
            curValue = valueAtDate[0]
            return curValue

    @property
    def properties(self):
        return [prop.as_dict() for prop in self._type._properties]

    @property
    def properties_by_id(self):
        return {prop.as_dict().get('id'): prop.as_dict() for prop in self._type._properties}

    @property
    def properties_by_name(self):
        return {prop.as_dict().get('name'): prop.as_dict() for prop in self._type._properties}

    def get_property_by_id(self, id_):
        return self.properties_by_id.get(id_)

    def get_property_by_name(self, name):
        return self.properties_by_name.get(name)


class MyObject(HasDynamicProperties, Base):
    __tablename__ = 'MyObject'
    id = Column(Integer(), primary_key=True)
    toto = Column(String)


class OHMyObject(HasDynamicProperties, Base):
    __tablename__ = 'OHMyObject'
    id = Column(Integer(), primary_key=True)
    tutu = Column(String)

