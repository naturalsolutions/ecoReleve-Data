from sqlalchemy import Column, Integer, Sequence, String
from sqlalchemy import func
from sqlalchemy.ext.hybrid import hybrid_property
from geojson import Feature
from ecoreleve_server.core.base_types import Geometry
from ecoreleve_server.ModelDB import MAIN_DB
from shapely.wkt import loads


class Region(MAIN_DB):

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
    def geom_WKT(self):
        return func.geo.wkt(self.valid_geom)

    @geom_WKT.setter
    def geom_WKT(self):
        return func.geo.wkt(self.valid_geom)

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
