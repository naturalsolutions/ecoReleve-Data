import io
import json
import pandas as pd
from pyramid.response import Response
from datetime import datetime
from sqlalchemy import select, join

from ecoreleve_server.core import RootCore, BaseExport
from ecoreleve_server.core.base_collection import Query_engine
from ecoreleve_server.core.base_resource import CustomResource
from ..permissions import context_permissions
from ecoreleve_server.renderers import CSVRenderer, PDFrenderer, GPXRenderer

# TOODO Replace Generator by  to Search in views

class CustomExportResource(CustomResource):

    def __init__(self, ref, parent):
        CustomResource.__init__(self, ref, parent)
        try:
            self.session = self.request.registry.dbmakerExport
        except:
            ''' occures when DB export is not loaded, see development.ini :: loadDBExport '''
            pass


class ExportQueryResource(CustomExportResource):

    dictCell={
            'VARCHAR':'string',
            'NVARCHAR':'string',
            'INTEGER':'number',
            'DECIMAL':'number',
            'DATETIME':'string',
            'DATE':'string',
            'TIME':'string',
            'BIT':'boolean'
            }
    dictFilter = {
            'VARCHAR':'Text',
            'NVARCHAR':'Text',
            'INTEGER':'Number',
            'DECIMAL':'Number',
            'NUMERIC':'Number',
            'DATETIME':'DateTimePickerEditor',
            'DATE':'DateTimePickerEditor',
            'TIME':'DateTimePickerEditor',
        }

    def __init__(self, ref, parent):
        CustomExportResource.__init__(self, ref, parent)

        self.viewName = self.getViewName(ref)
        self.table = BaseExport.metadata.tables[self.viewName]
        self.collection = self.getCollection(self.table)

        self.exportType = {
                        'csv': self.export_csv,
                        'pdf': self.export_pdf,
                        'gpx': self.export_gpx,
                        'excel': self.export_excel,
                        }

    def getCollection(self, table):
        @Query_engine(table)
        class ViewCollection:
            pass
        return ViewCollection(session=self.session)

    def retrieve(self):
        return self.search()

    def getFields(self, columnsList=[], checked=False):
        final_fields=[]
        if columnsList :
            for col in columnsList:
                field_name=col
                field_label=col
                field_type=str(self.table.c[field_name].type).split('(')[0]
                if field_type in self.dictCell:
                    cell_type=self.dictCell[field_type]
                    cell_type = 'string'
                else:
                    cell_type='string'
                final_fields.append({'field':field_name,
                    'headerName':field_label,
                    'cell':cell_type,
                    'editable':False})
                # self.cols.append({'name':field_name,'type_grid':cell_type})
        else : 
            for col in self.table.c:
                field_name=col.name
                field_label=col.name
                
                field_type=self.table.c[col.name].type
                if field_type in self.dictCell:
                    cell_type=self.dictCell[field_type]
                    cell_type='string'
                    
                else:
                    cell_type='string'
                final_fields.append({'field':field_name,
                    'headerName':field_label,
                    'cell':cell_type,
                    'editable':False})
                # self.cols.append({'name':field_name,'type_grid':cell_type})

        if(checked):
            final_fields.append({'name': 'import','label': 'Import', 'cell': 'select-row', 'headerCell' : 'select-all'})
        return final_fields

    def getFilters(self):
        filters = []
        options = None
        for column in self.table.c:
            name_c = str(column.name)
            options = None
            try :
                db_type = str(column.type).split('(')[0]
            except: 
                db_type = None
                pass
            if db_type in self.dictFilter :
                type_f = self.dictFilter[db_type]
                if type_f == 'DateTimePickerEditor':
                    if db_type == 'TIME':
                        options ={'format':'hh:mm:ss'}
                    elif db_type == 'DATE':
                        options ={'format':'DD/MM/YYYY'}
                    else : 
                        options ={'format':'DD/MM/YYYY hh:mm:ss'}
            else :
                type_f = 'Text'
            filters.append({'name':name_c, 'type':type_f , 'title':name_c, 'options':options})

        return filters

    def count_(self):
        data = self.request.params.mixed()
        if 'criteria' in data:
            criteria = json.loads(data['criteria'])
        else:
            criteria = {}
        count = self.collection._count(filters=criteria)
        return count

    def getViewName(self, viewId):
        return self.session.execute(select([self.__parent__.table.c['Relation']]
                                           ).select_from(self.__parent__.table
                                                         ).where(self.__parent__.table.c['ID'] == viewId)
                                    ).scalar()

    def search(self):
        data = self.request.params.mixed()
        if 'criteria' in data:
            criteria = json.loads(data['criteria'])
        else:
            criteria = {}

        if 'geo' in self.request.params:
            result = self.get_geoJSON(criteria=criteria)
        else:
            result = self.collection.search(filters=criteria, offset=0, limit=20, order_by=[])

        return result

    def get_geoJSON(self,criteria={}, geoJson_properties = [], order_by=None) :
        result=[]
        total=None
        countResult = self.collection._count(filters=criteria)
        column_lower = {c.name.lower():c.name for c in self.table.c}
        exceed = None
        geoJson=[]

        if 'lat' in column_lower:
            if countResult <= 100000 :
                exceed = False
                query = self.collection.build_query(filters=criteria)
                # if order_by:
                #     query = self.get_order(query, order_by)
                try :
                    data=self.session.execute(query.where(self.table.c[column_lower['lat']] != None)).fetchall()
                except :
                    print_exc()
                for row in data:
                    properties = {}
                    if geoJson_properties != None :
                        for col in geoJson_properties :
                            properties[col] = row[col]
                    geoJson.append({'type':'Feature', 'properties':properties, 'geometry':{'type':'Point'
                        , 'coordinates':[row[column_lower['lat']],row[column_lower['lon']]]}})
            else :
                exceed = True
        return {'type':'FeatureCollection', 'features': geoJson,'exceed': exceed, 'total':countResult}

    def formatColumns(self, fileType, columns):
        queryColumns = []
        if fileType.lower() != 'gpx':
            for col in columns:
                queryColumns.append(self.table.c[col].label(col))
        else:
            splittedColumnLower = {c.name.lower().replace(
                '_', ''): c.name for c in self.table.c}
            queryColumns = [self.table.c[splittedColumnLower['lat']].label(
                'LAT'), self.table.c[splittedColumnLower['lon']].label('LON')]

            if 'stationname' in splittedColumnLower:
                queryColumns.append(self.table.c[splittedColumnLower[
                            'stationname']].label('SiteName'))
            elif 'name' in splittedColumnLower:
                queryColumns.append(self.table.c[splittedColumnLower[
                            'name']].label('SiteName'))
            elif 'sitename' in splittedColumnLower:
                queryColumns.append(self.table.c[splittedColumnLower[
                            'sitename']].label('SiteName'))
            if 'date' in splittedColumnLower:
                queryColumns.append(self.table.c[splittedColumnLower['date']].label('Date'))
        return queryColumns

    def getFile(self):
        try:
            criteria = json.loads(self.request.params.mixed()['criteria'])
            fileType = criteria['fileType']
            columns = criteria['columns']

            queryColumns = self.formatColumns(fileType, columns)
            query = self.collection.build_query(filters=criteria['filters'], selectable=queryColumns)
            rows = self.session.execute(query).fetchall()

            filename = self.viewName + '.' + fileType
            self.request.response.content_disposition = 'attachment;filename=' + filename
            value = {'header': columns, 'rows': rows}

            io_export = self.exportType[fileType](value)
            return io_export

        except:
            raise

    def export_csv(self, value):
        csvRender = CSVRenderer()
        csv = csvRender(value, {'request': self.request})
        return Response(csv)

    def export_pdf(self, value):
        pdfRender = PDFrenderer()
        pdf = pdfRender(value, self.viewName, self.request)
        return Response(pdf)

    def export_gpx(self, value):
        gpxRender = GPXRenderer()
        gpx = gpxRender(value, self.request)
        return Response(gpx)

    def export_excel(self, value):
        df = pd.DataFrame(data=value['rows'], columns=value['header'])

        fout = io.BytesIO()
        writer = pd.ExcelWriter(fout)
        df.to_excel(writer, sheet_name='Sheet1', index=False)
        writer.save()
        file = fout.getvalue()

        dt = datetime.now().strftime('%d-%m-%Y')
        return Response(
            file,
            content_disposition="attachment; filename="
            + self.viewName + "_" + dt + ".xlsx",
            content_type='application/vnd.openxmlformats-\
            officedocument.spreadsheetml.sheet')


class ExportCollectionQueryResource(CustomExportResource):

    item = ExportQueryResource
    children = [('{int}', ExportQueryResource)]
    
    def __init__(self, ref, parent):
        CustomExportResource.__init__(self, ref, parent)
        self.table = BaseExport.metadata.tables['Views']

    def retrieve(self):
        vi = BaseExport.metadata.tables['Views']
        t_v = BaseExport.metadata.tables['Theme_View']
        joinTable = join(vi, t_v, vi.c['ID'] == t_v.c['FK_View'])
        query = select(vi.c).select_from(joinTable)

        if self.__parent__.__name__.isdigit():
            query = query.where(t_v.c['FK_Theme'] == self.__parent__.__name__)

        result = [dict(row) for row in self.session.execute(query).fetchall()]

        return result


class ExportThemeResource(CustomExportResource):

    item = ExportCollectionQueryResource
    children = [('views', ExportCollectionQueryResource)]

    def __init__(self, ref, parent):
        CustomExportResource.__init__(self, ref, parent)
        self.id_ = ref

    def retrieve(self):
        table = BaseExport.metadata.tables['ThemeEtude']
        query = select(table.c
                       ).where(table.c['ID'] == self.id_)
        result = [dict(row) for row in self.session.execute(query).fetchall()]
        return result


class ExportCollectionThemeResource(CustomExportResource):

    item = ExportThemeResource
    children = [('{int}', ExportThemeResource)]

    def retrieve(self):
        table = BaseExport.metadata.tables['ThemeEtude']
        query = select([table.c['ID'], table.c['Caption']]
                       ).order_by(table.c['Caption'].asc())
        result = [dict(row) for row in self.session.execute(query).fetchall()]
        return result


class ExportCoreResource(CustomExportResource):

    item = ExportCollectionThemeResource
    children = [('views', ExportCollectionQueryResource),
                ('themes', ExportCollectionThemeResource)]

    def retrieve(self):
        return {'next items': {'views': {},
                               'themes': {}
                               }
                }


RootCore.children.append(('export', ExportCoreResource))