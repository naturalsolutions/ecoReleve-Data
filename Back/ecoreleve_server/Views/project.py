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


class ProjectsView(DynamicObjectCollectionView):

    Collection = ProjectList
    item = ProjectView
    moduleFormName = 'ProjectForm'
    moduleGridName = 'ProjectGrid'

    def __init__(self, ref, parent):
        DynamicObjectCollectionView.__init__(self, ref, parent)
        self.__acl__ = context_permissions[ref]


RootCore.listChildren.append(('projects', ProjectsView))
