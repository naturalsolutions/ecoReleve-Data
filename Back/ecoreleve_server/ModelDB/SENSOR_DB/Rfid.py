from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    func,
    Integer,
    Index,
    Sequence,
    String,
    UniqueConstraint
)
from sqlalchemy.orm import relationship
from sqlalchemy.ext.hybrid import hybrid_property
from ecoreleve_server.ModelDB.meta import SENSOR_DB


class Rfid(SENSOR_DB):
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
    )
