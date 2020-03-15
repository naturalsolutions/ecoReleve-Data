from pyramid.view import view_config
from sqlalchemy import select, asc

from ecoreleve_server.core import Base

dictObj = {
    'stations': 'Station',
    'sensors': 'Sensor',
    'individuals': 'Individual',
    'monitoredSites': 'MonitoredSite',
    'users': 'User',
    'regions': 'Region',
    'fieldworkarea': 'FieldworkArea'
}


def asInt(str):
    try:
        return int(str)
    except:
        return str


@view_config(route_name='autocomplete',
             renderer='json',
             request_method='GET')
@view_config(route_name='autocomplete/ID',
             renderer='json',
             request_method='GET')
def autocomplete(request):
    objName = dictObj[request.matchdict['obj']]
    session = request.dbsession
    criteria = request.params['term']
    prop = asInt(request.matchdict['prop'])
    try:
        NameValReturn = request.matchdict['valReturn']
    except:
        NameValReturn = None

    if isinstance(prop, int):
        table = Base.metadata.tables[objName + 'DynPropValuesNow']
        query = select([
            table.c['ValueString'].label('label'),
            table.c['ValueString'].label('value')]
            )
        query = query.distinct(
            table.c['ValueString']
            )
        query = query.where(
            table.c['FK_' + objName + 'DynProp'] == prop
            )
        query = query.where(
            table.c['ValueString'].like('%' + criteria + '%')
            )
        query = query.order_by(
            asc(table.c['ValueString'])
            )
    else:
        if NameValReturn is None:
            NameValReturn = prop
        table = Base.metadata.tables[objName]
        query = select([table.c[NameValReturn].label('value'),
                        table.c[prop].label('label')]
                       ).distinct(table.c[prop])
        if objName.lower() == 'fieldworkarea':
            query = query.where(table.c['Status'] == 'current')
        query = query.where(table.c[prop].like(
            '%' + criteria + '%')).order_by(asc(table.c[prop]))

    return [dict(row) for row in session.execute(query).fetchall()]
