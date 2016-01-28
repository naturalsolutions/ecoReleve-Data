from ..Models import Base, dbConfig
from sqlalchemy import Column, DateTime, Float,Boolean, ForeignKey, Index, Integer, Numeric, String, Text, Unicode, text,Sequence,orm,and_,text,select
from sqlalchemy.dialects.mssql.base import BIT
from sqlalchemy.orm import relationship
import json
from pyramid import threadlocal
from traceback import print_exc

FieldSizeToClass = {0:'col-md-3',1:'col-md-6',2:'col-md-12'}

def isRenderable (int_Render) :
        return int(int_Render) > 0 

def isEditable (int_Render) :
    edit = int(int_Render) > 2
    return edit


# ------------------------------------------------------------------------------------------------------------------------- #
class FrontModules(Base):
    __tablename__ = 'FrontModules'
    ID =  Column(Integer,Sequence('FrontModule__id_seq'), primary_key=True)
    Name = Column(Unicode(250))
    TypeModule = Column(Unicode(250))
    Comments = Column(String)

    ModuleForms = relationship('ModuleForms',lazy='dynamic',back_populates='FrontModules')
    ModuleGrids = relationship('ModuleGrids',lazy='dynamic',back_populates='FrontModules')

    def __init__(self):
        self.session = threadlocal.get_current_request().dbsession

    @orm.reconstructor
    def init_on_load(self):
        self.__init__()


# ------------------------------------------------------------------------------------------------------------------------- #
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
    DefaultValue = Column(String)

    FrontModules = relationship("FrontModules", back_populates="ModuleForms")

    def __init__(self):
        self.session = threadlocal.get_current_request().dbsession
    
    @orm.reconstructor
    def init_on_load(self):
        self.__init__()

    @staticmethod
    def GetClassFromSize(FieldSize):
        return FieldSizeToClass[FieldSize]

    def GetDTOFromConf(self,Editable):
        ''' return input field to build form '''

        self.Editable = Editable
        curEditable = self.Editable
        curInputType = self.InputType

        if self.Editable:
            if self.FormRender < 2:
                curEditable = False
                isDisabled = True
            else :
                isDisabled = False
            self.fullPath = False
            curSize = self.FieldSizeEdit
        else :
            curSize = self.FieldSizeDisplay
            self.fullPath = True
            isDisabled = True

            if self.InputType in ['AutocompTreeEditor']:
                curInputType = 'Text'
                self.fullPath = True

        # CssClass = FieldSizeToClass[curSize]
        CssClass = 'col-md-'+str(curSize)

        self.dto = {
            'name': self.Name,
            'type': curInputType,
            'title' : self.Label,
            'editable' : Editable,
            'editorClass' : str(self.editorClass) ,
            'validators': [],
            'options': [],
            'defaultValue' : None,
            'editorAttrs' : {'disabled': isDisabled},
            'fullPath':self.fullPath
            }

        if self.Validators is not None:
            self.dto['validators'] = json.loads(self.Validators)

        if self.Required == 1 :
            if self.InputType=="Select":
                self.dto['validators'].append("required")
            else:
                self.dto['validators'].append("required")
            self.dto['title'] = self.dto['title'] + ' *'

            # TODO changer le validateur pour select required (valeur <>-1)
        if self.Editable :
            self.dto['fieldClass'] = str(self.EditClass) + ' ' + CssClass
        else :
            self.dto['fieldClass'] = str(self.displayClass) + ' ' + CssClass

            # TODO changer le validateur pour select required (valeur <>-1)
        if self.InputType in self.func_type_context :
            self.func_type_context[self.InputType](self)
        # default value
        default  = self.DefaultValue
        if default is not None:
            self.dto['defaultValue'] = default

        return self.dto

    def InputSelect (self) :
        if self.Options is not None and self.Options != '' :
            result = self.session.execute(text(self.Options)).fetchall()
            for row in result :
                temp = {}
                for key in row.keys() : 
                    temp[key]= row[key]
                self.dto['options'].append(temp)
            self.dto['options'] = sorted(self.dto['options'], key=lambda k: k['label'])

    def InputLNM(self) :
        ''' build ListOfNestedModel input type : used for complex protocols and Fieldworkers in station form '''
        if self.Options != None :
            result = self.session.query(ModuleForms).filter(and_(ModuleForms.TypeObj == self.Options , ModuleForms.Module_ID == self.Module_ID)).all()
            subNameObj = result[0].Name
            subschema = {}
            for conf in result :
                subschema[conf.Name] = conf.GetDTOFromConf(self.Editable)

            fields = []
            resultat = []
            Legends = sorted ([(obj.Legend,obj.FormOrder,obj.Name)for obj in result if obj.FormOrder is not None], key = lambda x : x[1])
            # Legend2s = sorted ([(obj.Legend)for obj in result if obj.FormOrder is not None ], key = lambda x : x[1])
            withOutLegends = sorted ([(obj.Legend,obj.FormOrder,obj.Name)for obj in result if obj.FormOrder is not None and obj.Legend is None ], key = lambda x : x[1])

            Unique_Legends = list()
            # Get distinct Fieldset in correct order
            for x in Legends:
                if x[0] not in Unique_Legends:
                    Unique_Legends.append(x[0])
            
            for curLegend in Unique_Legends:
                curFieldSet = {'fields' :[],'legend' : curLegend}
                resultat.append(curFieldSet)

            for curProp in Legends:
                curIndex = Unique_Legends.index(curProp[0])
                resultat[curIndex]['fields'].append(curProp[2])

            self.dto['fieldsets'] = resultat
            self.dto['subschema'] = subschema

            try :
                subTypeObj = int(self.Options)
                self.dto['defaultValue'] = {'FK_ProtocoleType':subTypeObj}
            except : 
                pass

    def InputThesaurus(self) :
        if self.Options is not None and self.Options != '' :
            self.dto['options'] = {'startId': self.Options
            , 'wsUrl':dbConfig['wsThesaurus']['wsUrl']
            , 'lng':threadlocal.get_current_request().authenticated_userid['userlanguage']
            ,'displayValueName': 'valueTranslated'}
            self.dto['options']['startId'] = self.Options

    def InputAutocomplete(self):
        if self.Options is not None and self.Options != '':
            option = json.loads(self.Options)
        if 'SELECT' in option['source']:
                result = self.session.execute(text(option['source'])).fetchall()
                for row in result:
                    self.dto['options']['source'].append(row[0])
        else : 
            self.dto['options'] = {'source': option['source'],'minLength' :option['minLength']}

    func_type_context = {
        'Select': InputSelect,
        'ListOfNestedModel' : InputLNM,
        'AutocompTreeEditor' : InputThesaurus,
        'AutocompleteEditor': InputAutocomplete
        }


# ------------------------------------------------------------------------------------------------------------------------- #
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
    Status = Column(Integer)
    FrontModules = relationship("FrontModules", back_populates="ModuleGrids")


    def __init__(self):
        self.session = threadlocal.get_current_request().dbsession

    @orm.reconstructor
    def init_on_load(self):
        self.__init__()

    def FKName (self):
        if self.QueryName not in [None,'Forced'] : 
            return self.Name+'_'+self.QueryName
        else : 
            return self.Name 

    def GenerateColumn (self):
        ''' return grid field to build Grid '''
        column = {
        'name' :self.FKName(),
        'label' : '| '+self.Label,
        'renderable': isRenderable(self.GridRender),
        'editable': isEditable(self.GridRender),
        'cell' : self.CellType,
        }

        if self.CellType == 'select' and 'SELECT' in self.Options :
             result = self.session.execute(text(self.Options)).fetchall()
             column['optionValues'] = [[row['label'],row['val']] for row in result]
        return column

    def GenerateFilter (self) :
        ''' return filter field to build Filter '''

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
            result = self.session.execute(text(self.Options)).fetchall()
            filter_['options'] = [{'label':row['label'],'val':row['val']} for row in result]
        if self.FilterType == 'Checkboxes' :
            filter_['options'] = [{'label':'True','val':1},{'label':'False','val':0}]

        if self.FilterType=='AutocompTreeEditor' and self.Options is not None and self.Options != '' :
            filter_['options'] = {'startId': self.Options
            , 'wsUrl':dbConfig['wsThesaurus']['wsUrl']
            , 'lng':threadlocal.get_current_request().authenticated_userid['userlanguage']
            ,'displayValueName': 'valueTranslated'}
            filter_['options']['startId'] = self.Options

        if self.FilterType=='AutocompleteEditor' and  self.Options is not None and self.Options != '':
            option = json.loads(self.Options)
            filter_['options']= {'source':[]}
            if 'SELECT' in option['source']:
                result = self.session.execute(text(option['source'])).fetchall()
                for row in result:
                    filter_['options']['source'].append(row[0])
            else : 
                filter_['options'] = {'source': option['source'],'minLength' :option['minLength']}

        return filter_
