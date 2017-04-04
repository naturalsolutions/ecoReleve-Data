from ..Models import Base
from ..GenericObjets.ObjectWithDynProp import ObjectWithDynProp
from ..GenericObjets.ObjectTypeWithDynProp import ObjectTypeWithDynProp
from sqlalchemy import Column, Integer, Sequence, Numeric, String, orm, DateTime, Unicode, func,ForeignKey
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.orm import relationship

class Project(Base, ObjectWithDynProp):

    __tablename__ = 'Project'

    moduleFormName = 'ProjectForm'
    moduleGridName = 'ProjectGrid'

    ID = Column(Integer, Sequence('Region__id_seq'), primary_key=True)
    Name = Column(String(250))
    Project_reference = Column(String(250))
    FK_ProjectType = Column(Integer, ForeignKey('ProjectType.ID'), default=1)
    #Customer_ref = Column(String(250))
    Description = Column(String(250))
    Creation_Date = Column(DateTime, default=func.now())
    #FK_Customer = Column(Integer, ForeignKey('Customer.ID'), nullable=True)
    creator = creator = Column(Integer)
    #Geometry = 

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        ObjectWithDynProp.__init__(self)

    def GetNewValue(self, nameProp):
        ReturnedValue = ProjectDynPropValue()
        try:
            ReturnedValue.FK_ProjectDynProp = self.session.execute(
                select([ProjectDynProp.ID]).where(ProjectDynProp.Name == nameProp)).scalar()
        except:
            print_exc()
        return ReturnedValue

    def GetDynPropValues(self):
        return self.ProjectDynPropValues

    def GetDynProps(self, nameProp):
        return self.session.query(ProjectDynProp).filter(ProjectDynProp.Name == nameProp).one()

    def GetType(self):
        if self.ProjectType is not None:
            return self.ProjectType
        else:
            return self.session.query(ProjectType).get(self.FK_ProjectType)

class ProjectDynProp(Base):

    __tablename__ = 'ProjectDynProp'

    ID = Column(Integer, Sequence('ProjectDynProp__id_seq'), primary_key=True)
    Name = Column(Unicode(250), nullable=False)
    TypeProp = Column(Unicode(250), nullable=False)
    ProjectType_ProjectDynProps = relationship(
        'ProjectType_ProjectDynProp', backref='ProjectDynProp')
    ProjectDynPropValues = relationship(
        'ProjectDynPropValue', backref='ProjectDynProp')


class ProjectDynPropValue(Base):

    __tablename__ = 'ProjectDynPropValue'

    ID = Column(Integer, Sequence(
        'ProjectDynPropValue__id_seq'), primary_key=True)
    StartDate = Column(DateTime, nullable=False)
    ValueInt = Column(Integer)
    ValueString = Column(String(250))
    ValueDate = Column(DateTime)
    ValueFloat = Column(Numeric(12, 5))
    FK_ProjectDynProp = Column(Integer, ForeignKey('ProjectDynProp.ID'))
    FK_Project = Column(Integer, ForeignKey('Project.ID'))


class ProjectType(Base, ObjectTypeWithDynProp):

    @orm.reconstructor
    def init_on_load(self):
        ObjectTypeWithDynProp.__init__(self)

    __tablename__ = 'ProjectType'

    ID = Column(Integer, Sequence('ProjectType__id_seq'), primary_key=True)
    Name = Column(Unicode(250))
    Status = Column(Integer)
    ProjectType_ProjectDynProp = relationship(
        'ProjectType_ProjectDynProp', backref='ProjectType')
    Projects = relationship('Project', backref='ProjectType')


class ProjectType_ProjectDynProp(Base):

    __tablename__ = 'ProjectType_ProjectDynProp'

    ID = Column(Integer, Sequence(
        'ProjectType_ProjectDynProp__id_seq'), primary_key=True)
    Required = Column(Integer, nullable=False)
    FK_ProjectType = Column(Integer, ForeignKey('ProjectType.ID'))
    FK_ProjectDynProp = Column(Integer, ForeignKey('ProjectDynProp.ID'))
