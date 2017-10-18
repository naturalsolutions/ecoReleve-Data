from ..Models import Base
from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Boolean,
    Integer,
    Numeric,
    String,
    Sequence,
    orm,
    and_,
    func,
    desc,
    select)

from sqlalchemy.orm import relationship
from datetime import datetime
from ..utils.parseValue import isEqual, formatValue, parser
from ..utils.datetime import parse
from ..GenericObjets.OrmModelsMixin import HasDynamicProperties, GenericType
from ..utils.geoalchemy import GeometryColumn, Geometry, WKTSpatialElement, Polygon


class Project (HasDynamicProperties, Base):

    __tablename__ = 'Project'
    moduleFormName = 'ProjectForm'
    moduleGridName = 'ProjectGrid'

    ID = Column(Integer, Sequence('Project__id_seq'), primary_key=True)
    Name = Column(String(250), nullable=False)
    Active = Column(Boolean, nullable=False, default=True)
    creationDate = Column(DateTime, nullable=False, default=func.now())
    FK_Client = Column(Integer, ForeignKey('Client.ID'), nullable=False)
    Project_reference = Column(String(250), nullable=False)
    # area = GeometryColumn(Polygon(2))

    Stations = relationship(
        'Station', back_populates='Project', cascade="all, delete-orphan")

    Client = relationship('Client')
