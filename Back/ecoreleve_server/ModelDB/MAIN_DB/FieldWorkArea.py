from sqlalchemy import (
    Column,
    Integer,
    Sequence,
    String,
    func
)
from shapely.wkt import loads
from geojson import Feature
from ecoreleve_server.core.base_types import Geometry
from ecoreleve_server.ModelDB import MAIN_DB
from sqlalchemy.ext.hybrid import hybrid_property


class FieldworkArea(MAIN_DB):

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
    def geom_WKT(self):
        return func.geo.wkt(self.valid_geom)

    @geom_WKT.setter
    def geom_WKT(self):
        return func.geo.wkt(self.valid_geom)

    @hybrid_property
    def geom_json(self):
        return Feature(
            id=self.ID,
            geometry=loads(self.valid_geom) if self.valid_geom else None,
            properties={'FieldworkArea': self.fullpath,
                        'Country': self.Country,
                        'Working_area': self.Working_Area,
                        'Working_region': self.Working_Region,
                        'Management_unit': self.Management_Unit,
                        'name': self.Name
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
