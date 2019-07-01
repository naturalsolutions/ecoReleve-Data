from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Integer,
    String,
    Sequence
    )

from ecoreleve_server.ModelDB import MAIN_DB_BASE


class MonitoredSite (MAIN_DB_BASE):

    __tablename__ = 'MonitoredSite'
    moduleFormName = 'MonitoredSiteForm'
    moduleGridName = 'MonitoredSiteGrid'

    ID = Column(Integer, Sequence('MonitoredSite__id_seq'), primary_key=True)
    Name = Column(Unicode(255), nullable=False)
    Category = Column(Unicode(255), nullable=False)
    Creator = Column(Integer, nullable=False)
    Active = Column(Boolean, nullable=False, default=1)
    creationDate = Column(DateTime, nullable=False, default=func.now())
    OldID = Column(Integer, nullable=False)
    FK_MonitoredSiteType = Column(Integer, ForeignKey('MonitoredSiteType.ID'), nullable=True)
    Original_ID = Column(String(100), nullable=True)
    Place = Column(String(250), nullable=True)
