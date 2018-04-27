from sqlalchemy import Column, Integer, Sequence, String
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy import func
from shapely.wkt import loads
from geojson import Feature

from ecoreleve_server.core import Base
from ecoreleve_server.core.base_types import Geometry


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

