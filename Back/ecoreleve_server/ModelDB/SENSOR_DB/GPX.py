from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String
)
from sqlalchemy.orm import relationship
from sqlalchemy.ext.hybrid import hybrid_property
from ecoreleve_server.ModelDB.meta import SENSOR_DB


class GPX(SENSOR_DB):
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
