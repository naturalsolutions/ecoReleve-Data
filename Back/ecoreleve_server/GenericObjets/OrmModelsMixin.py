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
                        Table,
                        Index,
                        UniqueConstraint,
                        Table,
                        text,
                        bindparam,
                        insert)
from sqlalchemy.orm import relationship, aliased, class_mapper, mapper
from sqlalchemy.ext.associationproxy import association_proxy
from sqlalchemy.ext.declarative import declared_attr
from ..Models import Base, dbConfig, BusinessRules
from sqlalchemy import inspect, orm
from sqlalchemy.ext.compiler import compiles
from sqlalchemy.sql.expression import Executable, ClauseElement
from ..utils.parseValue import parser
from datetime import datetime
from .DataBaseObjects import ConfiguredDbObjectMapped, DbObject
# from sqlalchemy.event import listens_for


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
        return {c.key: getattr(self, c.key)
                for c in inspect(self).mapper.column_attrs}


class GenericType(ORMUtils):
    __tablename__ = None
    ID = Column(Integer, primary_key=True)
    Name = Column(String(250), nullable=False)
    parent = None

    @classmethod
    def getPropertiesClass(cls):

        class Properties(ORMUtils, Base):
            __tablename__ = cls.parent.__tablename__+'DynProp'
            ID = Column(Integer, primary_key=True)
            Name = Column(String(250), nullable=False)
            TypeProp = Column(String(250), nullable=False)

            @declared_attr
            def __table_args__(cls):
                return (UniqueConstraint(
                            cls.Name,
                            name='uqc_'+cls.__tablename__+'_name'),
                        )
        cls.PropertiesClass = Properties
        return Properties

    @declared_attr
    def _type_properties(cls):
        class TypeProperties(Base):
            __tablename__ = cls.__tablename__+'_'+cls.parent.__tablename__+'DynProp'
            ID = Column(Integer, primary_key=True)
            type_id = Column('FK_'+cls.__tablename__,
                             ForeignKey(cls.__tablename__+'.ID'),
                             nullable=False
                             )
            property_id = Column('FK_'+cls.parent.__tablename__+'DynProp',
                                 ForeignKey(cls.parent.__tablename__+'DynProp.ID'),
                                 nullable=False
                                 )
            linkedTable = Column('LinkedTable', String(255))
            linkedField = Column('LinkedField', String(255))
            linkedID = Column('LinkedID', String(255))
            linkedSourceID = Column('LinkedSourceID', String(255))
        cls.TypePropertiesClass = TypeProperties
        return relationship(TypeProperties)

    @declared_attr
    def _properties(cls):
        linkedTable = cls.__tablename__+'_'+cls.parent.__tablename__+'DynProp'
        dynpropTable = cls.parent.__tablename__+'DynProp'

        Properties = cls.getPropertiesClass()
        return relationship(Properties,
                            secondary='join(' + dynpropTable + ',' + linkedTable + ','
                                      + '' + linkedTable + '.c.FK_' + dynpropTable + '==' + dynpropTable + '.c.ID)',
                            primaryjoin=cls.__tablename__ + '.c.ID==' + linkedTable + '.c.FK_' + cls.__tablename__
                            )

    @declared_attr
    def properties(cls):
        return association_proxy('_properties', 'name')


class HasDynamicProperties(ConfiguredDbObjectMapped, DbObject, ORMUtils):
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

    ID = Column(Integer(), primary_key=True)

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
                      ForeignKey(cls.__tablename__+'Type'+'.ID'),
                      nullable=False
                      )

    @classmethod
    def getTypeClass(cls):
        class Type(GenericType, Base):
            __name__ = cls.__tablename__+'Type'
            __tablename__ = cls.__tablename__+'Type'
            parent = cls
        cls.TypeClass = Type
        return Type

    @classmethod
    def getDynamicValuesClass(cls):
        class DynamicValues(ORMUtils, Base):
            __tablename__ = cls.__tablename__+'DynPropValues'
            ID = Column(Integer, primary_key=True)
            StartDate = Column(DateTime, nullable=False)
            ValueString = Column(String(250))
            ValueDate = Column(DateTime)
            ValueFloat = Column(Float)
            ValueInt = Column(Integer)
            fk_parent = Column('FK_'+cls.__tablename__,
                               ForeignKey(cls.__tablename__+'.ID'),
                               nullable=False
                               )
            fk_property = Column('FK_'+cls.__tablename__+'DynProp',
                                 ForeignKey(cls.__tablename__+'DynProp.ID'),
                                 nullable=False
                                 )
            property_name = association_proxy('property_id', 'name')

            @declared_attr
            def __table_args__(cls):
                return (Index('idx_%s' % cls.__tablename__+'_other',
                              cls.fk_parent,
                              cls.fk_property,
                              'StartDate'),
                        Index('idx_%s' % cls.__tablename__+'_ValueString',
                              cls.fk_parent,
                              'ValueString'),
                        UniqueConstraint(
                            cls.fk_parent,
                            cls.fk_property,
                            'StartDate',
                            name='uqc_'+cls.__tablename__
                        ),
                        )

        cls.DynamicValuesClass = DynamicValues
        return DynamicValues

    @declared_attr
    def _dynamicValues(cls):
        DynamicValues = cls.getDynamicValuesClass()
        return relationship(DynamicValues,
                            cascade="all, delete-orphan")

    @declared_attr
    def type(cls):
        return association_proxy('_type', 'Name')

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

        join_ = join(DynamicValues, Properties, Properties.ID == DynamicValues.fk_property)
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
            viewName = cls.DynamicValuesClass.__tablename__+'Now'
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
                Base.metadata.bind.execute(createview.execution_options(autocommit=True))

            cls.LastDynamicValueViewClass = Table(viewName.lower(),
                                                  Base.metadata,
                                                  autoload=True)
            return viewName
        return lastValueView

    def getLatestDynamicValues(self):
        ''' retrieve latest values of dynamic properties '''
        if not hasattr(self, 'latestValues'):
            table = self.LastDynamicValueViewClass
            query = table.select().where(table.c['FK_'+self.__tablename__] == self.ID)
            values = self.session.execute(query).fetchall()
            self.latestValues = [(lambda x: dict(x))(val) for val in values]
        return self.latestValues

    @property
    def values(self):
        ''' return flat data dict '''
        dictValues = {}
        values = self.getLatestDynamicValues()

        for value in values:
            property_ = self.get_property_by_name(value['Name'])
            valueName = ANALOG_DYNPROP_TYPES[property_.get('TypeProp')]
            dictValues[property_.get('Name')] = value.get(valueName)
        dictValues.update(self.as_dict())
        return dictValues

    @values.setter
    def values(self, dict_):
        '''parameters:
            - data (dict)
        set object properties (static and dynamic), 
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
                                          ).get(existingValues[0].get('ID'))

        if not curValue:
            curValue = self.DynamicValuesClass(fk_property=prop.get('ID'))
            self._dynamicValues.append(curValue)

        curValue.StartDate = useDate
        setattr(curValue, ANALOG_DYNPROP_TYPES[prop.get('TypeProp')], value)

    def getDynamicValueAtDate(self, propertyName, useDate):
        prop = self.get_property_by_name(propertyName)
        valueAtDate = list(filter(lambda x: (x.fk_property == prop.get('ID')
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
        return {prop.as_dict().get('ID'): prop.as_dict() for prop in self._type._properties}

    @property
    def properties_by_name(self):
        return {prop.as_dict().get('Name'): prop.as_dict() for prop in self._type._properties}

    def get_property_by_id(self, id_):
        return self.properties_by_id.get(id_)

    def get_property_by_name(self, name):
        return self.properties_by_name.get(name)

    def getLinkedField(self):
        # curQuery = 'select D.ID, D.Name , D.TypeProp , C.LinkedTable , C.LinkedField, C.LinkedID, C.LinkSourceID from ' + \
        #     self.GetType().GetDynPropContextTable()
        # curQuery += ' C  JOIN ' + self.GetType().GetDynPropTable() + ' D ON C.' + \
        #     self.GetType().Get_FKToDynPropTable() + '= D.ID '
        # curQuery += ' where C.' + self.GetType().GetFK_DynPropContextTable() + \
        #     ' = ' + str(self.GetType().ID)
        # curQuery += ' AND C.LinkedTable is not null'
        # Values = self.session.execute(curQuery).fetchall()

        # return [dict(row) for row in Values]

        return list(filter(lambda prop: prop.LinkedTable is not None, self.properties))

    def linkedFieldDate(self):
        return datetime.now()

    def updateLinkedField(self, data, useDate=None, previousState=None):
        if useDate is None:
            useDate = self.linkedFieldDate()

        linkedFields = self.getLinkedField()
        entitiesToUpdate = {}

        for linkProp in linkedFields:
            curPropName = linkProp['Name']
            linkedEntity = LinkedTables[linkProp['LinkedTable']]
            linkedPropName = linkProp['LinkedField'].replace('@Dyn:', '')
            linkedSource = self.getProperty(
                linkProp['LinkSourceID'].replace('@Dyn:', ''))

            # remove linked field if target object is different of previous

            if previousState and str(linkedSource) != str(previousState.get(linkProp['LinkSourceID'])):
                self.deleteLinkedField(previousState=previousState)

            try:
                linkedObj = self.session.query(linkedEntity).filter(
                    getattr(linkedEntity, linkProp['LinkedID']) == linkedSource).one()
            except NoResultFound:
                continue

            if linkedObj in entitiesToUpdate:
                entitiesToUpdate[linkedObj][linkedPropName] = self.getProperty(curPropName)
            else:
                entitiesToUpdate[linkedObj] = {linkedPropName: self.getProperty(curPropName)}

        for entity in entitiesToUpdate:
            data = entitiesToUpdate[entity]
            entity.init_on_load()
            entity.updateFromJSON(data, startDate=useDate)

    def deleteLinkedField(self, useDate=None, previousState=None):
        session = dbConfig['dbSession']()

        if useDate is None:
            useDate = self.linkedFieldDate()

        for linkProp in self.getLinkedField():
            obj = LinkedTables[linkProp['LinkedTable']]

            try:
                linkedField = linkProp['LinkedField'].replace('@Dyn:', '')
                if previousState:
                    linkedSource = previousState.get(linkProp['LinkSourceID'].replace('@Dyn:', ''))
                else:
                    linkedSource = self.getProperty(
                        linkProp['LinkSourceID'].replace('@Dyn:', ''))
                try:
                    linkedObj = session.query(obj).filter(
                        getattr(obj, linkProp['LinkedID']) == linkedSource).one()
                except NoResultFound:
                    continue

                if hasattr(linkedObj, linkedField):
                    linkedObj.setProperty(linkedField, None)
                else:
                    dynPropValueToDel = linkedObj.getDynPropWithDate(
                        linkedField, useDate)
                    if dynPropValueToDel is not None:
                        session.delete(dynPropValueToDel)

                session.commit()
                session.close()
            except Exception as e:
                raise e


class OrmController(object):
    __allORMClass__ = {}

    staticTypeDict = {'String': String,
                    'Float': Float,
                    'Integer': Integer,
                    'Date': DateTime,
                    }

    def __init__(self, objList=[]):
        self.conf = objList
        for obj in objList:
            self.buildClass(obj)

    def __getattr__(self, attr):
        return self.getClass(attr)

    def buildClass(self, dict):
        model = {}
        model['__tablename__'] = dict['__tablename__']
        model = self.setStaticProperties(model, dict['properties']['statics'])

        if('__classname__' in dict):
            classname = dict['__classname__']
        else:
            classname = dict['__tablename__'].title()

        if dict.get('isdynamic', None):
            dbObject = type(classname, (HasDynamicProperties, Base, ), model)
            self.setDBConfTypes(dbObject, dict)
        else:
            model['ID'] = Column(Integer, primary_key=True)
            dbObject = type(classname, (DbObject, Base, ), model)
        self.add(dbObject)

    def setStaticProperties(self, model, properties):
        for prop in properties:
            model[prop['name']] = Column(prop['name'], self.getCType(prop))
        return model

    def getCType(self, property):
        if property.get('clength', None):
            l = property['clength']
            return self.staticTypeDict[property['ctype']](l)
        else:
            return self.staticTypeDict[property['ctype']]

    def getClass(self, classname):
        return self.__allORMClass__.get(classname, None)

    def setDBConfTypes(self, curORMclass, model):
        @event.listens_for(curORMclass, 'mapper_configured')
        def setDBConfTypes(mapper, class_):
            if curORMclass:
                self.insertConfTypes(curORMclass, model)
                self.insertConfDynProp(curORMclass, model)
                self.insertConfType_DynProp(curORMclass, model)
    
    def insertConfTypes(self, dbObject, model):
        modelType = dbObject.TypeClass
        session = dbConfig['dbSession']()
        for _type in model.get('types', []):
            stmt = select([func.count(modelType.ID)]).where(modelType.Name == _type)
            typeExists = session.execute(stmt).scalar()

            if not typeExists:
                insert_stmt = insert(modelType).values({'Name':_type})
                session.execute(insert_stmt)
        session.commit()
        session.close()

    def insertConfDynProp(self, dbObject, model):
        modelProperties = dbObject.TypeClass.PropertiesClass
        confProperties = model.get('properties', {})
        session = dbConfig['dbSession']()
        for prop in confProperties.get('dynamics', []):
            stmt = select([func.count(modelProperties.ID)]).where(modelProperties.Name == prop['name'])
            typeExists = session.execute(stmt).scalar()

            if not typeExists:
                insert_stmt = insert(modelProperties).values({'Name':prop['name'], 'TypeProp':prop['ctype']})
                session.execute(insert_stmt)
        session.commit()
        session.close()
    
    def insertConfType_DynProp(self, dbObject, model):
        modelProperties = dbObject.TypeClass.PropertiesClass
        modelType = dbObject.TypeClass
        modelTypeProperties = dbObject.TypeClass.TypePropertiesClass

        session = dbConfig['dbSession']()
        types = session.execute(select([modelType])).fetchall()
        properties = session.execute(select([modelProperties])).fetchall()
        typeProperties = session.execute(select([modelTypeProperties])).fetchall()

        valuesToInsert = []
        for _type, props in model.get('types', []).items():
            curType = list(filter(lambda t: t['Name'] == _type, types))[0]
            for prop in props:
                curProp = list(filter(lambda p: p['Name'] == prop, properties))[0]
                linkExists = list(filter(lambda x: x[dbObject.fk_table_type_name] == curType['ID'] and x[dbObject.fk_table_DynProp_name] ==curProp['ID']
                                    , typeProperties))
                if not linkExists:
                    valuesToInsert.append({dbObject.fk_table_type_name:curType['ID'] , dbObject.fk_table_DynProp_name:curProp['ID']})

        if valuesToInsert:
            insert_stmt = insert(modelTypeProperties).values(valuesToInsert)
            session.execute(insert_stmt)

        session.commit()
        session.close()

    def add(self, dbObject):
        self.__allORMClass__[dbObject.__name__] = dbObject





# class MyObject(HasDynamicProperties, Base):
#     __tablename__ = 'MyObject'
#     toto = Column(String)


storageConf = [
    {'__tablename__': 'tropdelaballe',
     '__classname__': 'Tropdelaballe',
     'isdynamic':1,
     'properties': {
         'statics': [
            {'name': 'tutu', 'ctype': 'String', 'clength': 255},
            {'name': 'tata', 'ctype': 'Integer', 'clength': None},
            {'name': 'toto', 'ctype': 'Float'}
            ],
            'dynamics': [
            {'name': 'dyn1', 'ctype': 'String', 'clength': 10},
            {'name': 'dyn2', 'ctype': 'Integer', 'clength': None},
            {'name': 'dyn3', 'ctype': 'Float'},
            {'name': 'dyn4', 'ctype': 'String', 'clength': 255},
            ]
        },
      'types':{
          'type1': ['dyn1', 'dyn2'],
          'type2': ['dyn3', 'dyn4']
      }
    },
    {'__tablename__': 'alleeelaaaa',
     '__classname__': 'Alleluhia',
     'isdynamic': 1,
     'track_history':1,
     'properties': {
        'statics': [
            {'name': 'ahhhhhaaa', 'ctype': 'String', 'clength': 10},
            {'name': 'oohhh', 'ctype': 'Integer', 'clength': None},
            {'name': 'tada', 'ctype': 'Float'},
            {'name': 'pffffff', 'ctype': 'String', 'clength': 255},
            ],
        'dynamics': [
            {'name': 'dyn1', 'ctype': 'String', 'clength': 10},
            {'name': 'dyn2', 'ctype': 'Integer', 'clength': None},
            {'name': 'dyn3', 'ctype': 'Float'},
            {'name': 'dyn4', 'ctype': 'String', 'clength': 255},
            ]
        },
      'types':{
          'type1': ['dyn1', 'dyn2'],
          'type2': ['dyn3', 'dyn4']
      }
    }
]

from sqlalchemy import exc as sa_exc
import warnings
with warnings.catch_warnings():
    warnings.simplefilter("ignore", category=sa_exc.SAWarning)
    ClassController = OrmController(storageConf)
