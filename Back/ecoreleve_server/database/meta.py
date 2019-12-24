from sqlalchemy.ext.declarative import declarative_base
# from sqlalchemy.orm import sessionmaker
from sqlalchemy import MetaData


class Base(object):
    __table_args__ = {'implicit_returning': False}


Base = declarative_base(cls=Base)
# TheSession = sessionmaker()

# create 4 top level class for each database
# these class will be attached with each engine
# then for a given model
# sqlalchemy will automatically chose the 'good' engine with top level class


class Main_Db_Base(Base):
    __abstract__ = True
    metadata = MetaData()


class Sensor_Db_Base(Base):
    __abstract__ = True
    metadata = MetaData()


class Export_Db_Base(Base):
    __abstract__ = True
    metadata = MetaData()


class Log_Db_Base(Base):
    __abstract__ = True
    metadata = MetaData()
