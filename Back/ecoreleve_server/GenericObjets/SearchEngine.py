from ..Models import Base, thesaurusDictTraduction
from sqlalchemy import (
    select,
    and_,
    or_,
    exists,
    func,
    join,
    outerjoin,
    not_)
from sqlalchemy.sql import elements
from sqlalchemy.orm import aliased
from .FrontModules import ModuleGrids
from ..utils import Eval
import pandas as pd
from pyramid import threadlocal
from ..utils.datetime import parse
import time
from sqlalchemy.inspection import inspect

eval_ = Eval()


class QueryEngine(object):
    ''' This class is used to filter object model over all properties, all relationships
    '''

    def __init__(self, session, model):
        self.session = session
        self.model = model

    @property
    def pk_model(self):
        return inspect(self.model).primary_key

    def init_query_statement(self, selectable):
        table = self.model
        if selectable:
            query = select(selectable).select_from(table)
        else :
            query = select([table])
        return query

    def init_count_statement(self):
        print(self.pk_model)
        query = select([func.count()]).select_from(self.model)
        return query

    def search(self, filters, selectable=[], order_by=None, limit=None, offset=None):
        query = self.init_query_statement(selectable)
        query = self.apply_filters(query, filters)
        query = self._order_by(query, order_by)
        query = self._limit(query, limit)
        query = self._offset(query, offset)

        print(query)
        queryResult = self.session.execute(query).fetchall()

        return [dict(row) for row in queryResult]

    def apply_filters(self, query, filters):
        for criteria in filters:
            query = self._where(query, criteria)
        return query
    
    def _where(self, query, criteria):
        ''' apply WHERE clause
            @criteria is a dictionnary expected "Colmun", "Operator" and "Value" keys.
            Can apply autamically a "where" clause over relationships,
            you have to set relationship into object model
            and set an association_proxy attribute.
        '''
        column = self.get_column_by_name(criteria['Column'])
        query = query.where(
                eval_.eval_binary_expr(
                    column, criteria['Operator'], criteria['Value']
                    )
                )
        return query

    def _count(self, filters):
        query = self.init_count_statement()
        query = self.apply_filters(query, filters)

        queryResult = self.session.execute(query).scalar()
        return queryResult

    def _limit(self, query, param):
        ''' apply limit of returning rows
            @params is an integer value
        '''
        if param:
            query = query.limit(param)
        return query

    def _order_by(self, query, param):
        ''' apply order_by clause on @@ColmunName@@
            @params is a list of string value formatting as below:
                "@@ColumnName@@:asc" or "@@ColumnName@@:desc"
        '''
        if param and type(param) is list:
            orders_by_clause = []
            for order_clause in param:
                column_name, order_type = order_clause.split(':')
                column = self.get_column_by_name(column_name)

                if order_type == 'asc':
                   orders_by_clause.append(column.asc())
                elif order_type == 'desc':
                   orders_by_clause.append(column.desc())
                else:
                    Exception('Error in order_by clause : :clause'.format(clause=order_clause))

            if len(orders_by_clause) > 0:
                query = query.order_by(*orders_by_clause)
       
        return query

    def _offset(self, query, param):
        ''' apply offset of returning rows
            @params is an integer value
        '''
        if param:
            query = query.offset(param)
        
        return query


    def _filer(self, params):
        pass

    def get_column_by_name(self, column_name):
        column = getattr(self.model, column_name, None)

        try:
            if not column:
                column = self.model.c[column_name]

        except Exception as e:
            raise Exception('Column :col not exists !'.format(col=column_name))
        return column
