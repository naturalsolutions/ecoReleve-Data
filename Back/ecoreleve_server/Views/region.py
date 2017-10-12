from ..Models import (
    Region, dbConfig
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


class RegionView(CustomView):
    model = Region

    def __init__(self, ref, parent):
        CustomView.__init__(self, ref, parent)
        try:
            id_ = int(ref)
            self.objectDB = self.session.query(Region).get(id_)
        except:
            return 'reference not found'

        self.__actions__ = {'geoJSON': self.getGeoJson,
                            }
        self.__acl__ = context_permissions['release']

    def getGeoJson(self):
        return self.objectDB.geom_json

    def retrieve(self):
        return self.objectDB.Region


class RegionTypeView(CustomView):
    model = Region
    item = RegionView

    def __init__(self, ref, parent):
        CustomView.__init__(self, ref, parent)
        try:
            id_ = int(ref)
            self.objectDB = self.session.query(Region).get(id_)
        except:
            return 'reference not found'


class RegionsView(CustomView):

    item = RegionView
    colorByTypes = {
        'administrative': {'fillColor': '#e6e6e6',
                           'color': '#808080',
                           },
        'houbara_centered': {'fillColor': '#d279d2',
                             'color': '#ac39ac',
                             },
    }

    def __init__(self, ref, parent):
        CustomView.__init__(self, ref, parent)
        self.__actions__ = {'administrative': self.getGeomAdministrative,
                            'houbara_centered': self.getGeomHoubara,
                            'types': self.getRegiongTypes
                            }
        self.__acl__ = context_permissions['release']

    def getRegiongTypes(self):
        return ['administrative', 'houbara_centered']

    def getGeomHoubara(self):
        session = self.request.dbsession
        params = self.request.params.mixed()
        results = session.query(Region)
        curStyle = self.colorByTypes['houbara_centered'].copy()
        curStyle.update({
            'fillOpacity': 0.2,
            'weight': 3,
            'opacity': 0.7
        })

        results = results.filter(Region.Region.like('%stan'))
        results = results.all()
        response = {
            'geojson': [r.geom_json for r in results],
            'style': curStyle
        }

        return response

    def getGeomAdministrative(self):
        session = self.request.dbsession
        params = self.request.params.mixed()
        results = session.query(Region)
        curStyle = self.colorByTypes['administrative'].copy()
        curStyle.update({
            'fillOpacity': 0.2,
            'weight': 3,
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

        return response


RootCore.listChildren.append(('regions', RegionsView))
