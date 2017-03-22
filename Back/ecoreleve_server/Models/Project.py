from ..Models import Base
from ..GenericObjets.DataBaseObjects import ConfiguredDbObjectMapped, DbObject
from sqlalchemy import Column, Integer, Sequence, String, orm, DateTime,  func,ForeignKey


class Project(Base, ConfiguredDbObjectMapped, DbObject):

    __tablename__ = 'Project'

    moduleFormName = 'ProjectForm'
    moduleGridName = 'ProjectGrid'

    ID = Column(Integer, Sequence('Region__id_seq'), primary_key=True)
    Name = Column(String(250))
    Project_reference = Column(String(250))
    #Customer_ref = Column(String(250))
    Description = Column(String(250))
    Creation_Date = Column(DateTime, default=func.now())
    #FK_Customer = Column(Integer, ForeignKey('Customer.ID'), nullable=True)
    creator = creator = Column(Integer)
    #Geometry = 

    def __init__(self, **kwargs):
        Base.__init__(self, **kwargs)
        DbObject.__init__(self)

