from sqlalchemy import Column, Integer, ForeignKey, String, Integer, Float, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.ext.associationproxy import association_proxy
from sqlalchemy.ext.declarative import  declared_attr
from ..Models import Base
from sqlalchemy.orm.collections import attribute_mapped_collection
from sqlalchemy.orm import class_mapper


class ORMUtils(object):
    def as_dict(self):
        mapper = class_mapper(self.__class__)
        print(mapper.column_attrs.__dict__)
        return {c.name: mapper.get_property(c.name) for c in self.__table__.columns}



class GenericType(ORMUtils):
    __tablename__ = None
    id = Column(Integer, primary_key=True)
    name = Column(String(250), nullable=False)
    parent = None

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

        class Properties(ORMUtils, Base):
            __tablename__ = dynpropTable
            id = Column(Integer, primary_key=True)
            name = Column(String(250), nullable=False)
            typeProp = Column(String(250), nullable=False)

        return relationship(Properties,
                            # collection_class=attribute_mapped_collection('name'),
                            secondary='join(' + dynpropTable + ',' + linkedTable + ','
                                      + '' + linkedTable + '.c.FK_' + dynpropTable + '==' + dynpropTable + '.c.id)',
                            primaryjoin=cls.__tablename__ + '.c.id==' + linkedTable + '.c.FK_' + cls.__tablename__
                            )

    @declared_attr
    def properties(cls):
        return association_proxy('_properties', 'name')


class HasDynamicProperties(ORMUtils):

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
        class Type(GenericType, Base):
            __tablename__ = cls.__tablename__+'Type'
            parent = cls
        return relationship(Type)

    @declared_attr
    def type_id(cls):
        return Column('FK_'+cls.__tablename__+'Type',
                      ForeignKey(cls.__tablename__+'Type'+'.id'),
                      nullable=False
                      )

    @declared_attr
    def _dynamicValues(cls):

        class DynamicValues(ORMUtils, Base):
            __tablename__ = cls.__tablename__+'DynPropValues'
            id = Column(Integer, primary_key=True)
            StartDate = Column(DateTime, nullable=False)
            ValueString = Column(String(250))
            ValueDate = Column(DateTime)
            ValueFloat = Column(Float)
            ValueInteger = Column(Integer)
            parent_id = Column('FK_'+cls.__tablename__,
                               ForeignKey(cls.__tablename__+'.id'),
                               nullable=False
                               )
            property_id = Column('FK_'+cls.__tablename__+'DynProp',
                                 ForeignKey(cls.__tablename__+'DynProp.id'),
                                 nullable=False
                                 )
            property_name = association_proxy('property_id', 'name')

            # def __getattribute__(self, name):
            #     '''handle get attribute for non mapped attribute name/column name'''
                
            #     dictProp = {'FK_'+cls.__tablename__+'DynProp': 'parent_id',
            #                 'FK_'+cls.__tablename__: 'property_id'}
            #     if name in dictProp:
            #         return object.__getattribute__(self, dictProp[name])
            #     return object.__getattribute__(self, name)

        return relationship(DynamicValues,
                            cascade="all, delete-orphan")

    @declared_attr
    def type(cls):
        return association_proxy('_type', 'name')

    @property
    def latestValues(self):
        pass

    @property
    def values(self):
        from sqlalchemy import inspect

        print(inspect(self).mapper.attrs)
        dictValues = {}
        values = [(lambda x: x.as_dict())(val) for val in self._dynamicValues]

        for value in values:
            property_ = self.get_property_by_id(value['id'])
            valueName = 'Value'+property_.get('typeProp')
            dictValues[property_.get('name')] = value.get(valueName)
        # dictValues.update(self.as_dict())
        return dictValues

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
