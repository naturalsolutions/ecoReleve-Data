from ecoreleve_server.Models import Base,DBSession
from sqlalchemy import Column, DateTime, Float, ForeignKey, Index, Integer, Numeric, String, Text, Unicode, text,Sequence,orm,and_
from sqlalchemy.dialects.mssql.base import BIT
from sqlalchemy.orm import relationship

FieldSizeToClass = {0:'col-md-3',1:'col-md-6',2:'col-md-12'}


class FrontModule(Base):
    __tablename__ = 'FrontModule'
    ID =  Column(Integer,Sequence('FrontModule__id_seq'), primary_key=True)
    Name = Column(Unicode(250))
    TypeObj = Column(Integer)
    Legends = Column(Unicode(2500))
    ModuleFields = relationship('ModuleField',lazy='dynamic',back_populates='FrontModule')


class ModuleField(Base):
    __tablename__ = 'ModuleField'
    ID = Column(Integer,Sequence('ModuleField__id_seq'), primary_key=True)
    FK_FrontModule = Column(Integer, ForeignKey('FrontModule.ID'))
    TypeObj = Column(Unicode(250))
    Name = Column(Unicode(250))
    LabelFr = Column(Unicode(250))
    Required = Column(Integer)
    FieldSize = Column(Integer)
    InputType = Column(Unicode(100))
    editorClass = Column(Unicode(100))
    fieldClass = Column(Unicode(100))
    FormRender = Column(Integer)
    FormOrder = Column(Integer)
    QueryName = Column(Unicode(500))
    IsSearchable = Column(Integer)
    Legend = Column(Unicode(500))
    FrontModule = relationship("FrontModule", back_populates="ModuleFields")

    def GetMachin(self):
        return "machin"
        
    @staticmethod
    def GetClassFromSize(FieldSize):
        return FieldSizeToClass[FieldSize]

    def GetDTOFromConf(self,IsEditable,CssClass):    
        print(self.InputType)
        return {
            'Name': self.Name,
            'type': self.InputType,
            'title' : self.LabelFr,
            'editable' : IsEditable,
            'editorClass' : str(self.editorClass) ,
            'fieldClass' : str(self.fieldClass) + ' ' + CssClass
            }     