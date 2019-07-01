from sqlalchemy import (
    Boolean,
    Column,
    Datetime,
    Float,
    Integer,
    Sequence,
    Unicode
    )

from ecoreleve_server.ModelDB import MAIN_DB_BASE


class MonitoredSiteDynPropValue (MAIN_DB_BASE):

    __tablename__ = 'MonitoredSiteDynPropValue'


    ID = Column(Integer, Sequence('MonitoredSiteDynPropValue__id_seq'), primary_key=True)
    StartDate = Column(DateTime,
                       nullable=False)
    ValueInt = Column(Integer,
                      nullable=True)
    ValueString = Column(Unicode(255),
                         nullable=True)
    ValueDate = Column(DateTime,
                       nullable=True)
    ValueFloat = Column(Float,
                        nullable=True)
    FK_MonitoredSiteDynProp = Column(Integer,
                               ForeignKey('MonitoredSiteDynProp.ID'),
                               nullable=False)
    FK_MonitoredSite = Column(Integer,
                        ForeignKey('MonitoredSite.ID'),
                        nullable=False)
