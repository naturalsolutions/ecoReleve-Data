import json
from sqlalchemy import select, desc, join
from sqlalchemy.exc import IntegrityError
from sqlalchemy import select, desc, join, outerjoin, and_, not_, or_, exists, Table
from collections import OrderedDict

from ecoreleve_server.core import Base
from ecoreleve_server.core.base_resource import CustomResource
from ecoreleve_server.core.base_collection import Query_engine
from ecoreleve_server.modules.permissions import context_permissions


@Query_engine(Base.metadata.tables['MonitoredSitePosition'])
class PositionCollection:
    pass


class MonitoredSiteHistoryResource(CustomResource):

    def getGrid(self):
        cols = self.__parent__.objectDB.getGrid(moduleName='MonitoredSiteGridHistory')
        return cols

    def retrieve(self):
        _id = self.__parent__.objectDB.ID
        data = self.request.params.mixed()
        searchInfo = {}
        filters = [{'Column':'FK_MonitoredSite', 'Operator': 'Is', 'Value': _id}]
        try:
            searchInfo['order_by'] = json.loads(data['order_by'])
        except:
            searchInfo['order_by'] = []

        moduleFront = self.__parent__.__parent__.getConf('MonitoredSiteGridHistory')
        # view = Base.metadata.tables['MonitoredSitePosition']

        # listObj = CollectionEngine(MonitoredSite, moduleFront, View=view)
        positions = PositionCollection(session=self.session)
    
        dataResult = positions.search(filters=filters,
                                      order_by=searchInfo['order_by'])

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
            countResult = positions._count(filters=filters)
            result = [{'total_entries': countResult}]
            result.append(dataResult)
        return result
