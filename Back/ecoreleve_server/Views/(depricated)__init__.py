from pyramid.httpexceptions import HTTPNotFound
from pyramid.view import view_config
from pyramid.security import NO_PERMISSION_REQUIRED
from ..Models import sendLog, FrontModules, Base
from ..controllers.security import SecurityRoot, Resource, context_permissions
from pyramid.traversal import find_root
from collections import OrderedDict
from sqlalchemy import select, join, desc, asc
import json
from datetime import datetime


def add_cors_headers_response_callback(event):
    def cors_headers(request, response):
        response.headers.update({
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST,GET,DELETE,PUT,OPTIONS',
            'Access-Control-Allow-Headers': 'Origin,\
                                            Content-Type,\
                                            Accept,\
                                            Authorization',
            'Access-Control-Allow-Credentials': 'true',
            'Access-Control-Max-Age': '1728000',
        })
    event.request.add_response_callback(cors_headers)


@view_config(context=Exception, permission=NO_PERMISSION_REQUIRED)
def error_view(exc, request):
    
    sendLog(logLevel=5, domaine=3)
    if exc and exc.orig and exc.orig.args and '[Microsoft][ODBC SQL Server Driver][SQL Server]' in exc.orig.args[1]:
        request.response.status_code = 500
        request.response.text = exc.orig.args[1]
    else:
        request.response.status_code = 500
        request.response.text = 'Something goes wrong in API.<BR>'
    return request.response
    # return exc


class CustomView(SecurityRoot):

    def __init__(self, ref, parent):
        Resource.__init__(self, ref, parent)
        self.parent = parent
        root = find_root(self)
        self.request = root.request
        self.session = root.request.dbsession
        self.__actions__ = {}

    def __getitem__(self, ref):
        if ref in self.actions:
            self.retrieve = self.actions.get(ref)
            return self
        return self.item(ref, self)

    @property
    def actions(self):
        return self.__actions__

    @actions.setter
    def actions(self, dictActions):
        self.__actions__.update(dictActions)

    @property
    def item(self):
        raise Exception('method has to be overriden')

    def retrieve(self):
        raise Exception('method has to be overriden')


class AutocompleteView(CustomView):

    def __init__(self, ref, parent):
        CustomView.__init__(self, ref, parent)
        self.__actions__ = {}
        self.targetValue = None
        self.attribute = None

    def __getitem__(self, ref):
        if self.attribute:
            self.targetValue = ref
        else:
            self.attribute = ref
        return self

    def retrieve(self):
        objName = self.parent.item.model.__tablename__
        criteria = self.request.params['term']
        prop = self.attribute

        if self.integers(prop):
            table = Base.metadata.tables[objName + 'DynPropValuesNow']
            query = select([table.c['ValueString'].label('label'),
                            table.c['ValueString'].label('value')]
                           ).distinct(table.c['ValueString']
                                      ).where(table.c['FK_' + objName + 'DynProp'] == prop)
            query = query.where(table.c['ValueString'].like('%' + criteria + '%')
                                ).order_by(asc(table.c['ValueString']))
        else:
            NameValReturn = prop
            if self.targetValue:
                NameValReturn = self.targetValue

            table = Base.metadata.tables[objName]
            query = select([table.c[NameValReturn].label('value'),
                            table.c[prop].label('label')]
                           ).distinct(table.c[prop])
            query = query.where(table.c[prop].like(
                '%' + criteria + '%')).order_by(asc(table.c[prop]))

        return [dict(row) for row in self.session.execute(query).fetchall()]


class DynamicObjectValue(CustomView):
    model = None

    def __init__(self, ref, parent):
        CustomView.__init__(self, ref, parent)
        self.objectDB = self.session.query(self.model).get(ref)

    def retrieve(self):
        pass

    def delete(self):
        self.session.delete(self.objectDB)


class DynamicObjectValues(CustomView):
    def retrieve(self):
        from ..utils.parseValue import formatThesaurus

        propertiesTable = Base.metadata.tables[self.parent.objectDB.TypeClass.PropertiesClass.__tablename__]
        dynamicValuesTable = Base.metadata.tables[self.parent.objectDB.DynamicValuesClass.__tablename__]
        FK_name = 'FK_' + self.parent.objectDB.__tablename__
        FK_property_name = self.parent.objectDB.fk_table_DynProp_name

        tableJoin = join(dynamicValuesTable, propertiesTable,
                         dynamicValuesTable.c[FK_property_name] == propertiesTable.c['ID'])
        query = select([dynamicValuesTable, propertiesTable.c['Name']]
                       ).select_from(tableJoin).where(
            dynamicValuesTable.c[FK_name] == self.parent.objectDB.ID
        ).order_by(desc(dynamicValuesTable.c['StartDate']))

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

class DynamicObjectView(CustomView):

    def __init__(self, ref, parent):
        CustomView.__init__(self, ref, parent)
        self.__actions__ = {
                            '0': self.parent.getForm,
                            }

        if self.integers(ref):
            if int(ref) != 0:
                self.objectDB = self.session.query(self.model).get(ref)
            else:
                self.objectDB = None
        # if not hasattr(self.objectDB, 'session') or not self.objectDB.session:
        #     self.objectDB.session = self.session

        '''Set security according to permissions'''
        self.__acl__ = context_permissions[parent.__name__]

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
                return self.parent.getForm(objectType=self.request.params['ObjectType'])
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


class DynamicObjectCollectionView(CustomView):

    configJSON = {}

    def __init__(self, ref, parent):
        CustomView.__init__(self, ref, parent)
        self.objectDB = self.item.model()
        if not hasattr(self.objectDB, 'session') or not self.objectDB.session:
            self.objectDB.session = self.session

        if 'typeObj' in self.request.params and self.request.params['typeObj'] is not None:
            objType = self.request.params['typeObj']
            self.objectDB.type_id = objType
            self.typeObj = objType
        else:
            self.typeObj = None

        self.__actions__ = {'forms': self.getForm,
                            'getFields': self.getGrid,
                            'getFilters': self.getFilter,
                            'getType': self.getType,
                            'export': self.export,
                            'count': self.count_,
                            }

    def __getitem__(self, ref):
        ''' return the next item in the traversal tree if ref is an id
        else override the retrieve functions by the action name '''
        if self.integers(ref):
            return self.item(ref, self)
        elif ref == 'autocomplete':
            return AutocompleteView(ref, self)
        else:
            self.retrieve = self.actions.get(ref)
            return self

    @property
    def moduleFormName(self):
        raise Exception('method has to be overriden')

    @property
    def moduleGridName(self):
        raise Exception('method has to be overriden')

    @property
    def Collection(self):
        raise Exception('method has to be overriden')

    def getCollection(self, moduleFront=None, history=None, startDate=None):
        return self.Collection(moduleFront,
                               typeObj=self.typeObj,
                               history=history,
                               startDate=startDate)

    def insert(self):
        data = {}
        for items, value in self.request.json_body.items():
            data[items] = value
        # self.setType(data[self.objectDB.getTypeObjectFKName()])
        # self.objectDB.init_on_load()
        self.objectDB.values = data
        self.session.add(self.objectDB)
        self.session.flush()
        return {'ID': self.objectDB.ID}

    def insertMany(self):
        raise Exception('method has to be overriden')

    def handleCriteria(self, criteria):
        return criteria

    def handleResult(self, result):
        return result

    def handleCount(self, count, callback, params):
        return callback(params)

    def retrieve(self):
        return self.search()

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

        if self.request is not None:
            searchInfo, history, startDate = self.formatParams(
                {}, paging=False)
            self.collection = self.getCollection(moduleFront,
                                                 history=history,
                                                 startDate=startDate)
            count = self.collection.count(searchInfo=searchInfo)
        else:
            count = self.collection.count()
        return count

    def search(self, paging=True, params={}, noCount=False):
        params, history, startDate = self.formatParams(params, paging)
        moduleFront = self.getConf(self.moduleGridName)
        self.collection = self.getCollection(moduleFront,
                                             history=history,
                                             startDate=startDate)

        if not noCount:
            countResult = self.collection.count(params)
            result = [{'total_entries': countResult}]
            dataResult = self.handleCount(countResult,
                                          self.collection.GetFlatDataList,
                                          params)
            result.append(dataResult)
        else:
            result = self.collection.GetFlatDataList(params)

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

    def getForm(self, objectType=None, moduleName=None, mode='edit'):
        if 'ObjectType' in self.request.params:
            objectType = self.request.params['ObjectType']
            self.objectDB.type_id = objectType
        if not objectType:
            objectType = None
        # self.setType(int(objectType))
        if not moduleName:
            moduleName = self.moduleFormName

        # form = self.getConfigJSON(moduleName + mode, self.typeObj)
        form = None
        if not form:
            form = self.objectDB.getForm(mode, objectType, moduleName)
            self.setConfigJSON(moduleName + mode, objectType, form)
        return form

    def getGrid(self, type_=None, moduleName=None):
        if not moduleName:
            moduleName = self.moduleGridName
        if not type_:
            type_ = self.typeObj

        # gridCols = self.getConfigJSON(moduleName, type_)
        gridCols = None
        if not gridCols:
            gridCols = self.objectDB.getGrid(
                type_=type_, moduleName=moduleName)
            self.setConfigJSON(moduleName, type_, gridCols)

        return gridCols

    def getFilter(self, type_=None, moduleName=None):
        moduleName = self.request.params.get('FilterName', None)
        if not moduleName:
            moduleName = self.objectDB.moduleGridName

        if not type_:
            type_ = self.typeObj

        # filters = self.getConfigJSON(moduleName+'Filter', type_)
        filters = None
        if not filters:
            filtersList = self.objectDB.getFilters(
                type_=type_, moduleName=moduleName)
            filters = {}
            for i in range(len(filtersList)):
                filters[str(i)] = filtersList[i]
            self.setConfigJSON(moduleName + 'Filter', type_, filters)

        return filters

    def getConfigJSON(self, moduleName, typeObj):
        return self.configJSON.get(moduleName, {}).get(typeObj, None)

    def setConfigJSON(self, moduleName, typeObj, configObject):
        if moduleName not in self.configJSON:
            self.configJSON[moduleName] = {}
        self.configJSON[moduleName][typeObj] = configObject

    # def setType(self, objectType=1):
    #     setattr(self.objectDB, self.objectDB.getTypeObjectFKName(), objectType)

    def getType(self):
        table = self.objectDB.TypeClass.__table__
        query = select([table.c['ID'].label('val'),
                        table.c['Name'].label('label')])
        response = [OrderedDict(row)
                    for row in self.session.execute(query).fetchall()]
        return response

    def export(self):

        dataResult = self.search(paging=False, noCount=True)
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
            content_disposition="attachment; filename=individuals_export_" + dt + ".xlsx",
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')


class RESTView(object):
    def __init__(self, context, request):
        self.request = request
        self.context = context

    @view_config(request_method='GET', renderer='json', permission='read')
    def get(self):
        return self.context.retrieve()

    @view_config(request_method='POST', renderer='json', permission='create')
    def post(self):
        return self.context.create()

    @view_config(request_method='DELETE', renderer='json', permission='delete')
    def delete(self):
        return self.context.delete()

    @view_config(request_method='PATCH', renderer='json', permission='update')
    def patch(self):
        return self.context.update()

    @view_config(request_method='PUT', renderer='json', permission='update')
    def put(self):
        return self.context.update()


def add_routes(config):

    config.add_route('weekData', 'ecoReleve-Core/weekData')
    config.add_route('location_graph',
                     'ecoReleve-Core/individuals/location/graph')
    config.add_route('station_graph', 'ecoReleve-Core/stations/graph')
    config.add_route('individual_graph',
                     'ecoReleve-Core/stats/individuals/graph')
    config.add_route('individual_monitored',
                     'ecoReleve-Core/stats/individuals/monitored/graph')
    config.add_route('uncheckedDatas_graph',
                     'ecoReleve-Core/sensor/uncheckedDatas/graph')

    config.add_route('jsLog', 'ecoReleve-Core/log/error')

    # Security routes
    config.add_route('security/login', 'ecoReleve-Core/security/login')
    config.add_route('security/logout', 'ecoReleve-Core/security/logout')
    config.add_route('security/has_access',
                     'ecoReleve-Core/security/has_access')

    # User
    config.add_route('users/id', 'ecoReleve-Core/users/{id}')
    config.add_route('core/user', 'ecoReleve-Core/user')
    config.add_route('core/currentUser', 'ecoReleve-Core/currentUser')
    config.add_route('autocomplete/onLoad',
                     'ecoReleve-Core/autocomplete/{obj}/{prop}/onLoad')
    config.add_route(
        'autocomplete', 'ecoReleve-Core/autocomplete/{obj}/{prop}')
    config.add_route('autocomplete/ID',
                     'ecoReleve-Core/autocomplete/{obj}/{prop}/{valReturn}')

    # Sensors datas (Argos + GSM + RFID)
    config.add_route('sensors/datas', 'ecoReleve-Core/sensors/{type}/datas')
    config.add_route('sensors/uncheckedDatas',
                     'ecoReleve-Core/sensors/{type}/uncheckedDatas')
    config.add_route('sensors/uncheckedDatas/id_indiv/ptt',
                     'ecoReleve-Core/sensors/{type}/uncheckedDatas/{id_indiv}/{id_ptt}')
