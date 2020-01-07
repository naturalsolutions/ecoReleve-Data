import json

from ecoreleve_server.core.base_resource import *
from ecoreleve_server.database.main_db import (
    Individual_Location
)
from .inidividual_locations_collection import IndividualLocationsCollection
from ecoreleve_server.utils.parseValue import integerOrDefault


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

    def getGeoJsonResult(self, data):
        geoJson_properties = ['ID', 'Date', 'type_', 'precision']
        geoJson = []
        exceed = True

        if data:
            exceed = False

            for row in data:
                properties = {}
                if geoJson_properties != None :
                    for col in geoJson_properties :
                        if col == 'Date':
                            # value = row[col].strftime('%Y-%m-%d %H:%M:%S')
                            value = row[col].strftime('%d/%m/%Y %H:%M:%S')
                        else:
                            value = row[col]
                        properties[col] = value
                geoJson.append({
                    'type': 'Feature',
                    'properties': properties,
                    'geometry': {
                        'type': 'Point',
                        'coordinates': [row['LAT'], row['LON']]}
                })
        data = {'type': 'FeatureCollection',
                'features': geoJson,
                'exceed': exceed}
        return data

    def getMinimalParamsForPagination(self,data):
        '''
        @request :: A dictionary-like object containing both the parameters from the query string and request body,
        @returning :: dict

        will find params in request for pagination or set minimal conf
        params must int
        ['offset'] :: int >=0,
        ['per_page'] :: int >= 1
        '''
        # data = request.params.mixed()
        result = {
            'per_page' : 500,
            'offset' : 0
        }
        
        if 'per_page' in data:
            if type(data['per_page']) == list:
                data['per_page'] = data['per_page'][0]

            result['per_page'] = integerOrDefault(val=data['per_page'],defaultVal=None,positive=True)
        
        if 'offset' in data:
            if type(data['offset']) == list:
                data['offset'] = data['offset'][0]

            result['offset'] = integerOrDefault(val=data['offset'],defaultVal=0,positive=True)

        elif 'page' in data:
            if type(data['page']) == list:
                data['page'] = data['page'][0]

            page = integerOrDefault(val=data['page'],defaultVal=1,positive=True)
            per_page = result['per_page']
            result['offset'] = ( page - 1 ) * per_page

        return result

    def getOrderBy(self,data):
        '''
        @request :: A dictionary-like object containing both the parameters from the query string and request body,
        @returning :: list
        '''
        result = None
        if 'order_by' in data :
            result = json.loads(data['order_by'])
        else :
            result = ['Date:desc']

        return result
    
    def getFilters(self,data): 

        result = []

        # data = self.request.params.mixed()
        if 'criteria' in data:
            result = json.loads(data['criteria'])

        return result

    def getLocations(self):
        id_ = self.__parent__.objectDB.ID
        location_collection = IndividualLocationsCollection(session=self.session)

        data = self.request.params.mixed()


        defaultFilters = []
        defaultFilters.append({
            'Column': 'FK_Individual',
            'Operator': '=',
            'Value': id_
        })

        optionsParams = {}
        optionsParams.update( self.getMinimalParamsForPagination(data) )
        optionsParams.update({ 'order_by' : self.getOrderBy(data) })
        optionsParams.update({ 'filters' : self.getFilters(data) })

        optionsParams['filters'].append(defaultFilters[0])

        countAllPosition = 0
        countAllPosition += location_collection._count(filters=defaultFilters)
        # defaultFilters.append({
        #     'Column' : 'type_',
        #     'Operator' : 'is',
        #     'Value' : 'station'
        # })
        # countAllPosition += location_collection._countStationsPositions(filters=defaultFilters)      

        if 'geo' in data:
            optionsParams['filters'].append({
                'Column': 'LAT',
                'Operator': 'Is not null',
                'Value': 'null'
            })
            countResult = location_collection._count(filters=optionsParams['filters'])
            dataResult = []
            if countResult < 100000:
                dataResult = location_collection.search(
                    filters=optionsParams['filters'],
                    limit=optionsParams['per_page'],
                    order_by=optionsParams['order_by'])
            result = self.getGeoJsonResult(dataResult)

            result['total'] = countAllPosition
            # result = gene.get_geoJSON(
            #     criteria, ['ID', 'Date', 'type_', 'precision'], ['Date:asc'])
            # for feature in result['features']:
            #     feature['properties']['Date'] = feature['properties']['Date'].strftime('%Y-%m-%d %H:%M:%S')
            # return result
        else:
            result = location_collection.search(filters=optionsParams['filters'],
                                 offset=optionsParams['offset'],
                                 limit=optionsParams['per_page'],
                                 order_by=optionsParams['order_by'])
            for row in result:
                row['Date'] = row['Date'].strftime('%d/%m/%Y %H:%M:%S') #.strftime('%Y-%m-%d %H:%M:%S')
                row['format'] = 'DD/MM/YYYY HH:mm:ss'
        res = {}
        if 'geo' not in data:
            res[0] = {'total_entries' : countAllPosition }
            res[1] = result 
        else:
            res = result
        return res
