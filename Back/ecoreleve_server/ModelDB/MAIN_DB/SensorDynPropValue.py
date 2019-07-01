from sqlalchemy import (
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Sequence,
    func
    )
from ecoreleve_server.ModelDB.meta import MAIN_DB_BASE



class SensorDynPropValue(MAIN_DB_BASE):

    __tablename__ = 'SensorDynPropValue'

    ID = Column(Integer,
                Sequence('SensorDynPropValue__id_seq'),
                primary_key=True)
    StartDate = Column(DateTime,
                       nullable=False)
    ValueInt = Column(Integer,
                      nullable=True)
    ValueString = Column(Unicode(255),
                         nullable=True)
    ValueDate = Column(DateTime,
                       nullable=True)
    ValueFloat = Column(Float,
                        nullable=True)
    FK_SensorDynProp = Column(Integer,
                               ForeignKey('SensorDynProp.ID'),
                               nullable=False)
    FK_Sensor = Column(Integer,
                        ForeignKey('Sensor.ID'),
                        nullable=False)