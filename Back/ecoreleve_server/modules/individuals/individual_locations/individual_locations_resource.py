import json
from datetime import datetime
from sqlalchemy import select, join, desc
from collections import OrderedDict
from pyramid.traversal import find_root

from ecoreleve_server.core.base_resource import *
from ..individual_model import Individual, Individual_Location
from .inidividual_locations_collection import IndividualLocationsCollection

#TODO get geoJSON
class IndividualLocationsResource(CustomResource):

    def retrieve(self):
        return self.getLocations()

    def update(self):
        self.delete()

    def delete(self):
        IdList = json.loads(self.request.params['IDs'])
        self.session.query(Individual_Location).filter(
            Individual_Location.ID.in_(IdList)).delete(synchronize_session=False)
        return True

    def getLocations(self):
        id_ = self.__parent__.objectDB.ID
        location_collection = IndividualLocationsCollection(session=self.session)
        data = self.request.params.mixed()
        if 'criteria' in data:
            filters = json.loads(data['criteria'])
        else:
            filters = []

        filters.append({
            'Column': 'FK_Individual',
            'Operator': '=',
            'Value': id_
        })

        if 'per_page' in data:
            offset = json.loads(data['offset'])
            per_page = json.loads(data['per_page'])
        else:
            offset = None
            per_page = None

        if 'geo' in self.request.params:
            return
            # result = gene.get_geoJSON(
            #     criteria, ['ID', 'Date', 'type_', 'precision'], ['Date:asc'])
            # for feature in result['features']:
            #     feature['properties']['Date'] = feature['properties']['Date'].strftime('%Y-%m-%d %H:%M:%S')
            # return result
        else:
            result = location_collection.search(filters=filters,
                                 offset=offset,
                                 limit=per_page,
                                 order_by=['StationDate:desc'])
            for row in result:
                row['Date'] = row['Date'].strftime('%Y-%m-%d %H:%M:%S')
                row['format'] = 'YYYY-MM-DD HH:mm:ss'

        return result
