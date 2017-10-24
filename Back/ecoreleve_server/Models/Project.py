from ..Models import Base, dbConfig
from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Boolean,
    Integer,
    Numeric,
    String,
    Sequence,
    orm,
    and_,
    func,
    desc,
    select)
import json
from sqlalchemy.orm import relationship
from datetime import datetime
from ..utils.parseValue import isEqual, formatValue, parser
from ..utils.datetime import parse
from ..GenericObjets.OrmModelsMixin import HasDynamicProperties, GenericType
# from ..utils.geoalchemy import GeometryColumn, Geometry, WKTSpatialElement, Polygon
from sqlalchemy.ext.declarative import declared_attr
from geoalchemy2 import Geometry
from shapely import wkt, wkb
from shapely.geometry import shape
import geojson


class Project (HasDynamicProperties, Base):

    __tablename__ = 'Project'
    moduleFormName = 'ProjectForm'
    moduleGridName = 'ProjectGrid'

    ID = Column(Integer, Sequence('Project__id_seq'), primary_key=True)
    Name = Column(String(250), nullable=False)
    Active = Column(Boolean, nullable=False, default=True)
    creationDate = Column(DateTime, nullable=False, default=func.now())
    FK_Client = Column(Integer, ForeignKey('Client.ID'), nullable=False)
    Project_reference = Column(String(250), nullable=False)
    poly = Column(Geometry('POLYGON'))
    # area = GeometryColumn(Polygon(2))

    # @declared_attr
    # def geom(cls):
    #     if dbConfig['cn.dialect'] == 'postgres':
    #         return Column(Geometry)
    #     if 'mssql' in dbConfig['cn.dialect']:
    #         return GeometryColumn(Polygon(2))

    Stations = relationship(
        'Station', back_populates='Project', cascade="all, delete-orphan")

    Client = relationship('Client')

    def convert_geojson_to_wkb(self, geoJson):
        strJson = json.dumps(geoJson)
        g1 = geojson.loads(strJson)
        geom = shape(g1)
        return geom.wkb

    def convert_geojson_to_wkt(self, geoJson):
        strJson = json.dumps(geoJson)
        g1 = geojson.loads(strJson)
        geom = shape(g1)
        return geom.wkt
