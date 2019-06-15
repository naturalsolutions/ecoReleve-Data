from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy import MetaData


class Base(object):
    __table_args__ = {'implicit_returning': False}


Base = declarative_base(cls=Base)
TheSession = sessionmaker()

# create 4 top level class for each database
# these class will be attached with each engine
# then for a given model sqlalchemy will automatically chose the 'good' engine with top level class


class MAIN_DB(Base):
    __abstract__ = True
    metadata = MetaData()


class SENSOR_DB(Base):
    __abstract__ = True
    metadata = MetaData()


class EXPORT_DB(Base):
    __abstract__ = True
    metadata = MetaData()


class LOG_DB(Base):
    __abstract__ = True
    metadata = MetaData()