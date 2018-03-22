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


class GeomaticLayer(Base):

    __tablename__ = 'GeomaticLayer'
    ID = Column(Integer, Sequence('GeomaticLayer__id_seq'), primary_key=True)
    Name = Column(String(255))
    geom = Column(Geometry)
    type_ = Column(String(25))

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
            id=self.ID,
            geometry=loads(self.geom),
            properties={"name": self.Name}
        )


class Region(Base):

    __tablename__ = 'Region'
    ID = Column(Integer, Sequence(
        'Region__id_seq'), primary_key=True)
    fullpath = Column(String(255))
    Country = Column(String(255))
    Area = Column(String(255))
    Region = Column(String(255))
    Subregion = Column(String(255))
    geom = Column(Geometry)
    valid_geom = Column(Geometry)

    @hybrid_property
    def geom_WKT(self):
        return func.geo.wkt(self.valid_geom)

    @geom_WKT.expression
    def geom_WKT(cls):
        return func.geo.wkt(cls.valid_geom)

    @geom_WKT.setter
    def geom_WKT(cls):
        return func.geo.wkt(cls.valid_geom)

    @hybrid_property
    def geom_json(self):
        return Feature(
            id=self.ID,
            geometry=loads(self.valid_geom),
            properties={'fullpath': self.fullpath,
                        'Country': self.Country,
                        'W_Area': self.Area,
                        'W_Region': self.Region,
                        'Mgmt_Unit': self.Subregion
                        }
        )


class FieldworkArea(Base):

    __tablename__ = 'FieldworkArea'
    ID = Column(Integer, Sequence(
        'FieldworkArea__id_seq'), primary_key=True)
    Country = Column(String(255))
    Working_Area = Column(String(255))
    Working_Region = Column(String(255))
    Management_Unit = Column(String(255))
    Name = Column(String(255))
    type_ = Column(String(50))
    fullpath = Column(String(255))
    valid_geom = Column(Geometry)
    geom = Column(Geometry)

    @hybrid_property
    def geom_WKT(self):
        return func.geo.wkt(self.valid_geom)

    @geom_WKT.expression
    def geom_WKT(cls):
        return func.geo.wkt(cls.valid_geom)

    @geom_WKT.setter
    def geom_WKT(cls):
        return func.geo.wkt(cls.valid_geom)

    @hybrid_property
    def geom_json(self):
        return Feature(
            id=self.ID,
            geometry=loads(self.valid_geom),
            properties={'FieldworkArea': self.fullpath,
                        'Country': self.Country,
                        'Working_area': self.Working_Area,
                        'Working_region': self.Working_Region,
                        'Management_unit': self.Management_Unit
                        }
        )

    @hybrid_property
    def json(self):
        return {'FieldworkArea': self.fullpath,
                'Country': self.Country,
                'Working_area': self.Working_Area,
                'Working_region': self.Working_Region,
                'Management_unit': self.Management_Unit,
                'Name': self.Name
                }

