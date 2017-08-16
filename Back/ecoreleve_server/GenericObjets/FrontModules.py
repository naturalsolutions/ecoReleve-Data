from ..Models import Base, dbConfig
from sqlalchemy import (
    Column,
    ForeignKey,
    Integer,
    String,
    Unicode,
    text,
    Sequence,
    orm,
    and_)
from sqlalchemy.dialects.mssql.base import BIT
from sqlalchemy.orm import relationship
import json
from pyramid import threadlocal


FieldSizeToClass = {0:'col-md-3',1:'col-md-6',2:'col-md-12'}


def isHidden(int_Render):
    return not (int(int_Render) > 0)


def isEditable(int_Render):
    edit = int(int_Render) > 2
    return edit


class FrontModules(Base):
    __tablename__ = 'FrontModules'
    ID = Column(Integer, Sequence('FrontModule__id_seq'), primary_key=True)
    Name = Column(Unicode(250))
    TypeModule = Column(Unicode(250))
    Comments = Column(String)

    ModuleForms = relationship('ModuleForms', back_populates='FrontModules')
    ModuleGrids = relationship(
        'ModuleGrids', lazy='dynamic', back_populates='FrontModules')

    def __init__(self):
        self.session = threadlocal.get_current_request().dbsession

    @orm.reconstructor
    def init_on_load(self):
        self.__init__()


class ModuleForms(Base):
    __tablename__ = 'ModuleForms'
    ID = Column(Integer, Sequence('ModuleForm__id_seq'), primary_key=True)
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
    Options = Column(String)
    Validators = Column(String)
    DefaultValue = Column(String)
    Rules = Column(String)

    FrontModules = relationship("FrontModules", back_populates="ModuleForms")

    def __init__(self):
        self.session = threadlocal.get_current_request().dbsession

    @orm.reconstructor
    def init_on_load(self):
        self.__init__()

    @staticmethod
    def GetClassFromSize(FieldSize):
        return 'col-md-' + str(FieldSize)

    def handleSchemaGrid(self):
        if self.dto.get('size', None):
            self.dto['width'] = self.dto['size']
            self.dto['minWidth'] = self.dto['size']-(self.dto['size']/1.5)
            self.dto['maxWidth'] = self.dto['size']+(self.dto['size']/1.5)
        if self.FormRender == 4:
            self.dto['pinned'] = 'left'
        return self.dto

    def GetDTOFromConf(self, displayMode, isGrid=False):
        ''' return input field to build form :
            3 modes : 
                - "display" : all input non editable, 1
                - "create": all input editable when object non existing except FormRender%2=1,
                - "edit": all input editable for existing object except FormRender%2==1
        '''
        binaryMode = 0
        self.displayMode = displayMode
        if (displayMode.lower() == 'display'):
            self.Editable = False
        else:
            self.Editable = True
        if(displayMode.lower() == 'edit'):
            binaryMode = True

        curInputType = self.InputType

        if self.Editable:
            # create or edit mode
            if self.FormRender < 2:
                # input always incactive
                isDisabled = True
                self.Editable = False
            elif (self.FormRender + binaryMode) > 3 :
                # input is inactive only in edit mode
                self.Editable = False
                isDisabled = True
            else:
                isDisabled = False
            self.fullPath = False
            curSize = self.FieldSizeEdit
        else:
            # display mode, all input inactive
            curSize = self.FieldSizeDisplay
            self.fullPath = True
            isDisabled = True

        CssClass = 'col-md-' + str(curSize)

        self.dto = {
            'name': self.Name,
            'type': curInputType,
            'title': self.Label,
            'editable': self.Editable,
            'editorClass': str(self.editorClass),
            'validators': [],
            'options': None,
            'defaultValue': None,
            'editorAttrs': {'disabled': isDisabled},
            'fullPath': self.fullPath,
            'size': curSize
        }

        try:
            self.dto['options'] = json.loads(self.Options)
        except:
            self.dto['options'] = self.Options

        if self.Rules is not None:
            self.dto['rule'] = json.loads(self.Rules)

        if self.Validators is not None:
            self.dto['validators'] = json.loads(self.Validators)

        if self.Options is not None:
            try:
                self.dto['options'] = json.loads(self.Options)
            except:
                pass

        if self.Required == 1:
            if self.InputType == "Select":
                self.dto['validators'].append("required")
            else:
                self.dto['validators'].append("required")
            self.dto['title'] = self.dto['title'] + ' *'

            # TODO changer le validateur pour select required (valeur <>-1)
        if self.Editable:
            self.dto['fieldClass'] = str(self.EditClass) + ' ' + CssClass
        else:
            self.dto['fieldClass'] = str(self.displayClass) + ' ' + CssClass

        # default value
        default = self.DefaultValue
        if default is not None:
            self.dto['defaultValue'] = default

            # TODO changer le validateur pour select required (valeur <>-1)
        if self.InputType in self.func_type_context:
            self.func_type_context[self.InputType](self)

        if isGrid:
            self.handleSchemaGrid()

        return self.dto

    def StateBox(self):
        if self.dto['defaultValue'] and self.dto['defaultValue'].isdigit():
            self.dto['defaultValue'] = int(self.dto['defaultValue'])

    def InputSelect(self):
        if (self.Options is not None
                and self.Options != '' and 'select' in self.Options.lower()):
            self.dto['options'] = []
            result = self.session.execute(text(self.Options)).fetchall()
            for row in result:
                temp = {}
                for key in row.keys():
                    temp[key] = row[key]
                self.dto['options'].append(temp)
            sortedSelect = sorted(
                [x for x in self.dto['options'] if x['val'] not in [-1,0]], key=lambda k: k['label'])

            self.dto['options'] = [x for x in self.dto['options'] if x['val'] in [-1,0]]
            self.dto['options'].extend(sortedSelect)


    def InputLNM(self):
        ''' build ListOfNestedModel input type :
        used for complex protocols and Fieldworkers in station form '''
        if self.Options is not None:
            try:
                opt = json.loads(self.Options)
                prototype = opt['protocoleType']
            except:
                prototype = self.Options
                pass
        isGrid = False
        gridRanged = False
        result = self.session.query(ModuleForms).filter(and_(
            ModuleForms.TypeObj == prototype, ModuleForms.Module_ID == self.Module_ID)).all()
        subschema = {}

        for conf in result:
            if conf.InputType == 'GridRanged':
                gridRanged = conf.GetDTOFromConf(self.displayMode, True)
                subschema.update(gridRanged)
            else:
                if self.InputType == 'GridFormEditor':
                    isGrid = True
                subschema[conf.Name] = conf.GetDTOFromConf(self.displayMode, isGrid)

        subschema['ID'] = {
            'name': 'ID',
            'type': 'Number',
            'title': 'ID',
            'editable': True,
            'editorClass': 'form-control',
            'validators': [],
            'options': None,
            'fieldClass': 'hide col-md-1',
            'defaultValue': None,
            'editorAttrs': {'disabled': True},
            'fullPath': False,
            'size': 3
        }
        resultat = []
        Legends = sorted([(obj.Legend, obj.FormOrder, obj.Name)
                          for obj in result if (obj.FormOrder is not None
                                                and obj.InputType != 'GridRanged')],
                         key=lambda x: x[1])
        Legends.append((None, 0, 'ID'))
        withOutLegends = sorted([(obj.Legend, obj.FormOrder, obj.Name)
                                 for obj in result if (obj.FormOrder is not None
                                                       and obj.Legend is None and obj.InputType != 'GridRanged')],
                                key=lambda x: x[1])

        Unique_Legends = list()
        # Get distinct Fieldset in correct order
        for x in Legends:
            if x[0] not in Unique_Legends:
                Unique_Legends.append(x[0])

        for curLegend in Unique_Legends:
            curFieldSet = {'fields': [], 'legend': curLegend}
            resultat.append(curFieldSet)

        for curProp in Legends:
            curIndex = Unique_Legends.index(curProp[0])
            resultat[curIndex]['fields'].append(curProp[2])

        if gridRanged:
            curIndex = Unique_Legends.index(conf.Legend)
            tupleList = [(gridRanged[obj]['order'], gridRanged[
                          obj]['name']) for obj in gridRanged]
            l = sorted(tupleList, key=lambda x: x[0])

            for order, name in l:
                resultat[curIndex]['fields'].append(name)

            if 'fixedCol' in subschema[resultat[curIndex]['fields'][0]]['fieldClass']:
                rr = resultat[curIndex]['fields'].pop(0)
                resultat[curIndex]['fields'].append(rr)

        self.dto['fieldsets'] = resultat
        self.dto['subschema'] = subschema
        self.dto['nbByDefault'] = self.DefaultValue

    def InputThesaurus(self):
        if self.Options is not None and self.Options != '':
            self.dto['options'] = {
                'startId': self.Options,
                'wsUrl': dbConfig['wsThesaurus']['wsUrl'],
                'lng': threadlocal.get_current_request().authenticated_userid['userlanguage'],
                'displayValueName': 'valueTranslated'}
            self.dto['options']['startId'] = self.Options
            self.dto['options']['iconFont'] = 'reneco reneco-thesaurus'

    def InputAutocomplete(self):
        if self.Options is not None and self.Options != '':
            option = json.loads(self.Options)
            self.dto['options'] = option

            if 'SELECT' in option['source']:
                self.dto['options']['source'] = []
                result = self.session.execute(
                    text(option['source'])).fetchall()
                for row in result:
                    self.dto['options']['source'].append(row[0])
            self.dto['options']['iconFont'] = 'reneco reneco-autocomplete'

    def GridRanged(self):
        options = json.loads(self.Options)
        self.dto = {}
        if self.Editable:
            isDisabled = False
            curSize = self.FieldSizeEdit
        else:
            isDisabled = True
            curSize = self.FieldSizeDisplay

        CssClass = 'col-md-' + str(curSize)
        addClass = ''
        for i in range(options['range']):
            if i == 0:
                addClass += 'firstCol'
            else:
                addClass = ''
            curDTO = {
                'name': 'C' + str(i),
                'type': options['inputType'],
                'title': options['prefixLabel'] + str(i + 1),
                'editable': self.Editable,
                'editorClass': str(self.editorClass),
                'validators': [],
                'options': None,
                'defaultValue': None,
                'editorAttrs': {'disabled': isDisabled},
                'defaultValue': None,
                'fieldClass': str(self.EditClass) + ' '
                + CssClass + ' ' + addClass,
                'order': i,
                'size': curSize,
                'width' : curSize,
                'minWidth' : curSize-(curSize/1.5),
                'maxWidth' : curSize+(curSize/1.5)
            }
            self.dto['C' + str(i)] = curDTO

    func_type_context = {
        'Select': InputSelect,
        'ListOfNestedModel': InputLNM,
        'GridFormEditor': InputLNM,
        'AutocompTreeEditor': InputThesaurus,
        'AutocompleteEditor': InputAutocomplete,
        'GridRanged': GridRanged,
        'StateBox' : StateBox
    }


class ModuleGrids (Base):
    __tablename__ = 'ModuleGrids'

    ID = Column(Integer, Sequence('ModuleGrid__id_seq'), primary_key=True)
    Module_ID = Column(Integer, ForeignKey('FrontModules.ID'))
    TypeObj = Column(Integer)
    Name = Column(String)
    Label = Column(String)
    GridRender = Column(Integer)
    GridSize = Column(String)
    CellType = Column(String)
    GridOrder = Column(Integer)
    QueryName = Column(String)
    Options = Column(String)
    FilterOrder = Column(Integer)
    FilterSize = Column(Integer)
    IsSearchable = Column(BIT)
    FilterDefaultValue = Column(String)
    FilterRender = Column(Integer)
    FilterType = Column(String)
    FilterClass = Column(String)
    Status = Column(Integer)
    ColumnParams = Column(String(250))
    FrontModules = relationship("FrontModules", back_populates="ModuleGrids")

    def __init__(self):
        self.session = threadlocal.get_current_request().dbsession

    @orm.reconstructor
    def init_on_load(self):
        self.__init__()

    def FKName(self):
        if self.QueryName not in [None, 'Forced']:
            return self.Name + '_' + self.QueryName
        else:
            return self.Name

    def GenerateColumn(self):
        ''' return grid field to build Grid '''
        dictFilterInGrid = {'Text': 'text',
                            'Number': 'number', 'DateTimePickerEditor': 'date'}
        column = {
            'field': self.FKName(),
            'headerName': self.Label,
            'hide': isHidden(self.GridRender),
            'editable': isEditable(self.GridRender),
            'filter': dictFilterInGrid.get(self.FilterType, 'text'),
            'cell': self.CellType,
            # 'width':self.GridSize,
            # 'filterParams': self.?,
            # 'cellEditor':self.CellType
            # 'cellRenderer':self.CellRenderer
            # 'cellRendererParams':self.CellOptions['cellRendererParmas']
        }
        column.update(json.loads(self.GridSize))
        if self.ColumnParams is not None:
            column.update(json.loads(self.ColumnParams))
        try:
            options = json.loads(self.Options)
            column['options'] = options
        except:
            pass
        if self.CellType == 'select' and 'SELECT' in self.Options:
            result = self.session.execute(text(self.Options)).fetchall()
            column['optionValues'] = [[row['label'], row['val']]
                                      for row in result]
        return column

    def GenerateFilter(self):
        ''' return filter field to build Filter '''

        filter_ = {
            'name': self.Name,
            'type': self.FilterType,
            'label': self.Label,
            'title': self.Label,
            'editable': isEditable(int(self.FilterRender)),
            'validators': [],
            'options': [],
        }

        try:
            filter_['options'] = json.loads(self.Options)
        except:
            filter_['options'] = self.Options

        if (self.FilterClass):
            filter_['fieldClass'] = self.FilterClass + \
                ' ' + FieldSizeToClass[self.FilterSize]
        else:
            filter_['fieldClass'] = FieldSizeToClass[self.FilterSize],

        if self.FilterType == 'Select' and self.Options is not None:
            result = self.session.execute(text(self.Options)).fetchall()
            filter_['options'] = [
                {'label': row['label'], 'val':row['val']} for row in result]

        if self.FilterType == 'Checkboxes':
            filter_['options'] = [
                {'label': 'True', 'val': 1}, {'label': 'False', 'val': 0}]

        if (self.FilterType == 'AutocompTreeEditor'
                and self.Options is not None and self.Options != ''):
            filter_['options'] = {
                'startId': self.Options,
                'wsUrl': dbConfig['wsThesaurus']['wsUrl'],
                'lng': threadlocal.get_current_request().authenticated_userid['userlanguage'],
                'displayValueName': 'valueTranslated'}
            filter_['options']['startId'] = self.Options
            filter_['options']['ValidationRealTime'] = False
            filter_['options']['iconFont'] = 'reneco reneco-thesaurus'

        if (self.FilterType == 'AutocompleteEditor'
                and self.Options is not None and self.Options != ''):
            option = json.loads(self.Options)
            if 'SELECT' in option['source']:
                filter_['options'] = {'source': []}
                result = self.session.execute(
                    text(option['source'])).fetchall()
                for row in result:
                    filter_['options']['source'].append(row[0])
            else:
                filter_['options'] = filter_['options']
            filter_['options']['iconFont'] = 'reneco reneco-autocomplete'

        return filter_
