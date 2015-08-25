from ecoreleve_server.Models import Base,DBSession
from sqlalchemy import Column, DateTime, Float,Boolean, ForeignKey, Index, Integer, Numeric, String, Text, Unicode, text,Sequence,orm,and_,text,select
from sqlalchemy.dialects.mssql.base import BIT
from sqlalchemy.orm import relationship

FieldSizeToClass = {0:'col-md-3',1:'col-md-6',2:'col-md-12'}

def isRenderable (int_Render) :
        return int(int_Render) > 0 

def isEditable (int_Render) :
    edit = int(int_Render) > 2
    return edit


class FrontModules(Base):
    __tablename__ = 'FrontModules'
    ID =  Column(Integer,Sequence('FrontModule__id_seq'), primary_key=True)
    Name = Column(Unicode(250))
    TypeModule = Column(Unicode(250))
    Comments = Column(String)

    ModuleForms = relationship('ModuleForms',lazy='dynamic',back_populates='FrontModules')
    ModuleGrids = relationship('ModuleGrids',lazy='dynamic',back_populates='FrontModules')

class ModuleForms(Base):
    __tablename__ = 'ModuleForms'
    ID = Column(Integer,Sequence('ModuleForm__id_seq'), primary_key=True)
    Module_ID = Column(Integer, ForeignKey('FrontModules.ID'))
    TypeObj = Column(Unicode(250))
    Name = Column(Unicode(250))
    Label = Column(Unicode(250))
    Required = Column(Integer)
    FieldSizeEdit = Column(Integer)
    FieldSizeDisplay = Column(Integer)
    InputType = Column(Unicode(100))
    editorClass = Column(Unicode(100))
    displayClass = Column(Unicode(150))
    EditClass = Column(Unicode(100))
    FormRender = Column(Integer)
    FormOrder = Column(Integer)
    Legend = Column(Unicode(500))
    Options = Column (String)
    Validators = Column(String)

    FrontModules = relationship("FrontModules", back_populates="ModuleForms")

    @staticmethod
    def GetClassFromSize(FieldSize):
        return FieldSizeToClass[FieldSize]

    def GetDTOFromConf(self,IsEditable,CssClass):

        self.dto = {
            'Name': self.Name,
            'type': self.InputType,
            'title' : self.Label,
            'editable' : IsEditable,
            'editorClass' : str(self.editorClass) ,
            'validators': [],
            'options': []
            }
        self.CssClass = CssClass
        self.IsEditable = IsEditable

        if self.Required == 1 :
            if self.InputType=="Select":
                self.dto['validators'].append("requiredSelect")
            else:
                self.dto['validators'].append("required")
            self.dto['title'] = self.dto['title'] + '*'

            # TODO changer le validateur pour select required (valeur <>-1)
        if isEditable :
            self.dto['fieldClass'] = str(self.EditClass) + ' ' + CssClass
        else :
            self.dto['fieldClass'] = str(self.displayClass) + ' ' + CssClass

            # TODO changer le validateur pour select required (valeur <>-1)

        if self.InputType in self.func_type_context :
            self.func_type_context[self.InputType](self)
        return self.dto

    def InputSelect (self) :
        
        if self.Options != None :
            result = DBSession.execute(text(self.Options)).fetchall()
            for row in result :
                temp = {}
                for key in row.keys() : 
                    temp[key]= row[key]
                self.dto['options'].append(temp)
            self.dto['options'] = sorted(self.dto['options'], key=lambda k: k['label'])

    def InputLNM(self) :
        if self.Options != None :
            result = DBSession.query(ModuleForms).filter(and_(ModuleForms.TypeObj == self.Options , ModuleForms.Module_ID == self.Module_ID)).all()
            subNameObj = result[0].Name
            
            subschema = {}
            for conf in result :
                subschema[conf.Name] = conf.GetDTOFromConf(self.IsEditable,self.CssClass)

            self.dto = {
            'Name': self.Name,
            'type': self.InputType,
            'title' : None,
            'editable' : None,
            'editorClass' : str(self.editorClass) ,
            'validators': [],
            'options': [],
            'fieldClass': None,
            'subschema' : subschema
            }

            try :
                subTypeObj = int(self.Options)
                self.dto['defaultValue'] = {'FK_ProtocoleType':subTypeObj}
            except : 
                pass


    def InputThesaurus(self) :
        if self.Options is not None :
            self.dto['options'] = {"startId":self.Options,"wsUrl":"http://192.168.1.199/ThesaurusCore","lng":"fr"}

    func_type_context = {
        'Select': InputSelect,
        'ListOfNestedModel' : InputLNM,
        'AutocompTreeEditor' : InputThesaurus
        }


class ModuleGrids (Base) :
    __tablename__ = 'ModuleGrids'

    ID = Column(Integer,Sequence('ModuleGrid__id_seq'), primary_key=True)
    Module_ID = Column(Integer, ForeignKey('FrontModules.ID'))
    TypeObj =  Column(Integer)
    Name = Column(String)
    Label = Column(String)
    GridRender = Column(Integer)
    GridSize = Column(Integer)
    CellType = Column(String)
    GridOrder = Column(Integer)
    QueryName = Column(String)
    Options = Column (String)
    FilterOrder = Column (Integer)
    FilterSize = Column (Integer)
    IsSearchable = Column(BIT)
    FilterDefaultValue = Column (String)
    FilterRender = Column (Integer)
    FilterType = Column (String)
    FilterClass = Column (String)

    FrontModules = relationship("FrontModules", back_populates="ModuleGrids")
    
    def FKName (self):

        if self.QueryName is None : 
            return self.Name 
        else : 
            return self.QueryName

    def GenerateColumn (self):
        column = {
        'name' :self.FKName(),
        'label' : self.Label,
        'renderable': isRenderable(self.GridRender),
        'editable': isEditable(self.GridRender),
        'cell' : self.CellType,
        }

        if self.CellType == 'select' and 'SELECT' in self.Options :
             result = DBSession.execute(text(self.Options)).fetchall()
             column['optionValues'] = [[row['label'],row['val']] for row in result]

        return column

    def GenerateFilter (self) :
        print('Filter : '+str(self.Name))
        filter_ = {
            'name' : self.Name,
            'type' : self.FilterType,
            'label' : self.Label,
            'editable' : isEditable(int(self.FilterRender)),
            # 'editorClass' : str(self.FilterClass) ,
            'validators': [],
            'options': [],
            }
        if (self.FilterClass) : 
            filter_['fieldClass'] = self.FilterClass+ ' ' + FieldSizeToClass[self.FilterSize] 
        else :  
            filter_['fieldClass'] = FieldSizeToClass[self.FilterSize],

        if self.FilterType == 'Select' and self.Options != None : 
            result = DBSession.execute(text(self.Options)).fetchall()
            filter_['options'] = [{'label':row['label'],'val':row['val']} for row in result]
        return filter_
