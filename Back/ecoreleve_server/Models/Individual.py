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
from ..GenericObjets.ObjectWithDynProp import ObjectWithDynProp
from ..GenericObjets.ObjectTypeWithDynProp import ObjectTypeWithDynProp
from ..Models import IntegerDateTime


class ErrorCheckIndividualCodes(Exception):

    def __init__(self, propertyName):
        self.propertyName = propertyName
        self.value = self.propertyName+' already exists'

    def __str__(self):
        return self.value


class Individual (Base, ObjectWithDynProp):

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
    FK_IndividualType = Column(Integer, ForeignKey('IndividualType.ID'))

    IndividualDynPropValues = relationship('IndividualDynPropValue',
                                           backref='Individual',
                                           cascade="all, delete-orphan")
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

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        ObjectWithDynProp.__init__(self)
        self.constraintFunctionList = [self.checkIndividualCodes]

    def GetNewValue(self, nameProp):
        ReturnedValue = IndividualDynPropValue()
        ReturnedValue.IndividualDynProp = self.session.query(
            IndividualDynProp).filter(IndividualDynProp.Name == nameProp).first()
        return ReturnedValue

    def GetDynPropValues(self):
        return self.IndividualDynPropValues

    def GetDynProps(self, nameProp):
        return self.session.query(IndividualDynProp
                                     ).filter(IndividualDynProp.Name == nameProp
                                              ).one()

    def GetType(self):
        if self.IndividualType is not None:
            return self.IndividualType
        else:
            return self.session.query(IndividualType).get(self.FK_IndividualType)

    def updateFromJSON(self, DTOObject, startDate=None):
        if self.checkIndividualCodes(DTOObject):
            ObjectWithDynProp.updateFromJSON(self, DTOObject, startDate)

    def checkIndividualCodes(self, DTOObject):
        '''check existing Breeding_Ring_Code, Chip_Code and Release_Ring_Code
         return False if the value already existing '''
        for property_ in ['Breeding_Ring_Code', 'Chip_Code', 'Release_Ring_Code']:
            if DTOObject.get(property_, None):
                code = DTOObject.get(property_)
                ind_id = 0 if not self.ID else self.ID
                stmt = text(""" DECLARE @code varchar(250), @id_indiv int, @result int;
                            exec [dbo].[pr_Check_Existing_IndivCode]"""
                            + """ :code, :property, :ind_id , @result OUTPUT;
                            SELECT @result;"""
                            ).bindparams(bindparam('code', code),
                                         bindparam('property', property_),
                                         bindparam('ind_id', ind_id),
                                         )
                result = self.session.execute(stmt).scalar()
                if result:
                    raise ErrorCheckIndividualCodes(property_)
        return True


class IndividualDynProp (Base):

    __tablename__ = 'IndividualDynProp'
    ID = Column(Integer, Sequence(
        'IndividualDynProp__id_seq'), primary_key=True)
    Name = Column(String(250), nullable=False)
    TypeProp = Column(String(100), nullable=False)

    IndividualType_IndividualDynProps = relationship(
        'IndividualType_IndividualDynProp', backref='IndividualDynProp')
    IndividualDynPropValues = relationship(
        'IndividualDynPropValue', backref='IndividualDynProp')


class IndividualDynPropValue(Base):

    __tablename__ = 'IndividualDynPropValue'

    ID = Column(Integer, Sequence(
        'IndividualDynPropValue__id_seq'), primary_key=True)
    StartDate = Column(DateTime, nullable=False)
    ValueInt = Column(Integer)
    ValueString = Column(String(250))
    ValueDate = Column(DateTime)
    ValueFloat = Column(Numeric(12, 5))
    FK_IndividualDynProp = Column(Integer, ForeignKey('IndividualDynProp.ID'))
    FK_Individual = Column(Integer, ForeignKey('Individual.ID'))


class IndividualType (Base, ObjectTypeWithDynProp):

    __tablename__ = 'IndividualType'
    ID = Column(Integer, Sequence('IndividualType__id_seq'), primary_key=True)
    Name = Column(String(250))
    Status = Column(Integer)

    IndividualType_IndividualDynProp = relationship(
        'IndividualType_IndividualDynProp', backref='IndividualType')
    Individuals = relationship('Individual', backref='IndividualType')

    @orm.reconstructor
    def init_on_load(self):
        ObjectTypeWithDynProp.__init__(self)


class IndividualType_IndividualDynProp(Base):

    __tablename__ = 'IndividualType_IndividualDynProp'

    ID = Column(Integer, Sequence(
        'IndividualType_IndividualDynProp__id_seq'), primary_key=True)
    Required = Column(Integer, nullable=False)
    FK_IndividualType = Column(Integer, ForeignKey('IndividualType.ID'))
    FK_IndividualDynProp = Column(Integer, ForeignKey('IndividualDynProp.ID'))


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

    # __mapper_args__ = {
    #     'polymorphic_on':Status_,
    #     'polymorphic_identity':'object'
    # }
