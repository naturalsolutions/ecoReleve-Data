from pyramid.view import view_config
from ..Models import (
    DBSession,
    Base
    )
import transaction
from sqlalchemy import select, and_,cast, DATE,func,asc
from pyramid.security import NO_PERMISSION_REQUIRED

dictObj = { 
'stations':'Station',
'sensors':'Sensor',
'individuals':'Individual',
'monitoredSites':'MonitoredSite',
'users':'User',
'regions':'Region'
}

def asInt(str):
    try : return int(str)
    except : return str

@view_config(route_name= 'autocomplete', renderer='json', request_method = 'GET',permission = NO_PERMISSION_REQUIRED )
def autocomplete (request):
    objName = dictObj[request.matchdict['obj']]
    criteria = request.params['term']
    prop = asInt(request.matchdict['prop'])

    if isinstance(prop,int):
        table = Base.metadata.tables[objName+'DynPropValuesNow']
        query = select([table.c['ValueString'].label('label'),table.c['ValueString'].label('value')]
            ).where(table.c['FK_'+objName+'DynProp']== prop)
        query = query.where(table.c['ValueString'].like('%'+criteria+'%')).order_by(asc(table.c['ValueString']))
    else: 
        table = Base.metadata.tables[objName]
        query = select([table.c[prop].label('value'),table.c[prop].label('label')])
        query = query.where(table.c[prop].like('%'+criteria+'%')).order_by(asc(table.c[prop]))

    return [dict(row) for row in DBSession.execute(query).fetchall()]