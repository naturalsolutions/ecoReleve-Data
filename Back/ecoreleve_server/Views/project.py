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


class ProjectView(DynamicObjectView):

    model = Project

    def __init__(self, ref, parent):
        DynamicObjectView.__init__(self, ref, parent)
        self.__acl__ = context_permissions['projects']
        self.actions = {'stations': self.getStations}

    def __getitem__(self, ref):
        if ref in self.actions:
            self.retrieve = self.actions.get(ref)
            return self
        return self.get(ref)

    def getStations(self):
        query = select([Station.StationDate,
                        Station.LAT,
                        Station.LON,
                        Station.ID,
                        Station.Name,
                        ]
                       ).where(Station.FK_Project == self.objectDB.ID)

        result = self.session.execute(query).fetchall()
        response = []
        if 'geo' in self.request.params.mixed():
            data = []
            for row in result:
                data.append({
                    'type': 'Feature',
                    'properties': {
                        'name': row['Name'],
                        'date': row['StationDate']},
                    'geometry': {
                        'type': 'Point',
                        'coordinates': [row['LAT'], row['LON']]}
                })
            response = {'type': 'FeatureCollection',
                        'features': data,
                        'exceed': False}
        else:
            for row in result:
                row = dict(row)
                row['StationDate'] = row['StationDate'].strftime(
                    '%Y-%m-%d %H:%M:%S')
                response.append(row)
        return response


class ProjectsView(DynamicObjectCollectionView):

    Collection = ProjectList
    item = ProjectView
    moduleFormName = 'ProjectForm'
    moduleGridName = 'ProjectGrid'

    def __init__(self, ref, parent):
        DynamicObjectCollectionView.__init__(self, ref, parent)
        # self.actions = {'updateSiteLocation': self.updateMonitoredSite,
        #                 'importGPX': self.getFormImportGPX,
        #                 'fieldActivity': self.getFieldActivityList
        #                 }
        self.__acl__ = context_permissions[ref]


RootCore.listChildren.append(('projects', ProjectsView))
