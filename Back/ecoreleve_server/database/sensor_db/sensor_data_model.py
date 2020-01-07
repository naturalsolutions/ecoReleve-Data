from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    Index,
    Integer,
    Numeric,
    Sequence,
    String,
    func,
    UniqueConstraint,
    ForeignKey,
    Unicode
)
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declared_attr

from ecoreleve_server.database.meta import Sensor_Db_Base
from ecoreleve_server.core.base_model import ORMUtils
from webargs import fields
from marshmallow import Schema, validate


class FilterSchema(Schema):
    tableName = fields.String(required=True)
    columnName = fields.String(required=True)
    operator = fields.String(required=True)
    value = fields.String(required=True)


class Filter(Schema):
    filters = fields.Nested(FilterSchema)


class GPX(Sensor_Db_Base):
    __tablename__ = 'Tgpx'
    pk_id = Column('PK_id', Integer, primary_key=True)
    StationDate = Column(DateTime, index=True, nullable=False)
    Name = Column(String(250))
    LAT = Column(Numeric(9, 5))
    LON = Column(Numeric(9, 5))
    ELE = Column(Integer)
    precision = Column(Integer)
    timeZone = Column(String(250))
    Place = Column(String(250))
    imported = Column('imported', Boolean, nullable=False, default=False)

    FK_Import = Column('FK_Import', Integer, ForeignKey('Import.ID'))
    ImportedFile = relationship('Import', back_populates='GPXrawDatas')

    @hybrid_property
    def date(self):
        return self.StationDate


class ArgosGps(Sensor_Db_Base):
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
    checked = Column('checked', Boolean, nullable=False, server_default='0')
    imported = Column('imported', Boolean, nullable=False, server_default='0')
    FK_Import = Column('FK_Import', Integer, ForeignKey('Import.ID'))
    ImportedFile = relationship('Import', back_populates='ArgosGPSRawDatas')
    Status = Column(String(50))
    Distance = Column(Integer)
    Calculated_Speed = Column(Integer)
    Quality_On_Speed = Column(Integer)
    Quality_On_Metadata = Column(Integer)
    Data_Quality = Column(Integer)
    Fk_individual_location = Column(Integer)
    __table_args__ = (
        Index(
            'idx_Targosgps_checked_with_pk_ptt_date',
            checked,
            ptt,
            mssql_include=[pk_id, date]
        ),
        Sensor_Db_Base.__table_args__
    )
    # Status = Column(String(50))
    # Calculated_Speed = Column(Integer)
    # Quality_On_Speed = Column(Integer)
    # Quality_On_Metadata = Column(Integer)
    # Data_Quality = Column(Integer)
    # Fk_individual_location = Column(Integer)

    # if 'mssql' in dialect:

    # else:
    #     __table_args__ = (
    #         Index('idx_Targosgps_checked_ptt', checked, ptt),
    #         # {'schema': sensor_schema, 'implicit_returning': False}
    #     )

    @declared_attr
    def queryStringAllowedParams(cls):
        return {
                'ptt': fields.DelimitedList(fields.Int())
        }

    def getQueryStringParsing(self):
        return self.queryStringParams


class Gsm(Sensor_Db_Base):
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
    Status = Column(String(50))
    Distance = Column(Integer)
    Calculated_Speed = Column(Integer)
    Quality_On_Speed = Column(Integer)
    Quality_On_Metadata = Column(Integer)
    Data_Quality = Column(Integer)
    Fk_individual_location = Column(Integer)
    ShowInKML = Column(Integer)

    # if 'mssql' in dialect:
    __table_args__ = (
        Index('idx_Tgsm_checked_with_pk_ptt_date', checked, platform_,
                mssql_include=[pk_id, date]
                ),
        Sensor_Db_Base.__table_args__
    )
    # else:
    #     __table_args__ = (
    #         Index('idx_Tgsm_checked_ptt', checked, platform_),
    #         {'implicit_returning': False}
    #     )


class GsmEngineering (Sensor_Db_Base):
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

    # if 'mssql' in dialect:
    __table_args__ = (
        Index('idx_Tengineering_gsm_pttDate_ptt', date, platform_),
        Sensor_Db_Base.__table_args__
    )


class ArgosEngineering(Sensor_Db_Base):
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

    __table_args__ = (
        Index('idx_Tgps_engineering_pttDate_ptt', pttDate, fk_ptt),
        Sensor_Db_Base.__table_args__
    )


class Rfid(Sensor_Db_Base):
    __tablename__ = 'T_rfid'
    ID = Column(Integer, Sequence('seq_rfid_pk_id'), primary_key=True)
    creator = Column(Integer)
    FK_Sensor = Column(Integer, nullable=False)
    chip_code = Column(String(15), nullable=False)
    date_ = Column(DateTime, nullable=False)
    creation_date = Column(DateTime, server_default=func.now())
    validated = Column('validated', Boolean, server_default='0')
    checked = Column('checked', Boolean, server_default='0')
    frequency = Column(Integer)
    FK_Import = Column('FK_Import', Integer, ForeignKey('Import.ID'))
    ImportedFile = relationship('Import', back_populates='RFIDrawDatas')

    @hybrid_property
    def date(self):
        return self.date_

    __table_args__ = (
        Index('idx_Trfid_chipcode_date', chip_code, date_),
        UniqueConstraint(FK_Sensor, chip_code, date_),
        Sensor_Db_Base.__table_args__
    )


class CamTrap(Sensor_Db_Base, ORMUtils):
    __tablename__ = 'TcameraTrap'
    pk_id = Column(Integer, Sequence('seq_camtrap_pk_id'), primary_key=True)
    fk_sensor = Column(Integer, nullable=False)
    path = Column(String(250), nullable=False)
    name = Column(String(250), nullable=False)
    extension = Column(String(250), nullable=False)
    checked = Column(Boolean, nullable=True)
    validated = Column(Integer, nullable=True)
    date_creation = Column(DateTime, nullable=True)
    date_uploaded = Column(DateTime, server_default=func.now())
    tags = Column(String, nullable=True)
    note = Column(Integer, nullable=False)
    stationId = Column(Integer, nullable= True)
    processed = Column(Integer, nullable=False, server_default='0')
    databaseTarget = Column(String(255), nullable=True)
    FK_Import = Column('FK_Import', Integer, ForeignKey('Import.ID'))


class MetaData(Sensor_Db_Base):
    __tablename__ = 'MetaData'
    Id = Column(Integer, Sequence('seq_MetaData_Id'), primary_key=True)
    FK_CamTrap = Column('FK_CamTrap', Integer, ForeignKey('TcameraTrap.pk_id'))
    CommandLine = Column(Unicode(None), nullable=True)
