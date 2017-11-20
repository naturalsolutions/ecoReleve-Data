from ..Models import (
    Project,
    ProjectList,
    Station
)
from sqlalchemy import select, desc, join, outerjoin
from collections import OrderedDict
from sqlalchemy.exc import IntegrityError
from ..controllers.security import context_permissions
from ..GenericObjets.ObjectView import DynamicObjectView, DynamicObjectCollectionView
from ..controllers.ApiController import RootCore
from .station import StationsView


class ProjectStationsView(StationsView):

    def __init__(self, ref, parent):
        StationsView.__init__(self, ref, parent)

    def handleCriteria(self, params):
        StationsView.handleCriteria(self, params)
        if 'criteria' not in params:
            params['criteria'] = []

        if not params.get('offset', None):
            params['offset'] = 0

        params = self.addProjectFilter(params)
        return params

    def formatParams(self, params, paging):
        return StationsView.formatParams(self, params, False)

    def addProjectFilter(self, params):
        criteria = [{'Column': 'FK_Project',
                     'Operator': '=',
                     'Value': self.parent.objectDB.ID
                     }]
        params['criteria'].extend(criteria)
        return params


class ProjectView(DynamicObjectView):

    model = Project

    def __init__(self, ref, parent):
        DynamicObjectView.__init__(self, ref, parent)
        self.__acl__ = context_permissions['projects']
        self.add_child('stations', ProjectStationsView)

    def __getitem__(self, ref):
        if ref in self.actions:
            self.retrieve = self.actions.get(ref)
            return self
        return self.get(ref)

    def update(self):
        data = self.request.json_body

        # There is a POC for Insert Geometry from geoJSON

        # geoJSON = {
        #     'type': 'Polygon',
        #             'coordinates': [[[-67.13734351262877, 45.137451890638886],
        #                              [-66.96466, 44.8097],
        #                              [-68.03252, 44.3252],
        #                              [-69.06, 43.98],
        #                              [-70.11617, 43.68405],
        #                              [-70.64573401557249, 43.090083319667144],
        #                              [-70.75102474636725, 43.08003225358635],
        #                              [-70.79761105007827, 43.21973948828747],
        #                              [-70.98176001655037, 43.36789581966826],
        #                              [-70.94416541205806, 43.46633942318431],
        #                              [-71.08482, 45.3052400000002],
        #                              [-70.6600225491012, 45.46022288673396],
        #                              [-70.30495378282376, 45.914794623389355],
        #                              [-70.00014034695016, 46.69317088478567],
        #                              [-69.23708614772835, 47.44777598732787],
        #                              [-68.90478084987546, 47.184794623394396],
        #                              [-68.23430497910454, 47.35462921812177],
        #                              [-67.79035274928509, 47.066248887716995],
        #                              [-67.79141211614706, 45.702585354182816],
        #                              [-67.13734351262877, 45.137451890638886]]]
        # }
        # data['poly'] = self.objectDB.convert_geojson_to_wkt(geoJSON)
        # # print(data['poly'])

        self.objectDB.values = data
        return 'updated'


class ProjectsView(DynamicObjectCollectionView):

    Collection = ProjectList
    item = ProjectView
    moduleFormName = 'ProjectForm'
    moduleGridName = 'ProjectGrid'

    def __init__(self, ref, parent):
        DynamicObjectCollectionView.__init__(self, ref, parent)
        self.__acl__ = context_permissions[ref]


RootCore.listChildren.append(('projects', ProjectsView))
