from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    String
)
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.orm import relationship
from ecoreleve_server.ModelDB.meta import SENSOR_DB
from ecoreleve_server.core.init_db import dbConfig


class ArgosEngineering(SENSOR_DB):
    __tablename__ = 'Tgps_engineering'
    pk_id = Column('PK_id', Integer, primary_key=True)
    fk_ptt = Column('FK_ptt', Integer, nullable=False)
    pttDate = Column('pttDate', DateTime, nullable=False)
    txDate = Column('txDate', DateTime, nullable=False)
    satId = Column(String(250))
    txCount = Column(Integer)
    temp = Column(Float)
    batt = Column(Float)
    fixTime = Column(Integer)
    satCount = Column(Integer)
    resetHours = Column(Integer)
    fixDays = Column(Integer)
    season = Column(Integer)
    shunt = Column(Boolean)
    mortalityGT = Column(Boolean)
    seasonalGT = Column(Boolean)
    latestLat = Column(Float)
    latestLon = Column(Float)
    FK_Import = Column('FK_Import', Integer, ForeignKey('Import.ID'))
    ImportedFile = relationship('Import', back_populates='ArgosEngRawDatas')

    @hybrid_property
    def date(self):
        return self.pttDate

    if 'mssql' in dbConfig['dialect']:
        __table_args__ = (
            Index('idx_Tgps_engineering_pttDate_ptt', pttDate, fk_ptt),
        )
