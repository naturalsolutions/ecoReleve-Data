from datetime import datetime
from sqlalchemy import types
from sqlalchemy.sql.functions import GenericFunction
from sqlalchemy.types import UserDefinedType
from sqlalchemy import String, func
from sqlalchemy.ext.compiler import compiles


class IntegerDateTime(types.TypeDecorator):
    """Used for working with epoch timestamps.

    Converts datetimes into epoch on the way in.
    Converts epoch datetimes to timestamps on the way out.
    """
    impl = types.DateTime
    def process_bind_param(self, value, dialect):
        return value.timetuple()
    def process_result_value(self, value, dialect):
        return value.timestamp()


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