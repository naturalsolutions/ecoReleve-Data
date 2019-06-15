from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String
)
from sqlalchemy.orm import relationship
from ecoreleve_server.ModelDB.meta import SENSOR_DB
from ecoreleve_server.core.init_db import dbConfig


class ArgosGps(SENSOR_DB):
    __tablename__ = 'T_argosgps'
    pk_id = Column('PK_id', Integer, primary_key=True)
    ptt = Column('FK_ptt', Integer, nullable=False)
    type_ = Column('type', String(3), nullable=False)
    date = Column('date', DateTime, nullable=False)
    lat = Column(Numeric(9, 5), nullable=False)
    lon = Column(Numeric(9, 5), nullable=False)
    ele = Column(Integer)
    speed = Column(Integer)
    course = Column(Integer)
    lc = Column('lc', String(1))
    iq = Column('iq', Integer)
    nbMsg = Column(Integer)
    nbMsg120 = Column(Integer)
    bestLvl = Column('bestLevel', Integer)
    passDuration = Column(Integer)
    nopc = Column('nopc', Integer)
    frequency = Column('freq', Float)
    checked = Column('checked', Boolean, nullable=False, default=False)
    imported = Column('imported', Boolean, nullable=False, default=False)
    FK_Import = Column('FK_Import', Integer, ForeignKey('Import.ID'))
    ImportedFile = relationship('Import', back_populates='ArgosGPSRawDatas')

    if 'mssql' in dbConfig['dialect']:
        __table_args__ = (
            Index(
                'idx_Targosgps_checked_with_pk_ptt_date',
                checked,
                ptt,
                mssql_include=[pk_id, date]
            ),
        )
    else:
        __table_args__ = (
            Index('idx_Targosgps_checked_ptt', checked, ptt),
        )
