from sqlalchemy import Column, Integer, Sequence, String
from sqlalchemy import func
from sqlalchemy.ext.hybrid import hybrid_property
from ecoreleve_server.core.base_types import Geometry
from shapely.wkt import loads
from geojson import Feature
from ecoreleve_server.ModelDB import MAIN_DB


class GeomaticLayer(MAIN_DB):

    __tablename__ = 'GeomaticLayer'
    ID = Column(Integer, Sequence('GeomaticLayer__id_seq'), primary_key=True)
    Name = Column(String(255))
    geom = Column(Geometry)
    type_ = Column(String(25))

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