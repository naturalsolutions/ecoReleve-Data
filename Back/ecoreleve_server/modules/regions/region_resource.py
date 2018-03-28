from ..Models import (
    Region, GeomaticLayer, dbConfig, FieldworkArea
)
import json
from datetime import datetime
import pandas as pd
from sqlalchemy import select, text, func
from traceback import print_exc
from collections import Counter
from ..controllers.security import RootCore, context_permissions
from ..Models.Equipment import checkEquip
from .individual import IndividualsView
from . import CustomView
from ..utils.parseValue import isNumeric
import operator
from shapely.wkt import loads
from geojson import Feature, FeatureCollection, dumps
from .. import context_permissions


class RegionView(CustomView):
    model = FieldworkArea
    __acl__ = context_permissions['regions']

    def __init__(self, ref, parent):
        CustomView.__init__(self, ref, parent)
        try:
            id_ = int(ref)
            self.objectDB = self.session.query(
                FieldworkArea).get(id_)
        except:
            return 'reference not found'

        self.__actions__ = {'geoJSON': self.getGeoJson,
                            }
        self.__acl__ = context_permissions['regions']

    def getGeoJson(self):
        return self.objectDB.geom_json

    def retrieve(self):
        return self.objectDB.json


class RegionTypeView(CustomView):
    model = FieldworkArea
    item = RegionView

    def __init__(self, ref, parent):
        CustomView.__init__(self, ref, parent)
        self.__acl__ = context_permissions['regions']
        try:
            id_ = int(ref)
            self.objectDB = self.session.query(FieldworkArea).get(id_)
        except:
            return 'reference not found'


class RegionsView(CustomView):

    item = RegionView
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

    def __init__(self, ref, parent):
        CustomView.__init__(self, ref, parent)
        self.__actions__ = {
            'getGeomFromType': self.getGeomFromType,
            'getTypes': self.getRegionTypes,
            'autocomplete': self.autocomplete
        }
        self.__acl__ = context_permissions['regions']

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
        try:
            import redis
            r = redis.Redis('localhost')
            existingGeoJson = r.get('regions/' + params['type'])
            redisInstance = True

        except:
            from traceback import print_exc
            print_exc()
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

            if redisInstance:
                r.set('regions/' + params['type'], json.dumps(response))
        else:
            response = json.loads(existingGeoJson.decode())
        return response


RootCore.listChildren.append(('regions', RegionsView))
