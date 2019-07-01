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
from ecoreleve_server.ModelDB.meta import MAIN_DB_BASE
from sqlalchemy.ext.hybrid import hybrid_property
from .Station_FieldWorker import Station_FieldWorker
from .StationDynPropValue import StationDynPropValue

from sqlalchemy.orm.collections import attribute_mapped_collection
from sqlalchemy.ext.associationproxy import association_proxy


class Station(MAIN_DB_BASE):

    __tablename__ = 'Station'

    ID = Column(Integer, Sequence('Stations__id_seq'), primary_key=True)
    StationDate = Column(DateTime, index=True, nullable=False)
    Name = Column(String(250), nullable=True)
    LAT = Column(Numeric(9, 5), nullable=True)
    LON = Column(Numeric(9, 5), nullable=True)
    ELE = Column(Integer, nullable=True)
    precision = Column(Integer, nullable=True)
    creator = Column(Integer, nullable=True)
    creationDate = Column(DateTime, default=func.now(), nullable=True)
    original_id = Column(String(250), nullable=True)
    Comments = Column(String(250), nullable=True)
    Place = Column(String(250), nullable=True)

    fieldActivityId = Column(Integer, ForeignKey(
        'fieldActivity.ID'), nullable=True) #TODO rename to fk_fiekdActivity
    FK_StationType = Column(Integer, ForeignKey('StationType.ID'), nullable=False)
    FK_MonitoredSite = Column(Integer, ForeignKey(
        'MonitoredSite.ID'), nullable=True)
    FK_Region = Column(Integer, ForeignKey('Region.ID'), nullable=True)
    FK_FieldworkArea = Column(Integer, nullable=True)
    FK_AdministrativeArea = Column(Integer, nullable=True)
    FK_GridCell = Column(Integer, nullable=True)

    Schema = relationship('StationType')


    # Observations = relationship(
    #     'Observation', back_populates='Station', cascade="all, delete-orphan")
    # # FK_Region = Column(Integer, ForeignKey('Region.ID'), nullable=True)
    # FK_FieldworkArea = Column(Integer, ForeignKey('FieldworkArea.ID'),
    #                           nullable=True)

    # Station_FieldWorkers = relationship(
    #     'Station_FieldWorker', backref='Station', cascade="all, delete-orphan")

    # MediasFiles = relationship(
    #     'MediasFiles', back_populates='Station', cascade="all, delete-orphan")

    dynPropsValues = relationship("StationDynPropValue", 
                            back_populates="station")

    # _proxied = association_proxy(
    #     "dynProps",
    #     "value",
    #     creator=lambda key, value: StationDynPropValue(ID=key,
    #                                                    ValueString=value),
    # )

    # ''' hybrid property on relationship '''
    # @hybrid_property
    # def FieldWorkers(self):
    #     if self.Station_FieldWorkers:
    #         fws = []
    #         for curFW in self.Station_FieldWorkers:
    #             fws.append(
    #                 {'FieldWorker': curFW.FK_FieldWorker, 'ID': curFW.ID})
    #         return fws
    #     else:
    #         return []

    # ''' Configure a setter for this hybrid property '''
    # @FieldWorkers.setter
    # def FieldWorkers(self, values):
    #     fws = []
    #     if len(values) != 0:
    #         for item in values:
    #             if 'ID' in item and item['ID']:

    #                 curFW = list(filter(lambda x: x.ID == item[
    #                              'ID'], self.Station_FieldWorkers))[0]
    #                 curFW.FK_FieldWorker = int(item['FieldWorker'])
    #             else:
    #                 curFW = Station_FieldWorker(FK_FieldWorker=int(
    #                     item['FieldWorker']), FK_Station=self.ID)
    #             fws.append(curFW)
    #     self.Station_FieldWorkers = fws

    # @FieldWorkers.expression
    # def FieldWorkers(self):
    #     return Station_FieldWorker.id

