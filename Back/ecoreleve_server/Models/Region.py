from ..Models import Base
from sqlalchemy import Column, Integer, Sequence, String
# from geoalchemy.geometry import Geometry, GeometryColumn, func
from sqlalchemy.sql.functions import GenericFunction
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.ext.compiler import compiles
from sqlalchemy import func
from sqlalchemy.types import UserDefinedType
from shapely.wkt import loads
from geojson import Feature, FeatureCollection, dumps


class GeoWKT(GenericFunction):
    type = String
    package = "geo"
    name = "STAsText"
    identifier = "wkt"


@compiles(GeoWKT, 'mssql')
def compile(element, compiler, **kw):
    return "%s.STAsText()" % compiler.process(element.clauses)


class WKTSpatialElement(GenericFunction):
    # def __init__(self,geoType = 'POLYGON',srid = 4326)
    type = String
    package = "geo"
    name = "geometry::STGeomFromText"
    identifier = "wkt_from_text"


@compiles(WKTSpatialElement, 'mssql')
def compile(element, compiler, **kw):
    return "geometry::STGeomFromText(%s)" % compiler.process(element.clauses)


class Geometry(UserDefinedType):
    def get_col_spec(self):
        return "GEOMETRY"

    def bind_expression(self, bindvalue):
        return func.geo.wkt_from_text(bindvalue, type_=self)

    def column_expression(self, col):
        return func.geo.wkt(col, type_=self)


class Region(Base):

    __tablename__ = 'Region'
    ID = Column(Integer, Sequence('Region__id_seq'), primary_key=True)
    Region = Column(String(255))
    geom = Column(Geometry)
    type_ = Column(String(25))

    @hybrid_property
    def geom_WKT(self):
        return func.geo.wkt(self.geom)

    # @hybrid_property
    # def Region(self):
    #     return self.Name

    # @Region.setter
    # def Region(self, value):
    #     self.Name = value

    # @Region.expression
    # def Region(cls):
    #     return cls.Name

    @geom_WKT.expression
    def geom_WKT(cls):
        return func.geo.wkt(cls.geom)

    @geom_WKT.setter
    def geom_WKT(cls):
        return func.geo.wkt(cls.geom)

    @hybrid_property
    def geom_json(self):
        return Feature(
            id=self.ID,
            geometry=loads(self.geom),
            properties={"name": self.Region, }
        )


class Ctry_WArea_WRegion_MgmtU(Base):

    __tablename__ = 'Ctry_WArea_WRegion_MgmtU'
    PK_ID = Column(Integer, Sequence(
        'Ctry_WArea_WRegion_MgmtU__id_seq'), primary_key=True)
    fullpath = Column(String(255))
    geom = Column(Geometry)

    @hybrid_property
    def geom_WKT(self):
        return func.geo.wkt(self.geom)

    @geom_WKT.expression
    def geom_WKT(cls):
        return func.geo.wkt(cls.geom)

    @geom_WKT.setter
    def geom_WKT(cls):
        return func.geo.wkt(cls.geom)

    @hybrid_property
    def geom_json(self):
        return Feature(
            id=self.PK_ID,
            geometry=loads(self.geom),
            properties={"name": self.fullpath, }
        )
