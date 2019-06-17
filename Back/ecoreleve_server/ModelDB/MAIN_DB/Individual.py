from sqlalchemy import (
    Column,
    Date,
    DateTime,
    Integer,
    String,
    Sequence,
    func
    )
from sqlalchemy.orm import relationship
from sqlalchemy.ext.associationproxy import association_proxy
from ecoreleve_server.ModelDB import MAIN_DB
from ecoreleve_server.core.base_model import HasDynamicProperties


class Individual (HasDynamicProperties, MAIN_DB):

    __tablename__ = 'Individual'

    moduleFormName = 'IndivForm'
    moduleGridName = 'IndivFilter'

    ID = Column(Integer, Sequence('Individual__id_seq'), primary_key=True)
    creationDate = Column(DateTime, nullable=False, default=func.now())
    Species = Column(String(250))
    Age = Column(String(250))
    Birth_date = Column(Date)
    Death_date = Column(Date)
    Original_ID = Column(String(250), default='0')

    Locations = relationship('Individual_Location',
                             cascade="all, delete-orphan")
    Equipments = relationship('Equipment',
                              cascade="all, delete-orphan",
                              primaryjoin='Individual.ID==' +
                              'Equipment' + '.FK_Individual')

    _Status_ = relationship(
        'IndividualStatus', uselist=False, backref="Individual")
    Observations = relationship('Observation')

    Status_ = association_proxy('_Status_', 'Status_')

    def as_dict(self):
        values = HasDynamicProperties.as_dict(self)
        values['Status_'] = self.Status_
        return values


class ErrorCheckIndividualCodes(Exception):

    def __init__(self, propertyName):
        self.propertyName = propertyName
        self.value = self.propertyName+' already exists'

    def __str__(self):
        return self.value