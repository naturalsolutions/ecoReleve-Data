from sqlalchemy import (
    Column,
    Float,
    Integer,
    Numeric,
    Sequence, 
    String,
    Unicode

)
from sqlalchemy import func
from sqlalchemy.ext.hybrid import hybrid_property
from ecoreleve_server.core.base_types import Geometry
from shapely.wkt import loads
from geojson import Feature
from ecoreleve_server.ModelDB import MAIN_DB_BASE


class GeomaticLayer(MAIN_DB_BASE):

    __tablename__ = 'GeomaticLayer'
    ID = Column(Integer, Sequence('GeomaticLayer__id_seq'), primary_key=True)
    Name = Column(Unicode(255), nullable=True)
    max_lat = Column(Numeric(9, 5), nullable=True)
    min_lat = Column(Numeric(9, 5), nullable=True)
    max_lon = Column(Numeric(9, 5), nullable=True)
    min_lon = Column(Numeric(9, 5), nullable=True)
    SHAPE_Leng = Column(Float, nullable=True)
    SHAPE_Area = Column(Float, nullable=True)
    geom = Column(Geometry, nullable=True)
    type_ = Column(String(25), nullable=True)

    @hybrid_property
    def geom_WKT(self):
        return func.geo.wkt(self.geom)

    @geom_WKT.expression
    def geom_WKT(self):
        return func.geo.wkt(self.geom)

    @geom_WKT.setter
    def geom_WKT(self):
        return func.geo.wkt(self.geom)

    @hybrid_property
    def geom_json(self):
        return Feature(
            id=self.ID,
            geometry=loads(self.geom),
            properties={"name": self.Name}
        )