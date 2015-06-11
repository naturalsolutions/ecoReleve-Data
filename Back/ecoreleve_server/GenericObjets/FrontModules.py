from ecoreleve_server.Models import Base,DBSession
from sqlalchemy import Column, DateTime, Float,Boolean, ForeignKey, Index, Integer, Numeric, String, Text, Unicode, text,Sequence,orm,and_,text
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
    # ModuleGrids = relationship('ModuleGrid',lazy='dynamic',back_populates='FrontModule')

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
    GridOrder = Column(Integer)
    GridDisplay = Column(Boolean)
    GridEditable = Column(Boolean)
    GridCell = Column(String)
    FilterOrder = Column(Integer)


    FrontModule = relationship("FrontModule", back_populates="ModuleFields")

    def GetMachin(self):
        return "machin"
        
    @staticmethod
    def GetClassFromSize(FieldSize):
        return FieldSizeToClass[FieldSize]


    def GenerateFilter (self) :

        filter_ = {
        'name' : self.Name,
        'type' : self.InputType,
        'label' : self.LabelFr
        }

        if self.InputType == 'Select' and self.QueryName != None : 
            result = DBSession.execute(text(self.QueryName)).fetchall()
            filter_['optionValues'] = [{row['label']:row['val']} for row in result]
            # filter_['optionValues'].sort(key=lambda k: k.key)
        return filter_

    def GetDTOFromConf(self,IsEditable,CssClass):

        dto = {
            'Name': self.Name,
            'type': self.InputType,
            'title' : self.LabelFr,
            'editable' : IsEditable,
            'editorClass' : str(self.editorClass) ,
            'fieldClass' : str(self.fieldClass) + ' ' + CssClass,
            'validators': [],
            'options': [],
            }
        if self.InputType == 'Select' and self.QueryName != None : 
            result = DBSession.execute(text(self.QueryName)).fetchall()

            for row in result :
                temp = {}
                for key in row.keys() : 
                    temp[key]= row[key]
                dto['options'].append(temp)
            dto['options'] = sorted(dto['options'], key=lambda k: k['label'])
        if self.Required == 1 :
            dto['validators'].append("required")
        return dto

    def GenerateColumn (self):


        self.column = {
        'name' : self.Name,
        'label' : self.LabelFr,
        'editable' : self.GridEditable,
        'renderable': self.GridDisplay,
        'cell' : self.GridCell,
        }

        if self.GridCell == 'select' and 'SELECT' in self.QueryName :
             result = DBSession.execute(text(self.QueryName)).fetchall()
             self.column['optionValues'] = [[row['label'],row['val']] for row in result]

        return self.column


class ModuleGrid (Base) :
    __tablename__ = 'ModuleGrid'

    ID = Column(Integer,Sequence('ModuleGrid__id_seq'), primary_key=True)
    FK_FrontModule = Column(Integer, ForeignKey('FrontModule.ID'))
    Name = Column(String)
    Label = Column(String)
    Display = Column(Boolean)
    FieldSize = Column(Integer)
    Cell = Column(String)
    Editable = Column(Boolean)
    FieldOrder = Column(Integer)
    QueryName = Column(String)
    FK_TypeObj =  Column(Integer)

    # ObjNature = relationship("FrontModule", back_populates="ModuleGrid")

    def GenerateColumn (self):


        self.column = {
        'name' : self.Name,
        'label' : self.Label,
        'editable' : self.Editable,
        'renderable': self.Display,
        'cell' : self.Cell,
        }



        if self.Cell == 'select' and 'SELECT' in self.QueryName :
             result = DBSession.execute(text(self.QueryName)).fetchall()
             self.column['optionValues'] = [[row['name'],row['val']] for row in result]

        return self.column


# class ObjNature (Base) :
#     __tablename__ : 'ObjNature'

#     ID = Column(Integer,Sequence('ObjNature__id_seq'), primary_key=True)
#     Name = Column(String)

#     ModuleGrids = relationship('ModuleGrids',lazy='dynamic',back_populates='ObjNature')
