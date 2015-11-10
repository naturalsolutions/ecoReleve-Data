from pyramid.view import view_config
from sqlalchemy import func, desc, select, and_, bindparam, update, or_, literal_column, join, text, update
import json
import pandas as pd
import numpy as np
from ..Models import dbConfig, DBSession, Base
from pyramid.security import NO_PERMISSION_REQUIRED
from ..utils.generator import Generator


route_prefix = 'export/'

# ------------------------------------------------------------------------------------------------------------------------- #
@view_config(route_name=route_prefix+'themes', renderer='json' ,request_method='GET',permission = NO_PERMISSION_REQUIRED)
def getListThemeEtude(request):
    th = Base.metadata.tables['ThemeEtude']
    query = select([th.c['ID'],th.c['Caption']])
    result = [dict(row) for row in DBSession.execute(query).fetchall()]

    return result

# ------------------------------------------------------------------------------------------------------------------------- #
@view_config(route_name=route_prefix+'themes/id/views', renderer='json' ,request_method='GET',permission = NO_PERMISSION_REQUIRED)
def getListViews(request):
    theme_id = int(request.matchdict['id'])

    vi = Base.metadata.tables['Views']
    t_v = Base.metadata.tables['Theme_View']
    joinTable = join(vi,t_v,vi.c['ID'] == t_v.c['FK_View'])
    query = select(vi.c).select_from(joinTable).where(t_v.c['FK_Theme'] == theme_id)
    result = [dict(row) for row in DBSession.execute(query).fetchall()]

    return result

@view_config(route_name=route_prefix+'views/id/action', renderer='json' ,request_method='GET',permission = NO_PERMISSION_REQUIRED)
def actionList(request):
    dictActionFunc = {
    'getFields': getFields,
    'getFilters': getFilters,
    'count': count_
    }
    actionName = request.matchdict['action']
    return dictActionFunc[actionName](request)

def getFields(request):
    viewId = request.matchdict['id']
    table = Base.metadata.tables['Views']
    viewName = DBSession.execute(select(['View_Name']).select_from(table).where(table.c['ID']==viewId)).scalar()
    gene = Generator(viewName)
    return 

def getFilters(request):
    viewId = request.matchdict['id']
    table = Base.metadata.tables['Views']
    viewName = DBSession.execute(select(['View_Name']).select_from(table).where(table.c['ID']==viewId)).scalar()
    gene = Generator(viewName)
    return gene.get_filters()

def count_(request):
    data = request.params.mixed()
    if 'criteria' in data: 
        criteria = json.loads(data['criteria'])
    else : 
        criteria = {}

    table = Base.metadata.tables['Views']
    viewName = DBSession.execute(select(['View_Name']).select_from(table).where(table.c['ID']==viewId)).scalar()
    gene = Generator(viewName)
    count = gene.count_(criteria)
    return count

@view_config(route_name=route_prefix+'views/id', renderer='json' ,request_method='GET',permission = NO_PERMISSION_REQUIRED)
def search(request):

    viewId = request.matchdict['id']
    table = Base.metadata.tables['Views']
    viewName = DBSession.execute(select(['View_Name']).select_from(table).where(table.c['ID']==viewId)).scalar()

    data = request.params.mixed()
    if 'criteria' in data: 
        criteria = json.loads(data['criteria'])
    else : 
        criteria = {}
    print(data)
    print(criteria)
    gene = Generator(viewName)
    if 'geo' in request.params:
        result = gene.get_geoJSON(criteria)
    else :
        result = gene.search(criteria,offset=0,per_page=15,order_by=[])

    return result
