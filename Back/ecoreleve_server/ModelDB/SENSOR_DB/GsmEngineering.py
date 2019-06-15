from sqlalchemy import (
    Column,
    DateTime,
    Index,
    ForeignKey,
    Integer,
    Numeric,
    Sequence
)
from sqlalchemy.orm import relationship
from ecoreleve_server.ModelDB.meta import SENSOR_DB
from ecoreleve_server.core.init_db import dbConfig


class GsmEngineering (SENSOR_DB):
    __tablename__ = 'Tengineering_gsm'
    PK_id = Column(Integer, Sequence(
        'seq_Tengineering_gsm_id'), primary_key=True)
    platform_ = Column(Integer, nullable=False)
    date = Column('DateTime', DateTime, nullable=False)
    ActivityCount = Column(Integer, )
    Temperature_C = Column(Numeric)
    BatteryVoltage_V = Column(Numeric)
    file_date = Column(DateTime)
    FK_Import = Column('FK_Import', Integer, ForeignKey('Import.ID'))
    ImportedFile = relationship('Import', back_populates='GSMengRawDatas')

    if 'mssql' in dbConfig['dialect']:
        __table_args__ = (
            Index('idx_Tengineering_gsm_pttDate_ptt', date, platform_),
        )
