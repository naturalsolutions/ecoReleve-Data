from sqlalchemy import Column, Integer, ForeignKey, String, Integer, Float, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.ext.associationproxy import association_proxy
from sqlalchemy.ext.declarative import  declared_attr
from ..Models import Base


class GenericType(object):
    __tablename__ = None
    id = Column(Integer, primary_key=True)
    name = Column(String(250))
    parent = None

    @declared_attr
    def _type_properties(cls):
        class TypeProperties(Base):
            __tablename__ = cls.__tablename__+'_'+cls.parent.__tablename__+'DynProp'
            id = Column(Integer, primary_key=True)
            name = Column(String(250))
            type_id = Column('FK_'+cls.__tablename__,
                             ForeignKey(cls.__tablename__+'.id'))
            property_id = Column('FK_'+cls.parent.__tablename__+'DynProp',
                                 ForeignKey(cls.parent.__tablename__+'DynProp.id'))
        return relationship(TypeProperties)

    @declared_attr
    def _properties(cls):
        linkedTable = cls.__tablename__+'_'+cls.parent.__tablename__+'DynProp'
        dynpropTable = cls.parent.__tablename__+'DynProp'

        class Properties(Base):
            __tablename__ = dynpropTable
            id = Column(Integer, primary_key=True)
            name = Column(String(250))
            typeProp = Column(String(250))

        return relationship(Properties,
                            secondary='join(' + dynpropTable + ',' + linkedTable + ','
                                      + '' + linkedTable + '.c.FK_' + dynpropTable + '==' + dynpropTable + '.c.id)',
                            primaryjoin=cls.__tablename__ + '.c.id==' + linkedTable + '.c.FK_' + cls.__tablename__
                            )

    @declared_attr
    def properties(cls):
        return association_proxy('_properties', 'name')


class HasDynamicProperties(object):

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
                      ForeignKey(cls.__tablename__+'Type'+'.id'))

    @declared_attr
    def _dynamicValues(cls):
        class DynamicValues(Base):
            __tablename__ = cls.__tablename__+'DynPropValues'
            id = Column(Integer, primary_key=True)
            StartDate = Column(DateTime)
            ValueString = Column(String(250))
            ValueDate = Column(DateTime)
            ValueFloat = Column(Float)
            ValueInteger = Column(Integer)
            parent_id = Column('FK_'+cls.__tablename__,
                               ForeignKey(cls.__tablename__+'.id'))
            property_id = Column('FK_'+cls.__tablename__+'DynProp',
                                 ForeignKey(cls.__tablename__+'DynProp.id'))
        return relationship(DynamicValues)

    @declared_attr
    def type(cls):
        return association_proxy('_type', 'name')

    @declared_attr
    def values(cls):
        return association_proxy('_dynamicValues', 'ValueString')


class MyObject(HasDynamicProperties, Base):
    __tablename__ = 'MyObject'
    id = Column(Integer(), primary_key=True)
    toto = Column(String)
