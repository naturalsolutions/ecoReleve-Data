from ..Models import Base, dbConfig
from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Unicode,
    text,
    Sequence,
    orm,
    func,
    select,
    bindparam,
    UniqueConstraint,
    event)
from sqlalchemy.orm import relationship
from sqlalchemy.ext.hybrid import hybrid_property
from ..GenericObjets.DataBaseObjects import ConfiguredDbObjectMapped, DbObject

sensor_schema = dbConfig['sensor_schema']
dialect = dbConfig['dialect']


class Import(Base, DbObject, ConfiguredDbObjectMapped):
    moduleGridName = 'ImportHistoryFilter'

    __tablename__ = 'Import'
    ID = Column(Integer, primary_key=True)
    ImportDate = Column(DateTime, default=func.now())
    ImportFileName = Column(String(250))
    ImportType = Column(String(250), nullable=False)
    FK_User = Column(Integer, nullable=False)
    nbRows = Column(Integer)
    nbInserted = Column(Integer)
    maxDate = Column(DateTime)
    minDate = Column(DateTime)
    
    # TempTable_GUID = Column(String(250), default=None)
    # Status = Column(Integer)
    # ObjectName = Column(String(250))
    # ObjectType = Column(String(250))
    # FK_ImportType = Column(Integer, ForeignKey(
    #     'ImportType.ID'), nullable=False)

    __table_args__ = ({'schema': sensor_schema,
                        'implicit_returning': False
                       })

    GPXrawDatas = relationship('GPX', back_populates='ImportedFile')
    ArgosGPSRawDatas = relationship('ArgosGps', back_populates='ImportedFile')
    ArgosEngRawDatas = relationship('ArgosEngineering', back_populates='ImportedFile')
    RFIDrawDatas = relationship('Rfid', back_populates='ImportedFile')
    GSMrawDatas = relationship('Gsm', back_populates='ImportedFile')
    GSMengRawDatas = relationship('GsmEngineering', back_populates='ImportedFile')

    @hybrid_property
    def relatedDatas(self):
        dictType = {
            'GPX':self.GPXrawDatas,
            'Argos': self.ArgosGPSRawDatas,
            'GSM': self.GSMrawDatas,
            'RFID': self.RFIDrawDatas
        }
        return dictType.get(self.ImportType)

    # @hybrid_property
    # def maxDate(self):
    #     return max(row.date for row in self.relatedDatas)

    # @hybrid_property
    # def minDate(self):
    #     return min(row.date for row in self.relatedDatas)

    # @hybrid_property
    # def nbRow(self):
    #     return len(self.relatedDatas)


# class ImportType(Base):
    
#     __tablename__ = 'ImportType'
#     ID = Column(Integer, primary_key=True)
#     Name = Column(String(250))

#     __table_args__ = ({'schema': sensor_schema,
#                         'implicit_returning': False
#                        })
