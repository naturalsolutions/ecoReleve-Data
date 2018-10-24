import json
from pyramid import threadlocal
from abc import abstractproperty
from sqlalchemy import and_, or_, asc, orm, event
from sqlalchemy_utils import get_hybrid_properties
from sqlalchemy.ext.declarative import declared_attr

from .FrontModules import FrontModules, ModuleForms, ModuleGrids
from ecoreleve_server.utils.parseValue import parser, formatValue


class ConfiguredObjectResource:

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
                                        ).filter(ModuleGrids.Module_ID == self.getConf(moduleName).ID)
            # and_(ModuleGrids.Module_ID == self.getConf(moduleName).ID,
            #      ModuleGrids.GridRender > 0))

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
