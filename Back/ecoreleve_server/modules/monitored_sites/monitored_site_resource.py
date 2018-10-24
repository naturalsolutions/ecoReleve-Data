import json
from sqlalchemy import select, desc, join
from sqlalchemy.exc import IntegrityError
from sqlalchemy import select, desc, join, outerjoin, and_, not_, or_, exists, Table
from collections import OrderedDict

from ecoreleve_server.core import RootCore, Base
from ecoreleve_server.core.base_resource import DynamicObjectResource, DynamicObjectCollectionResource
from ecoreleve_server.core.base_collection import Query_engine
from . import MonitoredSite
from .monitored_site_collection import MonitoredSiteCollection
from ..sensors import Sensor
from ..stations import Station
from ..field_activities import fieldActivity
from ..permissions import context_permissions
from .monitored_sites_history import MonitoredSiteHistoryResource


SensorType = Sensor.TypeClass


@Query_engine(Base.metadata.tables['MonitoredSitePosition'])
class PositionCollection:
    pass


class MonitoredSiteResource(DynamicObjectResource):

    model = MonitoredSite
    children=[('history', MonitoredSiteHistoryResource)]

    def update(self):
        try:
            response = DynamicObjectView.update(self)
        except IntegrityError as e:
            self.session.rollback()
            response = self.request.response
            response.status_code = 510
            response.text = "IntegrityError"
        return response

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

    Collection = MonitoredSiteCollection
    model = MonitoredSite
    moduleFormName = 'MonitoredSiteForm'
    moduleGridName = 'MonitoredSiteGrid'

    children = [('{int}', MonitoredSiteResource)]

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
