import json
import io
import sqlalchemy as sa
from sqlalchemy.inspection import inspect

import pandas as pd
from datetime import datetime
from collections import OrderedDict
from pyramid.traversal import find_root
from pyramid.response import Response
from zope.interface import implementer

from . import Base
from ..core import get_redis_con
from .base_view import IRestCommonView, IRestCollectionView, IRestItemView
from .configuration_model.FrontModules import FrontModules
from ..utils.decorator import timing

localRedis = get_redis_con()


class Resource(dict):

    children = []

    def __init__(self, ref, parent):
        self.__name__ = ref
        self.__parent__ = parent
        self.__root__ = find_root(self)
        self.add_children()

    def __getitem__(self, item):
        next_resource = self.get(item, None)
        if next_resource is not None:
            return next_resource(item, self)
        else:
            raise KeyError

    def __repr__(self):
        # use standard object representation (not dict's)
        return object.__repr__(self)

    def add_child(self, ref, klass):
        self[ref] = klass

    def add_children(self):
        for ref, klass in self.children:
            self.add_child(ref, klass)


@implementer(IRestCommonView)
class CustomResource(Resource):

    __acl__ = []

    def __init__(self, ref, parent):
        Resource.__init__(self, ref, parent)
        self.request = self.__root__.request
        self.session = self.__root__.request.dbsession

    def __getitem__(self, ref):
        if ref.isdigit():
            next_resource = self.get('{int}')
            return next_resource(ref, self)
        else:
            return super().__getitem__(ref)

    def retrieve(self):
        raise NotImplementedError()


class AutocompleteResource(CustomResource):

    def __init__(self, ref, parent):
        CustomResource.__init__(self, ref, parent)
        self.targetValue = None
        self.attribute = None

    def __getitem__(self, ref):
        if self.attribute:
            self.targetValue = ref
        else:
            self.attribute = ref
        return self

    def retrieve(self):
        objName = self.__parent__.item.model.__tablename__
        criteria = self.request.params['term']
        prop = self.attribute

        if self.integers(prop):
            table = Base.metadata.tables[objName + 'DynPropValuesNow']
            query = sa.select([table.c['ValueString'].label('label'),
                            table.c['ValueString'].label('value')]
                           ).distinct(table.c['ValueString']
                                      ).where(table.c['FK_' + objName + 'DynProp'] == prop)
            query = query.where(table.c['ValueString'].like('%' + criteria + '%')
                                ).order_by(sa.asc(table.c['ValueString']))
        else:
            NameValReturn = prop
            if self.targetValue:
                NameValReturn = self.targetValue

            table = Base.metadata.tables[objName]
            query = sa.select([table.c[NameValReturn].label('value'),
                            table.c[prop].label('label')]
                           ).distinct(table.c[prop])
            query = query.where(table.c[prop].like(
                '%' + criteria + '%')).order_by(sa.asc(table.c[prop]))

        return [dict(row) for row in self.session.execute(query).fetchall()]


class DynamicValueResource(CustomResource):
    model = None

    def __init__(self, ref, parent):
        CustomResource.__init__(self, ref, parent)
        self.objectDB = self.session.query(self.model).get(ref)

    def retrieve(self):
        pass

    def delete(self):
        self.session.delete(self.objectDB)


class DynamicValuesResource(CustomResource):
    def retrieve(self):
        from ecoreleve_server.utils.parseValue import formatThesaurus

        propertiesTable = Base.metadata.tables[self.__parent__.objectDB.TypeClass.PropertiesClass.__tablename__]
        dynamicValuesTable = Base.metadata.tables[self.__parent__.objectDB.DynamicValuesClass.__tablename__]
        FK_name = 'FK_' + self.__parent__.objectDB.__tablename__
        FK_property_name = self.__parent__.objectDB.fk_table_DynProp_name

        tableJoin = sa.join(dynamicValuesTable, propertiesTable,
                         dynamicValuesTable.c[FK_property_name] == propertiesTable.c['ID'])
        query = sa.select([dynamicValuesTable, propertiesTable.c['Name']]
                       ).select_from(tableJoin).where(
            dynamicValuesTable.c[FK_name] == self.__parent__.objectDB.ID
        ).order_by(sa.desc(dynamicValuesTable.c['StartDate']))

        result = self.session.execute(query).fetchall()
        response = []

        for row in result:
            curRow = OrderedDict(row)
            dictRow = {}
            for key in curRow:
                if curRow[key] is not None:
                    if key == 'ValueString' in key and curRow[key] is not None:
                        try:
                            thesauralValueObj = formatThesaurus(curRow[key])
                            dictRow['value'] = thesauralValueObj['displayValue']
                        except:
                            dictRow['value'] = curRow[key]
                    elif 'FK' not in key:
                        dictRow[key] = curRow[key]
            dictRow['StartDate'] = curRow[
                'StartDate'].strftime('%Y-%m-%d %H:%M:%S')
            response.append(dictRow)

        return response

    def delete(self):
        pass


@implementer(IRestItemView)
class DynamicObjectResource(CustomResource):

    def __init__(self, ref, parent):
        CustomResource.__init__(self, ref, parent)
        if int(ref) != 0:
            self.objectDB = self.session.query(self.model).get(ref)
        else:
            self.objectDB = None

        self.__acl__ = self.__parent__.__acl__

    @property
    def model(self):
        raise Exception('method has to be overriden')

    def getData(self):
        # self.objectDB.LoadNowValues()
        return self.objectDB.values

    def getDataWithForm(self):
        try:
            displayMode = self.request.params['DisplayMode']
        except:
            displayMode = 'display'
        # form = self.objectDB.getForm(displayMode, objectType, moduleName)
        return self.objectDB.getDataWithSchema(displayMode=displayMode)

    def retrieve(self):
        if 'FormName' in self.request.params:
            if not self.objectDB:
                return self.__parent__.getForm(objectType=self.request.params['ObjectType'])
            else:
                return self.getDataWithForm()
        else:
            return self.getData()

    def update(self):
        data = self.request.json_body
        self.objectDB.beforeUpdate()
        self.objectDB.values = data
        self.objectDB.afterUpdate()
        return 'updated'

    def delete(self):
        if not self.objectDB:
            return None

        self.objectDB.beforeDelete()
        self.session.delete(self.objectDB)
        self.objectDB.afterDelete()
        return 'deleted'


@implementer(IRestCollectionView)
class DynamicObjectCollectionResource(CustomResource):

    def __init__(self, ref, parent):
        CustomResource.__init__(self, ref, parent)
        self.objectDB = self.model()
        if not hasattr(self.objectDB, 'session') or not self.objectDB.session:
            self.objectDB.session = self.session

        if 'typeObj' in self.request.params and self.request.params['typeObj'] is not None:
            objType = self.request.params['typeObj']
            self.objectDB.type_id = objType
            self.typeObj = objType
        else:
            self.typeObj = None

    @property
    def model(self):
        raise NotImplementedError()

    @property
    def moduleFormName(self):
        raise NotImplementedError('moduleFormName is needed to get Form generation from in-database configuration (ModuleForms table)')

    @property
    def moduleGridName(self):
        raise NotImplementedError('moduleGridName is needed to get Grid & Filters generation from in-database configuration (ModuleGrids table)')

    @property
    def Collection(self):
        raise NotImplementedError('Collection is needed to search with filters and get datas')

    def getCollection(self, from_history=None, startDate=None):
        return self.Collection(session=self.session, object_type=self.typeObj, from_history=from_history)

    def insert(self):
        data = {}
        for items, value in self.request.json_body.items():
            data[items] = value
        
        self.handleDataBeforeInsert(data)
        self.objectDB.values = data
        self.session.add(self.objectDB)
        self.session.flush()
        return {'ID': self.objectDB.ID}

    def insertMany(self):
        pass

    def handleDataBeforeInsert(self, data):
        return data

    def handleCriteria(self, criteria):
        return criteria

    def handleResult(self, result):
        return result

    def handleCount(self, count, callback, params):
        return callback(**params)

    def retrieve(self):
        return self.search()

    def traduct_from_thesaurus(self, item, dataConfigWithThesaurus):
        from ..utils.parseValue import formatThesaurus
        key, value = item
        configThesaurus = list(filter(lambda obj: key == obj.Name, dataConfigWithThesaurus))

        if configThesaurus and value:
            newVal = formatThesaurus(value, nodeID=configThesaurus[0].Options)['displayValue']
        else:
            newVal = value
        return (key, newVal)

    def collection_traduct_from_thesaurus(self, data):
        traduced_data = []
        dataConfigWithThesaurus = list(
            filter(lambda obj: 'AutocompTreeEditor' == obj.FilterType, self.getConf(self.moduleGridName).ModuleGrids))
        # listWithThes = list(map(lambda x: x.Name, listWithThes))

        # change thesaural term into laguage user
        for row in data:
            row = dict(map(lambda i: self.traduct_from_thesaurus(i, dataConfigWithThesaurus), row.items()))
            traduced_data.append(row)
        return traduced_data

    def formatParams(self, params, paging):
        history = False
        startDate = None
        searchInfo = {}
        searchInfo['criteria'] = []

        if not bool(params):
            params = self.request.params.mixed()

        if 'criteria' in params:
            params['criteria'] = json.loads(params['criteria'])
            if params['criteria'] != {}:
                searchInfo['criteria'] = [obj for obj in params[
                    'criteria'] if obj['Value'] != str(-1)]
            else:
                searchInfo['criteria'] = []

        if 'history' in params and params['history'] == '1':
            history = True

        if 'startDate' in params and params['startDate'] != '':
            startDate = datetime.strptime(params['startDate'],
                                          '%d/%m/%Y %H:%M:%S')

        if paging:
            self.pagingSearch(searchInfo, params)
        searchInfo = self.handleCriteria(searchInfo)
        return searchInfo, history, startDate

    def count_(self, listObj=None):
        moduleFront = self.getConf(self.moduleGridName)

        params, history, startDate = self.formatParams({}, paging=False)
        from_history = 'all' if history else startDate
        
        collection = self.getCollection(from_history=from_history)
        count = collection._count(filters=params.get('criteria', []))

        return count

    @timing
    def search(self, paging=True, params={}, noCount=False):
        params, history, startDate = self.formatParams(params, paging)
        if params.get('offset', 0) > 0:
            if not params.get('order_by', []):
                params['order_by'] = [inspect(self.model).primary_key[0].name+':asc']

        conf_grid = self.getGrid()
        cols = list(map(lambda x: x['field'],conf_grid))
        from_history = 'all' if history else startDate
        self.collection = self.getCollection(from_history=from_history)

        if not noCount:
            countResult = self.collection._count(filters=params.get('criteria', []))
            result = [{'total_entries': countResult}]
            dataResult = self.handleCount(countResult,
                                          self.collection.search,
                                          {
                                            'selectable':cols,
                                            'filters':params.get('criteria', []),
                                            'offset':params.get('offset'),
                                            'limit':params.get('per_page'), 
                                            'order_by':params.get('order_by')
                                          }
                                        )
            if dataResult:
                dataResult = self.collection_traduct_from_thesaurus(dataResult)

            result.append(dataResult)
        else:
            result = self.collection.search(selectable=cols,
                   filters=params.get('criteria', []),
                   offset=params.get('offset'),
                   limit=params.get('per_page'),
                   order_by=params.get('order_by'))
            result = self.collection_traduct_from_thesaurus(result)

        return self.handleResult(result)

    def pagingSearch(self, searchInfo, params):
        searchInfo['offset'] = json.loads(params['offset'], None)
        searchInfo['per_page'] = json.loads(params['per_page'], None)
        searchInfo['order_by'] = json.loads(params['order_by'], [])
        return params

    def create(self):
        data = self.request.json_body
        if not isinstance(data, list):
            return self.insert()
        else:
            return self.insertMany()

    def getConf(self, moduleName=None):
        if not moduleName:
            moduleName = self.objectDB.moduleFormName
        return self.session.query(FrontModules
                                  ).filter(FrontModules.Name == moduleName
                                           ).first()

    @timing
    def getForm(self, objectType=None, moduleName=None, mode='edit'):
        if 'ObjectType' in self.request.params:
            objectType = self.request.params['ObjectType']

        if objectType:
            self.objectDB.type_id = objectType

        if not moduleName:
            moduleName = self.moduleFormName

        form = self.getConfigJSON(moduleName + mode, objectType)
        # form = None
        if not form:
            form = self.objectDB.getForm(mode, objectType, moduleName)
            self.setConfigJSON(moduleName + mode, objectType, form)
        return form

    @timing
    def getGrid(self, type_=None, moduleName=None):
        if not moduleName:
            moduleName = self.moduleGridName
        if not type_:
            type_ = self.typeObj

        gridCols = self.getConfigJSON(moduleName, type_)
        # gridCols = None
        if not gridCols:
            gridCols = self.objectDB.getGrid(
                type_=type_, moduleName=moduleName)
            self.setConfigJSON(moduleName, type_, gridCols)

        return gridCols

    @timing
    def getFilter(self, type_=None, moduleName=None):
        moduleName = self.request.params.get('FilterName', None)
        if not moduleName:
            moduleName = self.objectDB.moduleGridName

        if not type_:
            type_ = self.typeObj

        filters = self.getConfigJSON(moduleName+'Filter', type_)
        # filters = None
        if not filters:
            filtersList = self.objectDB.getFilters(
                type_=type_, moduleName=moduleName)
            filters = {}
            for i in range(len(filtersList)):
                filters[str(i)] = filtersList[i]
            self.setConfigJSON(moduleName + 'Filter', type_, filters)

        return filters

    def getConfigJSON(self, moduleName, typeObj):
        configJson = None
        if localRedis is not None:
            try:
                config_from_redis = localRedis.get(moduleName+'_'+str(typeObj))
                configJson = json.loads(config_from_redis.decode())
            except:
                pass
        return configJson

    def setConfigJSON(self, moduleName, typeObj, configObject):
        # use Redis ? save json configuration for Forms, Grids and Filters
        if localRedis is not None:
            localRedis.set(moduleName+'_' + str(typeObj), json.dumps(configObject), ex=3600*12)

    def getType(self):
        table = self.objectDB.TypeClass.__table__
        query = sa.select([table.c['ID'].label('val'),
                        table.c['Name'].label('label')])
        response = [OrderedDict(row)
                    for row in self.session.execute(query).fetchall()]
        return response

    def export(self):
        # dataResult = self.search(paging=False, noCount=True)
        params, history, startDate = self.formatParams({}, False)
        collection = self.getCollection()
        dataResult = collection.search(filters=params.get('criteria'))
        df = pd.DataFrame.from_records(dataResult,
                                       columns=dataResult[0].keys(),
                                       coerce_float=True)

        fout = io.BytesIO()
        writer = pd.ExcelWriter(fout)
        df.to_excel(writer, sheet_name='Sheet1')
        writer.save()
        file = fout.getvalue()

        dt = datetime.now().strftime('%d-%m-%Y')
        return Response(
            file,
            content_disposition="attachment; filename=" + self.__name__ + "_export_" + dt + ".xlsx",
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
