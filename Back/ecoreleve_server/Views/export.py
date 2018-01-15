from sqlalchemy import select, join
import json
import pandas as pd
from ..Models import BaseExport
from ..utils.generator import Generator
from ..renderers import CSVRenderer, PDFrenderer, GPXRenderer
from pyramid.response import Response
import io
from datetime import datetime
from . import CustomView
from ..controllers.security import RootCore


class CustomExportView(CustomView):

    def __init__(self, ref, parent):
        CustomView.__init__(self, ref, parent)
        try:
            self.session = self.request.registry.dbmakerExport
        except:
            ''' occures when DB export is not loaded, see development.ini :: loadDBExport '''
            pass


class ExportQueryView(CustomExportView):

    item = None

    def __init__(self, ref, parent):
        CustomExportView.__init__(self, ref, parent)
        self.actions = {'getFields': self.getFields,
                        'getFilters': self.getFilters,
                        'count': self.count_,
                        'csv': self.export_csv,
                        'pdf': self.export_pdf,
                        'gpx': self.export_gpx,
                        'excel': self.export_excel,
                        'getFile': self.getFile
                        }
        self.viewName = self.getViewName(ref)
        self.generator = Generator(self.viewName, self.session)
        self.table = BaseExport.metadata.tables[self.viewName]

    def retrieve(self):
        return self.search()

    def getFields(self):
        return self.generator.get_col()

    def getFilters(self):
        return self.generator.get_filters()

    def count_(self):
        data = self.request.params.mixed()
        if 'criteria' in data:
            criteria = json.loads(data['criteria'])
        else:
            criteria = {}
        count = self.generator.count_(criteria)
        return count

    def getViewName(self, viewId):
        return self.session.execute(select([self.parent.table.c['Relation']]
                                           ).select_from(self.parent.table
                                                         ).where(self.parent.table.c['ID'] == viewId)
                                    ).scalar()

    def search(self):
        data = self.request.params.mixed()
        if 'criteria' in data:
            criteria = json.loads(data['criteria'])
        else:
            criteria = {}

        if 'geo' in self.request.params:
            result = self.generator.get_geoJSON(criteria)
        else:
            result = self.generator.search(criteria, offset=0, per_page=20, order_by=[])

        return result

    def formatColumns(self, fileType, columns):
        queryColumns = []
        if fileType != 'gpx':
            for col in columns:
                queryColumns.append(self.table.c[col])
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
            # columns selection
            columns = criteria['columns']

            queryColumns = self.formatColumns(fileType, columns)

            query = self.generator.getFullQuery(criteria['filters'], columnsList=queryColumns)
            rows = self.session.execute(query).fetchall()

            filename = self.viewName + '.' + fileType
            self.request.response.content_disposition = 'attachment;filename=' + filename
            value = {'header': columns, 'rows': rows}

            io_export = self.actions[fileType](value)
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


class ExportCollectionQueryView(CustomExportView):

    item = ExportQueryView

    def __init__(self, ref, parent):
        CustomExportView.__init__(self, ref, parent)
        self.table = BaseExport.metadata.tables['Views']

    def retrieve(self):
        vi = BaseExport.metadata.tables['Views']
        t_v = BaseExport.metadata.tables['Theme_View']
        joinTable = join(vi, t_v, vi.c['ID'] == t_v.c['FK_View'])
        query = select(vi.c).select_from(joinTable)

        if self.integers(self.parent.__name__):
            query = query.where(t_v.c['FK_Theme'] == self.parent.__name__)

        result = [dict(row) for row in self.session.execute(query).fetchall()]

        return result


class ExportThemeView(CustomExportView):

    item = ExportCollectionQueryView

    def __init__(self, ref, parent):
        CustomExportView.__init__(self, ref, parent)
        self.id_ = ref

    def retrieve(self):
        table = BaseExport.metadata.tables['ThemeEtude']
        query = select(table.c
                       ).where(table.c['ID'] == self.id_)
        result = [dict(row) for row in self.session.execute(query).fetchall()]
        return result


class ExportCollectionThemeView(CustomExportView):

    item = ExportThemeView

    def retrieve(self):
        table = BaseExport.metadata.tables['ThemeEtude']
        query = select([table.c['ID'], table.c['Caption']]
                       ).order_by(table.c['Caption'].asc())
        result = [dict(row) for row in self.session.execute(query).fetchall()]
        return result


class ExportCoreView(CustomExportView):

    item = ExportCollectionThemeView

    def __getitem__(self, ref):
        if ref == 'views':
            return ExportCollectionQueryView(ref, self)
        return self.item(ref, self)

    def retrieve(self):
        return {'next items': {'views': {},
                               'themes': {}
                               }
                }


RootCore.listChildren.append(('export', ExportCoreView))