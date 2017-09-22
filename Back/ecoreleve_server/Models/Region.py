from ..Models import Base
from sqlalchemy import Column, Integer, Sequence, String
# from geoalchemy.geometry import Geometry, GeometryColumn, func
from sqlalchemy.sql.functions import GenericFunction
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.ext.compiler import compiles
from sqlalchemy import func
from sqlalchemy.types import UserDefinedType

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
    return "%s.STAsText()" % compiler.process(element.clauses)


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
    Country = Column(String(250))
    Region = Column(String(250))
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


def getGeomRegion(session) :
    import binascii
    from shapely.wkt import loads
    from geojson import Feature, FeatureCollection, dumps

    results = session.query(Region).filter(Region.Region.like('%'+'stan'))

    geomFeatures = []
    for geom in results :
        wkt = geom.valid_geom
        geometry = loads(wkt)
        feature = Feature(
            id=geom.ID,
            geometry=geometry,
            properties={
                "name": geom.Region,
                })
        geomFeatures.append(feature)

    return geomFeatures
