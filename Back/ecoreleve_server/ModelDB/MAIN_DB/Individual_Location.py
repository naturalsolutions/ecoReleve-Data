from sqlalchemy import (
    cast,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Sequence
    )
from sqlalchemy.ext.hybrid import hybrid_property
from ecoreleve_server.core.base_types import IntegerDateTime
from ecoreleve_server.ModelDB import MAIN_DB_BASE


class Individual_Location(MAIN_DB_BASE):
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
    FK_FieldworkArea = Column(Integer, ForeignKey('FieldworkArea.ID'))

    creator = Column(Integer)
    creationDate = Column(DateTime)
    type_ = Column(String(10))

    @hybrid_property
    def date_timestamp(self):
        return self.Date.timestamp()

    @date_timestamp.expression
    def date_timestamp(self):
        return cast(self.Date, IntegerDateTime).label('timestamp')
