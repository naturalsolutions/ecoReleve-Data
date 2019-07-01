from sqlalchemy.ext.declarative import declarative_base,DeclarativeMeta
from sqlalchemy.orm import sessionmaker
from sqlalchemy import MetaData
import json
import datetime
import decimal

class Base(object):
    __table_args__ = {'implicit_returning': False}

    RELATIONSHIPS_TO_DICT = False

    def __iter__(self):
        return self.to_dict().iteritems()

    def to_dict(self, rel=None, backref=None):
        if rel is None:
            rel = self.RELATIONSHIPS_TO_DICT
        res = {column.key: getattr(self, attr)
               for attr, column in self.__mapper__.c.items()}
        if rel:
            for attr, relation in self.__mapper__.relationships.items():
                # Avoid recursive loop between to tables.
                if backref == relation.table:
                    continue
                value = getattr(self, attr)
                if value is None:
                    res[relation.key] = None
                elif isinstance(value.__class__, DeclarativeMeta):
                    res[relation.key] = value.to_dict(backref=self.__table__)
                else:
                    res[relation.key] = [i.to_dict(backref=self.__table__)
                                         for i in value]
        return res

    def to_json(self, rel=None):
        def extended_encoder(x):
            if isinstance(x, datetime.datetime):
                return x.isoformat()
            if isinstance(x,decimal.Decimal):
                return float(x)
        if rel is None:
            rel = self.RELATIONSHIPS_TO_DICT
        return json.dumps(self.to_dict(rel), default=extended_encoder)

Base = declarative_base(cls=Base)
TheSession = sessionmaker()

# create 4 top level class for each database
# these class will be attached with each engine
# then for a given model sqlalchemy will automatically chose the 'good' engine with top level class


class MAIN_DB_BASE(Base):
    __abstract__ = True
    metadata = MetaData()


class SENSOR_DB_BASE(Base):
    __abstract__ = True
    metadata = MetaData()


class EXPORT_DB_BASE(Base):
    __abstract__ = True
    metadata = MetaData()


class LOG_DB_BASE(Base):
    __abstract__ = True
    metadata = MetaData()