import json
import pandas as pd
import operator
import time
from datetime import datetime
from traceback import print_exc
from collections import Counter
from shapely import wkt, wkb
from geojson import Feature, FeatureCollection, dumps
from sqlalchemy import select, text, func, and_


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
                        ])
        query = query.where(and_(
            FieldworkArea.fullpath.like('%'+params['term']+'%'),
            FieldworkArea.Status == 'current'
        ))
        query = query.order_by(FieldworkArea.fullpath)

        return [dict(row) for row in self.session.execute(query).fetchall()]

    def getRegionTypes(self):
        query = select([GeomaticLayer.type_]).distinct(GeomaticLayer.type_)
        query = query.where(GeomaticLayer.type_ != 'Country')
        regions = self.session.execute(query).fetchall()

        return [r[0] for r in regions]

    def getGeomFromType(self):
        session = self.request.dbsession
        params = self.request.params.mixed()

        curStyle = self.colorByTypes.get(params['type'], {}).copy()
        curStyle.update({
            'fillOpacity': 0.2,
            'weight': 2,
            'opacity': 0.7
        })

        colToRet = [
            FieldworkArea.ID,
            FieldworkArea.Country,
            FieldworkArea.Working_Area,
            FieldworkArea.Working_Region,
            FieldworkArea.Management_Unit,
            FieldworkArea.Name,
            FieldworkArea.type_,
            FieldworkArea.fullpath,
            FieldworkArea.valid_geom
        ]

        query = select(colToRet)
        query = query.where(and_(
            FieldworkArea.type_ == params['type'],
            FieldworkArea.Status == 'current'
            ))
        # if params and params.get('criteria', None):
        #     criterias = params.get('criteria')
        #     for crit in criterias:
        #         query = query.filter(
        #             getattr(FieldworkArea, crit['Column']) == crit['Value']
        #             )

        results = session.execute(query).fetchall()

        toRet = []

        for item in results:
            tmpFeat = Feature(
                id=getattr(item, 'ID'),
                geometry=wkb.loads(getattr(item, 'valid_geom')),
                properties={
                    'FieldworkArea': getattr(item, 'fullpath'),
                    'Country': getattr(item, 'Country'),
                    'Working_area': getattr(item, 'Working_Area'),
                    'Working_region': getattr(item, 'Working_Region'),
                    'Management_unit': getattr(item, 'Management_Unit'),
                    'name': getattr(item, 'Name')
                }
            )
            toRet.append(tmpFeat)
        response = {
            'geojson': toRet,
            'style': curStyle
        }
        return response


RootCore.children.append(('regions', RegionsResource))
