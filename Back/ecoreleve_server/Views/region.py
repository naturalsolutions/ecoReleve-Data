from ..Models import (
    Region
)
import json
from datetime import datetime
import pandas as pd
from sqlalchemy import select, text
from traceback import print_exc
from collections import Counter
from ..controllers.security import RootCore, context_permissions
from ..Models.Equipment import checkEquip
from .individual import IndividualsView
from . import CustomView
from ..utils.parseValue import isNumeric
import operator


class RegionsView(CustomView):
    
    item = None

    def __init__(self, ref, parent):
        CustomView.__init__(self, ref, parent)
        self.__actions__ = {'administrative': self.getGeomAdministrative
                            }
        self.__acl__ = context_permissions['release']


    def getGeomAdministrative(self) :
        from shapely.wkt import loads
        from geojson import Feature, FeatureCollection, dumps

        session = self.request.dbsession
        results = session.query(Region).filter(Region.Region.like('%'+'stan'))

        return [r.geom_json for r in results]


RootCore.listChildren.append(('regions', RegionsView))
