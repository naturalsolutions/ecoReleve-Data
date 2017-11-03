from pyramid.view import view_config
from ..Models import Base
from sqlalchemy import select, asc, func
from pyramid.security import NO_PERMISSION_REQUIRED


dictObj = {
    'stations': 'Station',
    'sensors': 'Sensor',
    'individuals': 'Individual',
    'monitoredSites': 'MonitoredSite',
    'users': 'User',
    'regions': 'Region'
}


def asInt(str):
    try:
        return int(str)
    except:
        return str

# TODO remove that already exists in Object view,
# need replace url requesting "{root}/autocomplete/{object}..." by "{root}/{object}/autocomplete..."


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
        query = select([table.c['ValueString'].label('label'),
                        table.c['ValueString'].label('value')]
                       ).distinct(table.c['ValueString']
                                  ).where(table.c['FK_' + objName + 'DynProp'] == prop)
        query = query.where(table.c['ValueString'].like('%' + criteria + '%')
                            ).order_by(asc(table.c['ValueString']))
    else:
        if NameValReturn is None:
            NameValReturn = prop
        table = Base.metadata.tables[objName]
        query = select([table.c[NameValReturn].label('value'),
                        table.c[prop].label('label')]
                       ).distinct(table.c[prop])
        query = query.where(table.c[prop].like(
            '%' + criteria + '%')).order_by(asc(table.c[prop]))

    return [dict(row) for row in session.execute(query).fetchall()]


@view_config(route_name='autocomplete/taxon',
             renderer='json',
             request_method='GET',
             permission=NO_PERMISSION_REQUIRED)
def autocompleteTaxon(request):
    session = request.dbsession
    taxaViews = {
        'reptile': Base.metadata.tables['reptil_view'],
        'oiseau': Base.metadata.tables['bird_view'],
        'amphibien': Base.metadata.tables['amphibia_view'],
        'mammal': Base.metadata.tables['mammal_view'],
        'insecte': Base.metadata.tables['insect_view'],
        'chiroptera': Base.metadata.tables['chiroptera_view'],
    }

    prop_name = {'vernaculaire': 'NOM_VERN',
                 'latin': 'NOM_VALIDE'}
    criterias = dict(request.params)
    table = taxaViews.get(criterias['protocol'], None)
    if table is None:
        return None

    prop_criteria = prop_name[criterias['type']]

    query = select([table]).where(
        func.lower(table.c[prop_criteria]).like(
            func.lower(criterias['term'] + '%'))
    ).order_by(asc(table.c[prop_criteria]))

    # result = session.execute(query).fetchall()
    return [{'label': row[prop_criteria],
             'taxref_id': row['CD_NOM'],
             'vernaculaire': row['NOM_VERN'],
             'latin': row['NOM_VALIDE']
             } for row in session.execute(query).fetchall()]
