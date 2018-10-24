from sqlalchemy import select, desc, join, outerjoin, and_, not_, or_, exists, Table

from ecoreleve_server.core import Base
from ecoreleve_server.core.base_collection import Query_engine, eval_

allLocIndiv = Base.metadata.tables['allIndivLocationWithStations']


@Query_engine(allLocIndiv)
class IndividualLocationsCollection:

    def _count(self, filters=[]):
        '''
        like search method but apply count statement,
        @returning :: interger
        '''
        self.filters = filters
        query = self.init_count_statement([f['Column'] for f in filters])
        query = self.apply_filters(query, filters)
        query = self.apply_custom_filters(query, filters)
        queryResult = self.session.execute(query).scalar()

        return queryResult
    
    def _countStationsPositions(self,filters=[]):
        self.filters = filters
        query = self.init_count_statement([f['Column'] for f in filters])
        query = self.apply_filters(query, filters)

        # query = self._where(query, includeTypeStation)
        queryUnionResult = self.session.execute(query).scalar()


        return queryUnionResult

    def search(self, filters=[], selectable=[], order_by=None, limit=None, offset=None, withStations = True):
        '''
        @filters :: list(dict),
        @selectable :: list(string or SQLAlchemy Column Object),
        @order_by :: list(string),
        @limit :: integer,
        @offset :: integer,
        @withStations :: boolean, specific case for union query or not

        @returning :: list(dict),

        method to call in views
        build query over parameters and execute query
        '''
        unionResult = []
        self.filters = filters
        if len(self.filters) > 1:
            withStations = False
        query = self.build_query(filters, selectable, order_by, limit, offset,withStations)
        queryResult = self.session.execute(query).fetchall()
        
        if withStations == True:
            unionQuery = self.build_unionQuery(filters, selectable, order_by, limit, offset)
            unionResult = self.session.execute(unionQuery).fetchall()

        sortedResult = queryResult + unionResult
        reverse = False
        if order_by :
            field , order =  order_by[0].split(':')
            if order == 'desc':
                reverse = True
        else :
            field = 'Date'
            order = 'desc'
        sortedResult = sorted( sortedResult, key = lambda row : (getattr(row,field) is None, getattr(row,field) )  , reverse=reverse )


        return [dict(row) for row in sortedResult]

    def build_query(self, filters=[], selectable=[], order_by=None, limit=None, offset=None,withStations=None):
        query = self.init_query_statement(selectable)
        query = self.apply_filters(query, filters)
        if withStations:
            query = self.apply_custom_filters(query, filters)
        query = self._order_by(query, order_by)
        if limit is not None:
            query = self._limit(query, limit)
            query = self._offset(query, offset)
        return query

    def build_unionQuery(self, filters=[], selectable=[], order_by=None, limit=None, offset=None):
        query = self.init_query_statement(selectable)
        includeTypeStation = {
            'Column' : 'type_',
            'Operator' : 'is',
            'Value' : 'station'
        }
        query = self._where(query, includeTypeStation)

        for criteria in filters:
            if criteria['Column'] == 'FK_Individual':
                val = criteria['Value']
                includeFkIndiv = {
                    'Column' : 'FK_Individual',
                    'Operator' : '=',
                    'Value' : val
                }
                query = self._where(query, includeFkIndiv)
        # query = self.apply_custom_filters(query, filters)
        query = self._order_by(query, order_by)
        return query

    

    def apply_custom_filters(self, query, filters):
        for criteria in filters:
            if criteria['Column'] in self.custom_filters:
                query = self.custom_filters.get(criteria['Column'])(self, query, criteria)
        #remove station type
        excludeTypeStation = {
            'Column' : 'type_',
            'Operator' : 'is not',
            'Value' : 'station'
        }

        query = self._where(query, excludeTypeStation)
        return query

