# from ..Models import (
#     Station,
#     MonitoredSite,
#     Sensor,
#     Base,
#     fieldActivity,
#     MonitoredSiteList
# )
import json
from sqlalchemy import select, desc, join
from sqlalchemy.exc import IntegrityError
from collections import OrderedDict

from ecoreleve_server.core import RootCore
from ecoreleve_server.core.base_resource import DynamicObjectResource, DynamicObjectCollectionResource
from . import MonitoredSite
from ..sensors import Sensor
from ..permissions import context_permissions


SensorType = Sensor.TypeClass


class MonitoredSiteResource(DynamicObjectResource):

    model = MonitoredSite

    # def __init__(self, ref, parent):
    #     DynamicObjectView.__init__(self, ref, parent)
        # self.actions = {'history': self.history,
        #                 'equipment': self.getEquipment,
        #                 'stations': self.getStations,
        #                 'getFields': self.getGrid,
        #                 'history': self.history}

    # def __getitem__(self, ref):
    #     if ref in self.actions:
    #         self.retrieve = self.actions.get(ref)
    #         return self
    #     return self

    def update(self):
        try:
            response = DynamicObjectView.update(self)
        except IntegrityError as e:
            self.session.rollback()
            response = self.request.response
            response.status_code = 510
            response.text = "IntegrityError"
        return response

    def getGrid(self):
        cols = self.objectDB.getGrid(moduleName='MonitoredSiteGridHistory')
        return cols

    def getStations(self):
        id_site = self.objectDB.ID
        joinTable = join(Station, fieldActivity,
                         Station.fieldActivityId == fieldActivity.ID)
        query = select([Station.StationDate,
                        Station.LAT,
                        Station.LON,
                        Station.ID,
                        Station.Name,
                        fieldActivity.Name.label('fieldActivity_Name')]
                       ).select_from(joinTable
                                     ).where(Station.FK_MonitoredSite == id_site)

        result = self.session.execute(query).fetchall()
        response = []
        for row in result:
            row = dict(row)
            row['StationDate'] = row['StationDate'].strftime('%Y-%m-%d %H:%M:%S')
            response.append(row)
        return response

    def history(self):
        _id = self.objectDB.ID
        data = self.request.params.mixed()
        searchInfo = {}
        searchInfo['criteria'] = [
            {'Column': 'ID', 'Operator': 'Is', 'Value': _id}]
        try:
            searchInfo['order_by'] = json.loads(data['order_by'])
        except:
            searchInfo['order_by'] = []

        moduleFront = self.parent.getConf('MonitoredSiteGridHistory')
        view = Base.metadata.tables['MonitoredSitePosition']
        listObj = CollectionEngine(MonitoredSite, moduleFront, View=view)
        dataResult = listObj.GetFlatDataList(searchInfo)

        if 'geo' in self.request.params:
            geoJson = []
            for row in dataResult:
                geoJson.append({
                    'type': 'Feature',
                    'properties': {'Date': row['StartDate']},
                    'geometry': {
                        'type': 'Point',
                        'coordinates': [row['LAT'], row['LON']]}
                    })
            result = {'type': 'FeatureCollection', 'features': geoJson}
        else:
            countResult = listObj.count(searchInfo)
            result = [{'total_entries': countResult}]
            result.append(dataResult)
        return result

    def getEquipment(self):
        id_site = self.objectDB.ID
        table = Base.metadata.tables['MonitoredSiteEquipment']

        joinTable = join(table, Sensor, table.c['FK_Sensor'] == Sensor.ID)
        joinTable = join(joinTable, SensorType,
                         Sensor._type_id == SensorType.ID)
        query = select([table.c['StartDate'],
                        table.c['EndDate'],
                        Sensor.UnicIdentifier,
                        table.c['FK_MonitoredSite'],
                        SensorType.Name.label('Type')]
                       ).select_from(joinTable
                                     ).where(table.c['FK_MonitoredSite'] == id_site
                                             ).order_by(desc(table.c['StartDate']))

        result = self.session.execute(query).fetchall()
        response = []
        for row in result:
            curRow = OrderedDict(row)
            curRow['StartDate'] = curRow['StartDate'].strftime('%Y-%m-%d %H:%M:%S')
            if curRow['EndDate'] is not None:
                curRow['EndDate'] = curRow['EndDate'].strftime('%Y-%m-%d %H:%M:%S')
            else:
                curRow['EndDate'] = ''
            response.append(curRow)

        return response


class MonitoredSitesResource(DynamicObjectCollectionResource):

    Collection = None
    item = MonitoredSiteResource
    moduleFormName = 'MonitoredSiteForm'
    moduleGridName = 'MonitoredSiteGrid'
    __acl__ = context_permissions['monitoredSites']

    def __init__(self, ref, parent):
        DynamicObjectCollectionResource.__init__(self, ref, parent)
        # self.__acl__ = context_permissions[ref]

        if not self.typeObj:
            self.typeObj = 1

    def insert(self):
        try:
            response = DynamicObjectCollectionResource.insert(self)
        except IntegrityError as e:
            self.session.rollback()
            self.request.response.status_code = 520
            response = self.request.response
            response.text = "This name is already used for another monitored site"
            pass
        return response


RootCore.children.append(('monitoredSites', MonitoredSitesResource))
