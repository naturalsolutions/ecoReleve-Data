from sqlalchemy import (
    Column,
    Float,
    Integer,
    Numeric,
    Sequence,
    String,
    func
)
from shapely.wkt import loads
from geojson import Feature
from ecoreleve_server.core.base_types import Geometry
from ecoreleve_server.ModelDB import MAIN_DB_BASE
from sqlalchemy.ext.hybrid import hybrid_property


class FieldworkArea(MAIN_DB_BASE):

    __tablename__ = 'FieldworkArea'

    ID = Column(Integer, Sequence(
        'FieldworkArea__id_seq'), primary_key=True)
    Country = Column(String(255), nullable=True)
    Working_Area = Column(String(255), nullable=True)
    Working_Region = Column(String(255), nullable=True)
    Management_Unit = Column(String(255), nullable=True)
    Name = Column(String(255), nullable=True)
    fullpath = Column(String(255), nullable=True)
    type_ = Column(String(50), nullable=True)
    max_lat = Column(Numeric(9, 5), nullable=True)
    min_lat = Column(Numeric(9, 5), nullable=True)
    max_lon = Column(Numeric(9, 5), nullable=True)
    min_lon = Column(Numeric(9, 5), nullable=True)
    SHAPE_Leng = Column(Float, nullable=True)
    SHAPE_Area = Column(Float, nullable=True)
    valid_geom = Column(Geometry, nullable=True)
    geom = Column(Geometry, nullable=True)

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
