from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Sequence,
    Unicode,
    func
    )

from ecoreleve_server.ModelDB.meta import MAIN_DB_BASE

class ModuleGrids(MAIN_DB_BASE):

    __tablename__ = 'ModuleGrids'

    ID = Column(Integer, Sequence('ModuleGrids__id_seq'), primary_key=True)
    module_id = Column(Integer, nullable=True)
    TypeObj = Column(Integer, nullable=True)
    Name = Column(Unicode(255), nullable=True)
    Label = Column(Unicode(255), nullable=True)
    GridRender = Column(Integer, nullable=True)
    GridSize = Column(String(250), nullable=True)
    CellType = Column(Unicode(255), nullable=True)
    GridOrder = Column(Integer, nullable=True)
    QueryName = Column(Unicode(255), nullable=True)
    Options = Column(Unicode(255), nullable=True)
    FilterOrder = Column(Integer, nullable=True)
    FilterSize = Column(Integer, nullable=True)
    FilterClass = Column(String(250), nullable=True)
    IsSearchable = Column(Boolean, nullable=True )
    FilterDefaultValue = Column(String(250), nullable=True)
    FilterRender = Column(Integer, nullable=True)
    FilterType = Column(String(250), nullable=True)
    Status = Column(Integer, nullable=True)
    ColumnParams = Column(String(250), nullable=True)
