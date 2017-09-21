from ..Models import Base
from sqlalchemy import (Column,
                        DateTime,
                        ForeignKey,
                        Integer,
                        Numeric,
                        String,
                        Sequence,
                        orm,
                        Table,
                        cast,
                        Date,
                        select,
                        or_,
                        and_,
                        func,
                        text,
                        bindparam)

from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.orm import relationship
from ..Models import IntegerDateTime
from ..GenericObjets.OrmModelsMixin import HasDynamicProperties


class ErrorCheckIndividualCodes(Exception):

    def __init__(self, propertyName):
        self.propertyName = propertyName
        self.value = self.propertyName+' already exists'

    def __str__(self):
        return self.value


class Individual (Base, HasDynamicProperties):

    __tablename__ = 'Individual'

    moduleFormName = 'IndivForm'
    moduleGridName = 'IndivFilter'

    ID = Column(Integer, Sequence('Individual__id_seq'), primary_key=True)
    creationDate = Column(DateTime, nullable=False, default=func.now())
    Species = Column(String(250))
    Age = Column(String(250))
    Birth_date = Column(Date)
    Death_date = Column(Date)
    Original_ID = Column(String(250))

    Locations = relationship('Individual_Location',
                             cascade="all, delete-orphan")
    Equipments = relationship('Equipment', cascade="all, delete-orphan")

    _Status_ = relationship(
        'IndividualStatus', uselist=False, backref="Individual")
    Observations = relationship('Observation')

    @hybrid_property
    def Status_(self):
        return self._Status_.Status_

    @Status_.setter
    def Status_(self, value):
        # no value is stored because it is calculated
        return


class Individual_Location(Base):
    __tablename__ = 'Individual_Location'

    ID = Column(Integer, Sequence(
        'Individual_Location__id_seq'), primary_key=True)
    LAT = Column(Numeric(9, 5))
    LON = Column(Numeric(9, 5))
    ELE = Column(Integer)
    Date = Column(DateTime)
    Precision = Column(Integer)
    FK_Sensor = Column(Integer, ForeignKey('Sensor.ID'))
    FK_Individual = Column(Integer, ForeignKey('Individual.ID'))
    FK_Region = Column(Integer, ForeignKey('Region.ID'))
    creator = Column(Integer)
    creationDate = Column(DateTime)
    type_ = Column(String(10))

    @hybrid_property
    def date_timestamp(self):
        return self.Date.timestamp()

    @date_timestamp.expression
    def date_timestamp(cls):
        return cast(cls.Date, IntegerDateTime).label('timestamp')


class IndividualStatus(Base):
    __table__ = Table('IndividualStatus', Base.metadata,
                      Column('FK_Individual', Integer, ForeignKey(
                          'Individual.ID'), primary_key=True),
                      Column('Status_', String)
                      )
    FK_Individual = __table__.c['FK_Individual']
    Status_ = __table__.c['Status_']
