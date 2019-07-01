from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Sequence,
    func
    )
from sqlalchemy.orm import relationship
from ecoreleve_server.ModelDB import MAIN_DB_BASE


class MonitoredSiteType_MonitoredSiteDynProp(MAIN_DB_BASE):

    __tablename__ = 'MonitoredSiteType_MonitoredSiteDynProp'

    ID = Column(Integer,
                Sequence('MonitoredSiteType_MonitoredSiteDynProp__id_seq'),
                primary_key=True)
    Required = Column(Integer,
                      server_default='0')
    FK_MonitoredSiteType = Column(Integer,
                                  ForeignKey('MonitoredSiteType.ID'),
                                  nullable=False)
    FK_MonitoredSiteDynProp = Column(Integer,
                                     ForeignKey('MonitoredSiteDynProp.ID'),
                                     nullable=False)
                 
