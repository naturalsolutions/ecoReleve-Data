from sqlalchemy import (
    Column,
    ForeignKey,
    Integer,
    Sequence
    )
from ecoreleve_server.ModelDB import MAIN_DB_BASE


class SensorType_SensorDynProp(MAIN_DB_BASE):

    __tablename__ = 'SensorType_SensorDynProp'

    ID = Column(Integer,
                Sequence('SensorType_SensorDynProp__id_seq'),
                primary_key=True)
    Required = Column(Integer,
                      server_default='0',
                      nullable=False)
    FK_SensorType = Column(Integer,
                            ForeignKey('SensorType.ID'),
                            nullable=True)
    FK_SensorDynProp = Column(Integer,
                               ForeignKey('SensorDynProp.ID'),
                               nullable=True)
             
