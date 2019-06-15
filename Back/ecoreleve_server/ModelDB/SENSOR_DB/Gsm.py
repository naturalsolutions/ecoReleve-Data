from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Index,
    ForeignKey,
    Integer,
    Numeric
)
from sqlalchemy.orm import relationship
from ecoreleve_server.ModelDB.meta import SENSOR_DB
from ecoreleve_server.core.init_db import dbConfig


class Gsm(SENSOR_DB):
    __tablename__ = 'Tgsm'
    pk_id = Column('PK_id', Integer, primary_key=True)
    platform_ = Column('platform_', Integer, nullable=False)
    date = Column('DateTime', DateTime, nullable=False)
    lat = Column('Latitude_N', Numeric(9, 5), nullable=False)
    lon = Column('Longitude_E', Numeric(9, 5), nullable=False)
    ele = Column('Altitude_m', Integer)
    Speed = Column(Integer)
    Course = Column(Integer)
    checked = Column(Boolean, nullable=False, server_default='0')
    imported = Column(Boolean, nullable=False, server_default='0')
    SatelliteCount = Column(Integer)
    HDOP = Column(Integer)
    VDOP = Column(Integer)
    validated = Column(Boolean, nullable=False, server_default='0')
    FK_Import = Column('FK_Import', Integer, ForeignKey('Import.ID'))
    ImportedFile = relationship('Import', back_populates='GSMrawDatas')

    if 'mssql' in dbConfig['dialect']:
        __table_args__ = (
            Index('idx_Tgsm_checked_with_pk_ptt_date', checked, platform_,
                  mssql_include=[pk_id, date]
                  ),
        )
    else:
        __table_args__ = (
            Index('idx_Tgsm_checked_ptt', checked, platform_),
        )
