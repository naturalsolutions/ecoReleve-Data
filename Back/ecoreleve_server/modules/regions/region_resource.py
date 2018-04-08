import json
import pandas as pd
import operator
import time
from datetime import datetime
from traceback import print_exc
from collections import Counter
from shapely.wkt import loads
from geojson import Feature, FeatureCollection, dumps
from sqlalchemy import select, text, func


from ecoreleve_server.core import RootCore, dbConfig
from ecoreleve_server.core.base_resource import CustomResource
from ecoreleve_server.utils.parseValue import isNumeric
from ..permissions import context_permissions
from .region_model import Region, GeomaticLayer, FieldworkArea


def get_redis_con():
    try:
        import redis
        pool = redis.ConnectionPool(host='localhost', db=1)
        redisRegion = redis.StrictRedis(connection_pool=pool)
    except:
        redisRegion = None
    return redisRegion


class RegionResource(CustomResource):
    model = FieldworkArea
    __acl__ = context_permissions['regions']

    def __init__(self, ref, parent):
        CustomResource.__init__(self, ref, parent)
        try:
            id_ = int(ref)
            self.objectDB = self.session.query(
                FieldworkArea).get(id_)
        except:
            return 'reference not found'

    def getGeoJson(self):
        return self.objectDB.geom_json

    def retrieve(self):
        return self.objectDB.json


class RegionsResource(CustomResource):

    model = FieldworkArea
    colorByTypes = {
        'country': {'fillColor': '#e6e6e6',
                    'color': '#808080',
                    },
        'working area': {'fillColor': '#d279d2',
                         'color': '#ac39ac',
                         },
        'working region': {'fillColor': '#ff6600',
                           'color': '#b34700',
                           },
        'management unit': {'fillColor': '#66ffb3',
                    'color': '#00cc66',
                    }
    }

    children = [('{int}', RegionResource)]
    __acl__ = context_permissions['regions']

    def autocomplete(self):
        params = self.request.params.mixed()
        query = select([FieldworkArea.fullpath.label('label'),
                        FieldworkArea.ID.label('value'),
                        FieldworkArea.Name.label('displayLabel'),
                        ]).where(FieldworkArea.fullpath.like('%'+params['term']+'%'))

        return [dict(row) for row in self.session.execute(query).fetchall()]

    def getRegionTypes(self):
        query = select([GeomaticLayer.type_]).distinct(GeomaticLayer.type_)
        regions = self.session.execute(query).fetchall()

        return [r[0] for r in regions]

    def getGeomFromType(self):
        session = self.request.dbsession
        params = self.request.params.mixed()
        existingGeoJson = None
        redisInstance = False
        
        if get_redis_con() is not None:
            try:
                existingGeoJson = get_redis_con().get('regions/' + params['type'])
            except:
                pass

        if not existingGeoJson:
            results = session.query(GeomaticLayer).filter(
                GeomaticLayer.type_ == params['type'])
            curStyle = self.colorByTypes.get(params['type'], {}).copy()
            curStyle.update({
                'fillOpacity': 0.2,
                'weight': 2,
                'opacity': 0.7
            })

            if params and params.get('criteria', None):
                criterias = params.get('criteria')
                for crit in criteria:
                    results = results.filter(
                        getattr(Region, crit['Column']) == crit['Value'])
            results = results.all()
            response = {
                'geojson': [r.geom_json for r in results],
                'style': curStyle
            }

            if get_redis_con() is not None:
                # set region json in redis, expires in 60 days
                get_redis_con().set('regions/' + params['type'], json.dumps(response), ex=60*3600*24)
        else:
            response = json.loads(existingGeoJson.decode())
        return response


RootCore.children.append(('regions', RegionsResource))
