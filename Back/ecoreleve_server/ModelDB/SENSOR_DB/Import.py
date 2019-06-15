from sqlalchemy import (
    Column,
    DateTime,
    func,
    Integer,
    String
    )
from sqlalchemy.orm import relationship
from sqlalchemy.ext.hybrid import hybrid_property
from ecoreleve_server.ModelDB import SENSOR_DB


class Import(SENSOR_DB):
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
    GPXrawDatas = relationship('GPX',
                               back_populates='ImportedFile')
    ArgosGPSRawDatas = relationship('ArgosGps',
                                    back_populates='ImportedFile')
    ArgosEngRawDatas = relationship('ArgosEngineering',
                                    back_populates='ImportedFile')
    RFIDrawDatas = relationship('Rfid',
                                back_populates='ImportedFile')
    GSMrawDatas = relationship('Gsm',
                               back_populates='ImportedFile')
    GSMengRawDatas = relationship('GsmEngineering',
                                  back_populates='ImportedFile')

    @hybrid_property
    def relatedDatas(self):
        dictType = {
            'GPX': self.GPXrawDatas,
            'Argos': self.ArgosGPSRawDatas,
            'GSM': self.GSMrawDatas,
            'RFID': self.RFIDrawDatas
        }
        return dictType.get(self.ImportType)
