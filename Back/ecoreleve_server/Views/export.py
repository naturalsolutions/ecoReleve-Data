from pyramid.view import view_config
from sqlalchemy import func, desc, select, and_, bindparam, update, or_, literal_column, join, text, update
import json
import pandas as pd
import numpy as np
from ..Models import dbConfig, BaseExport
from pyramid.security import NO_PERMISSION_REQUIRED
from ..utils.generator import Generator
from ..renderers import *
from pyramid.response import Response

route_prefix = 'export/'

# ------------------------------------------------------------------------------------------------------------------------- #
@view_config(route_name=route_prefix+'themes', renderer='json' ,request_method='GET',permission = NO_PERMISSION_REQUIRED)
def getListThemeEtude(request):
    session = request.dbsession
    th = BaseExport.metadata.tables['ThemeEtude']
    query = select([th.c['ID'],th.c['Caption']]).order_by(th.c['Caption'].asc())
    result = [dict(row) for row in session.execute(query).fetchall()]

    return result

# ------------------------------------------------------------------------------------------------------------------------- #
@view_config(route_name=route_prefix+'themes/id/views', renderer='json' ,request_method='GET',permission = NO_PERMISSION_REQUIRED)
def getListViews(request):
    session = request.dbsession

    theme_id = int(request.matchdict['id'])

    vi = BaseExport.metadata.tables['Views']
    t_v = BaseExport.metadata.tables['Theme_View']
    joinTable = join(vi,t_v,vi.c['ID'] == t_v.c['FK_View'])
    query = select(vi.c).select_from(joinTable).where(t_v.c['FK_Theme'] == theme_id)
    result = [dict(row) for row in session.execute(query).fetchall()]

    return result

@view_config(route_name=route_prefix+'views/id/action', renderer='json' ,request_method='GET',permission = NO_PERMISSION_REQUIRED)
def actionList(request):
    dictActionFunc = {
    'getFields': getFields,
    'getFilters': getFilters,
    'count': count_,
    }
    actionName = request.matchdict['action']
    return dictActionFunc[actionName](request)

def getFields(request):
    session = request.dbsession

    viewId = request.matchdict['id']
    table = BaseExport.metadata.tables['Views']
    viewName = session.execute(select([table.c['Relation']]).select_from(table).where(table.c['ID']==viewId)).scalar()
    gene = Generator(viewName,session)
    return gene.get_col()

def getFilters(request):
    session = request.dbsession

    viewId = request.matchdict['id']
    table = BaseExport.metadata.tables['Views']
    viewName = session.execute(select([table.c['Relation']]).select_from(table).where(table.c['ID']==viewId)).scalar()
    gene = Generator(viewName,session)
    return gene.get_filters()

def count_(request):
    session = request.dbsession

    data = request.params.mixed()
    if 'criteria' in data: 
        criteria = json.loads(data['criteria'])
    else : 
        criteria = {}

    table = BaseExport.metadata.tables['Views']
    viewName = session.execute(select([table.c['Relation']]).select_from(table).where(table.c['ID']==viewId)).scalar()
    gene = Generator(viewName,session)
    count = gene.count_(criteria)
    return count

@view_config(route_name=route_prefix+'views/id', renderer='json' ,request_method='GET',permission = NO_PERMISSION_REQUIRED)
def search(request):
    session = request.dbsession
    viewId = request.matchdict['id']
    table = BaseExport.metadata.tables['Views']
    viewName = session.execute(select([table.c['Relation']]).select_from(table).where(table.c['ID']==viewId)).scalar()

    data = request.params.mixed()
    if 'criteria' in data: 
        criteria = json.loads(data['criteria'])
    else : 
        criteria = {}

    gene = Generator(viewName,session)
    if 'geo' in request.params:
        result = gene.get_geoJSON(criteria)
    else :
        result = gene.search(criteria,offset=0,per_page=20,order_by=[])

    return result



@view_config(route_name=route_prefix+'views/getFile', renderer='json' ,request_method='GET',permission = NO_PERMISSION_REQUIRED)
def views_filter_export(request):
    session = request.dbsession
    try:
        function_export= { 'csv': export_csv, 'pdf': export_pdf, 'gpx': export_gpx }
        criteria = json.loads(request.params.mixed()['criteria'])
        viewId = criteria['viewId']
        views = BaseExport.metadata.tables['Views']
        viewName = session.execute(select([views.c['Relation']]).where(views.c['ID']==viewId)).scalar()

        table = BaseExport.metadata.tables[viewName]
        fileType= criteria['fileType']
        #columns selection
        columns=criteria['columns']
        coll=[]
        # gene = Generator(viewName)
        if fileType != 'gpx' :
            for col in columns:
                coll.append(table.c[col])
        else :

            print('************* table')
            print(table)
            splittedColumnLower = {c.name.lower().replace('_',''):c.name for c in table.c}
            coll = [table.c[splittedColumnLower['lat']].label('LAT'),table.c[splittedColumnLower['lon']].label('LON'),table.c[splittedColumnLower['date']].label('Date')]
            
            if 'stationname' in splittedColumnLower:
                coll.append(table.c[splittedColumnLower['stationname']].label('SiteName'))
            elif 'name' in splittedColumnLower:
                coll.append(table.c[splittedColumnLower['name']].label('SiteName'))
            elif 'sitename' in splittedColumnLower:
                coll.append(table.c[splittedColumnLower['sitename']].label('SiteName'))
            #if 'date' in splittedColumnLower:
                #coll.append(table.c[splittedColumnLower['date']].label('Date'))


        gene = Generator(viewName,session)
        query = gene.getFullQuery(criteria['filters'],columnsList=coll)
        rows = session.execute(query).fetchall()

        filename = viewName+'.'+fileType
        request.response.content_disposition = 'attachment;filename=' + filename
        value={'header': columns, 'rows': rows}

        io_export=function_export[fileType](value,request,viewName)
        return Response(io_export)

    except: raise

def export_csv (value,request,name_vue) :
    csvRender=CSVRenderer()
    csv=csvRender(value,{'request':request})
    return csv

def export_pdf (value,request,name_vue):
    pdfRender=PDFrenderer()
    pdf=pdfRender(value,name_vue,request)
    return pdf

def export_gpx (value,request,name_vue):
    gpxRender=GPXRenderer()
    gpx=gpxRender(value,request)
    return gpx

