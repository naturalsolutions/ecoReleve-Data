from .FrontModules import FrontModules, ModuleForms, ModuleGrids
from pyramid import threadlocal
from abc import abstractproperty
from sqlalchemy import and_, or_, asc, orm, event
from ..utils.parseValue import parser, formatValue
from sqlalchemy_utils import get_hybrid_properties
from sqlalchemy.ext.declarative import declared_attr
from ..GenericObjets import BusinessRules
from ..Models import dbConfig, Base
import json


class ConfiguredDbObjectMapped(object):

    @abstractproperty
    def moduleFormName(self):
        pass

    @abstractproperty
    def moduleGridName(self):
        pass

    def __init__(self):
        self.session = threadlocal.get_current_request().dbsession

    def getConf(self, moduleName=None):
        if not moduleName:
            moduleName = self.moduleFormName
        conf = self.session.query(FrontModules
                                  ).filter(FrontModules.Name == moduleName
                                           ).first()
        return conf

    def getForm(self, displayMode='edit', type_=None, moduleName=None, isGrid=False):
        Editable = (displayMode.lower() == 'edit')
        schema = {}
        if not self.ID:
            displayMode = 'create'
        fields = self.session.query(ModuleForms
                                    ).filter(
            and_(ModuleForms.Module_ID == self.getConf(moduleName).ID,
                 ModuleForms.FormRender > 0))

        if type_:
            fields = fields.filter(or_(ModuleForms.TypeObj == type_,
                                       ModuleForms.TypeObj == None))

        fields.order_by(ModuleForms.FormOrder).all()

        for field in fields:
            # CurModuleForms = list(
            #     filter(lambda x: field.Name == x.key, self.__table__.columns))
            CurModuleForms = [1]
            if (len(CurModuleForms) > 0):
                schema[field.Name] = field.GetDTOFromConf(
                    displayMode, isGrid=isGrid)

        form = {'schema': schema,
                'fieldsets': self.sortFieldsets(fields),
                'grid': isGrid,
                # 'data': {'id': 0}
                'recursive_level': 0
                }
        form = self.getDefaultValue(form)
        del form['recursive_level']
        return form

    def sortFieldsets(self, fields):
        ''' return ordered FiledSet according to configuration '''
        sortedFieldsets = []
        Legends = sorted([(obj.Legend, obj.FormOrder, obj.Name)
                          for obj in fields if obj.FormOrder is not None],
                          key=lambda x: x[1])

        Unique_Legends = list()
        # Get distinct Fieldset in correct order
        for x in Legends:
            if x[0] not in Unique_Legends:
                Unique_Legends.append(x[0])

        for curLegend in Unique_Legends:
            curFieldSet = {'fields': [], 'legend': curLegend}
            sortedFieldsets.append(curFieldSet)

        for curProp in Legends:
            curIndex = Unique_Legends.index(curProp[0])
            sortedFieldsets[curIndex]['fields'].append(curProp[2])

        return sortedFieldsets

    def getGrid(self, type_=None, moduleName=None):
        gridFields = self.session.query(ModuleGrids
                                        ).filter(
            and_(ModuleGrids.Module_ID == self.getConf(moduleName).ID,
                 ModuleGrids.GridRender > 0))

        if type_:
            gridFields = gridFields.filter(or_(ModuleGrids.TypeObj == type_,
                                               ModuleGrids.TypeObj == None))

        gridFields = gridFields.order_by(asc(ModuleGrids.GridOrder)).all()
        return [curConf.GenerateColumn() for curConf in gridFields]

    def getFilters(self, type_=None, moduleName=None):
        ''' Function to call : return Name and Type of Filters to display in front end
        according to configuration in table ModuleGrids'''
        filters = []

        filterFields = self.session.query(ModuleGrids
                                          ).filter(
            ModuleGrids.Module_ID == self.getConf(moduleName).ID)

        if type_:
            filterFields = filterFields.filter(or_(ModuleGrids.TypeObj == type_,
                                                   ModuleGrids.TypeObj == None))
        filterFields = filterFields.order_by(asc(ModuleGrids.FilterOrder)).all()
        for curConf in filterFields:
            if curConf.IsSearchable:
                filters.append(curConf.GenerateFilter())
            elif curConf.QueryName is not None and curConf.FilterRender != 0:
                filters.append(curConf.GenerateFilter())
        return filters

    def getDefaultValue(self, form):
        defaultValues = {}
        recursive_level = form['recursive_level']
        for key, value in form['schema'].items():
            if 'defaultValue' in value and value['defaultValue'] is not None:
                defaultValues[key] = value['defaultValue']
            if 'subschema' in value:
                temp = {'schema': value['subschema'], 'defaultValues': {
                }, 'recursive_level': recursive_level + 1}
                subData = self.getDefaultValue(temp)
                form['schema'][key]['subschema']['defaultValues'] = subData

        if recursive_level < 1:
            form['schema']['defaultValues'] = defaultValues
        else:
            form = defaultValues
        return form


class DbObject(object):

    def __init__(self):
        self.__constraintFunctionList__ = []
        self.__properties__ = {}
        self.session = threadlocal.get_current_request().dbsession

    @orm.reconstructor
    def init_on_load(self):
        ''' init_on_load is called on the fetch of object '''
        self.__init__()

    def getProperty(self, nameProp):
        if hasattr(self, nameProp):
            return getattr(self, nameProp)
        else:
            return self.__properties__[nameProp]

    def setProperty(self, propertyName, value):
        ''' Set object properties (static and dynamic) '''
        if hasattr(self, propertyName):
            if propertyName in self.__table__.c:
                value = parser(value)

            setattr(self, propertyName, value)
            self.__properties__[propertyName] = value

    def updateFromJSON(self, data, startDate=None):
        ''' Function to call : update properties of new
        or existing object with JSON/dict of value'''
        # if self.checkConstraintsOnData(data):
        for curProp in data:
            if (curProp.lower() != 'id' and data[curProp] != '-1'):
                if (isinstance(data[curProp], str)
                        and len(data[curProp].split()) == 0):
                    data[curProp] = None
                self.setProperty(curProp, data[curProp], startDate)

    def formatData(self, data):
        return

    @classmethod
    def getBuisnessRules(cls):
        return dbConfig['dbSession'].query(BusinessRules
                                           ).filter_by(target=cls.__tablename__
                                                       ).all()

    @declared_attr
    def loadBusinessRules(cls):
        @event.listens_for(Base.metadata,'after_create')
        def afterConfigured(target, connection, **kwargs):
            cls.__constraintRules__ = { 'before_update':[],
                                        'after_update':[],
                                        'before_insert':[],
                                        'after_insert':[],
                                        'before_delete':[],
                                        'after_delete':[]
                                        }

            rules = cls.getBuisnessRules()
            if rules:
                m = [cls.__constraintRules__[rule.actionType].append(rule)
                        in cls.__constraintRules__
                        for rule in rules
                        if rule.actionType in cls.__constraintRules__]

    @declared_attr
    def onEvent(cls):
        events = ['before_insert', 'before_update']

        @event.listens_for(cls, 'before_update')
        def before_update(mapper, connection, target):
            cls.executeBusinessRules(target, 'before_update')

        @event.listens_for(cls, 'after_update')
        def after_update(mapper, connection, target):
            cls.executeBusinessRules(target, 'after_update')

        @event.listens_for(cls, 'before_insert')
        def before_insert(mapper, connection, target):
            cls.executeBusinessRules(target, 'before_insert')

        @event.listens_for(cls, 'after_insert')
        def after_insert(mapper, connection, target):
            cls.executeBusinessRules(target, 'after_insert')

        @event.listens_for(cls, 'before_delete')
        def before_delete(mapper, connection, target):
            cls.executeBusinessRules(target, 'before_delete')

        @event.listens_for(cls, 'after_delete')
        def after_delete(mapper, connection, target):
            cls.executeBusinessRules(target, 'after_delete')

    @classmethod
    def executeBusinessRules(cls, target, event):
        if cls.__constraintRules__[event]:
            entityDTO = target.getFlatObject()
            for rule in cls.__constraintRules__[event]:
                if (not rule.targetTypes
                    or (hasattr(target, 'GetType') and target.GetType().ID in rule.targetTypes)):
                    result = rule.execute(entityDTO)

    def afterUpdate(self):
        return

    def beforeDelete(self):
        return

    def afterDelete(self):
        return

    def getFlatObject(self, schema=None):
        ''' return flat object with static properties and last existing value of dyn props '''
        data = {}
        hybrid_properties = list(get_hybrid_properties(self.__class__).keys())
        # if self.ID is not None:
        max_iter = max(len(self.__table__.columns), len(
            self.__properties__), len(hybrid_properties))
        for i in range(max_iter):
            # Get static Properties
            try:
                curStatProp = list(self.__table__.columns)[i]
                data[curStatProp.key] = self.getProperty(
                    curStatProp.key)
            except:
                pass
            # Get dynamic Properties
            try:
                curDynPropName = list(self.__properties__)[i]
                data[curDynPropName] = self.getProperty(curDynPropName)
            except Exception as e:
                pass
            try:
                PropName = hybrid_properties[i]
                data[PropName] = self.getProperty(PropName)
            except Exception as e:
                pass

        # if not schema and hasattr(self, 'getForm'):
        #     schema = self.getForm()['schema']
        if schema:
            data = formatValue(data, schema)

        return data
