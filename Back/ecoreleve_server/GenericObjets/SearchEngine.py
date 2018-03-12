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
from datetime import datetime
from ..utils.parseValue import parser

#######
#TODO : Need to implement interface for in DB configuration, in order to optimize query
#######


eval_ = Eval()

class ColumnError(Exception):
    pass


class QueryEngine(object):
    '''
    This class is used to filter Model | Table | View over all properties, all relationships
    '''

    def __init__(self, session, model):
        '''
        @session :: SQLAlchemy Connection Session,
        @model :: SQLAlchemy Model or Table object (and View too)
        '''
        self.session = session
        self.model = model

    @property
    def pk_model(self):
        '''
        @returning SQLAlchemy Column Object
        Detect automatically the primary key of the model/table,
        '''
        try:
            return inspect(self.model).primary_key[0]
        except:
            return None

    def init_query_statement(self, selectable):
        '''
        @selectable :: list(str|SQLAlchemy Column)
        @returning :: SQLAlchemy Query Object

        initialize "SELECT FROM" statement
        @selectable corresponding to the columns you need in the SELECT statement
        '''
        self.selectable = []
        join_table = self._select_from()

        if selectable:
            self.selectable = []
            for column in selectable:
                if column.__class__.__name__ =='InstrumentedAttribute':
                    self.selectable.append(column)
                else:
                    self.selectable.append(self.get_column_by_name(column))
        else:
            self.selectable.append(self.model)

        query = select(self.selectable).select_from(join_table)
        return query

    def init_count_statement(self):
        '''
        initialize "SELECT COUNT(*) FROM" statement,
        @returning :: SQLAlchemy Query Object
        '''
        query = select([func.count()]).select_from(self.model)
        return query

    def _select_from(self):
        '''
        initialize the "FROM" Statement
        can by overload in order to apply junctures
        @returning :: SQLAlchemy model or SQLAlchemy join/outerjoin
        '''
        return self.model

    def search(self, filters=[], selectable=[], order_by=None, limit=None, offset=None):
        '''
        @filters :: list(dict),
        @selectable :: list(string or SQLAlchemy Column Object),
        @order_by :: list(string),
        @limit :: integer,
        @offset :: integer,

        @returning :: list(dict),

        method to call in views
        build query over parameters and execute query
        '''
        query = self.build_query(filters, selectable, order_by, limit, offset)
        self.before_exec_query()
        queryResult = self.session.execute(query).fetchall()
        return [dict(row) for row in queryResult]

    def before_exec_query(self):
        pass

    def build_query(self, filters=[], selectable=[], order_by=None, limit=None, offset=None):
        query = self.init_query_statement(selectable)
        query = self.apply_filters(query, filters)
        query = self._order_by(query, order_by)
        query = self._limit(query, limit)
        query = self._offset(query, offset)
        self.query = query
        return query

    def apply_filters(self, query, filters):
        for criteria in filters:
            query = self._where(query, criteria)
        return query
    
    def _where(self, query, criteria):
        ''' 
            @criteria :: dict
            expected "Colmun", "Operator" and "Value" keys.

            apply WHERE clause
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

    def _count(self, filters=[]):
        '''
        like search method but apply count statement,
        @returning :: interger
        '''
        query = self.init_count_statement()
        query = self.apply_filters(query, filters)
        queryResult = self.session.execute(query).scalar()
        return queryResult

    def _limit(self, query, param):
        ''' apply limit of returning rows,
            @params :: integer
        '''
        if param:
            query = query.limit(param)
        return query

    def _order_by(self, query, param):
        ''' apply order_by clause on @@ColmunName@@,
            @params :: list(string), string value is formatting as below:
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
        ''' apply offset of returning rows,
            @params :: integer,
            @returning :: SQLAlchemy Query Object
        '''
        if param:
            query = query.offset(param)
        return query

    def get_column_by_name(self, column_name):
        '''
        @column_name :: string,
        @returning :: SQLAlchemy Column Object
        '''
        column = getattr(self.model, column_name, None)
        try:
            if not column:
                column = self.model.c[column_name]
        except Exception as e:
            raise ColumnError('Column :col not exists !'.format(col=column_name))
        return column


class DynamicPropertiesQueryEngine(QueryEngine):

    def __init__(self, session, model, object_type=None, from_history=None):
        '''
        @object_type :: integer, represents the PK of the EntityType,
        @from_history :: string, can be a date string or "all" or None,

        overload QueryEngine.__init__
        '''
        QueryEngine.__init__(self, session, model)
        self.instance_model = self.model(session=self.session)
        self.object_type = object_type
        if object_type:
            self.instance_model._type = self.session.query(self.model.TypeClass).get(object_type)

        self.dynamic_properties = self.instance_model.properties

        #perform datetime conversion if failed return the original from_history parameter
        self.from_history = parser(from_history)

    def apply_filters(self, query, filters):
        query = QueryEngine.apply_filters(self, query, filters)
        if self.object_type:
            query = query.where(self.model.type_id == self.object_type)
        return query

    def get_full_history_values_view(self):
        '''
        @returning :: SQLAlchemy Table
        return the table of the dynamic property values of the Entity with dynprop
        '''
        return self.model.DynamicValuesClass.__table__

    def get_dynamic_values_view(self):
        '''
        @returning :: SQLAlchemy Model or SQLAlchemy CTE
        get the view or CTE of the dynamic value according from_history parameter
        '''
        dynPropTable = self.model.TypeClass.PropertiesClass.__table__
        valueTable = self.model.DynamicValuesClass.__table__
        if hasattr(self, 'dynamic_values_view'):
            return self.dynamic_values_view

        #if we search in the full history we want to show latest value of dynamic properties objects
        if not self.from_history or self.from_history == 'all':
            self.dynamic_values_view = self.model.LastDynamicValueViewClass

        #if we search value at a specific date we want to show 
        # latest value of dynamic properties objects AT this date, we need a new CTE
        elif type(self.from_history) is datetime:
            v2 = aliased(valueTable)
            queryExists = select(v2.c
                                 ).where(
                and_(v2.c[self.model.fk_table_DynProp_name] == valueTable.c[self.model.fk_table_DynProp_name],
                     v2.c['FK_'+self.model.__tablename__] == valueTable.c['FK_'+self.model.__tablename__])
            )
            queryExists = queryExists.where(
                and_(v2.c['StartDate'] > valueTable.c['StartDate'],
                     v2.c['StartDate'] <= self.from_history))
            self.dynamic_values_view = select(
                            valueTable.c
                            ).where(
                                    and_(not_(exists(queryExists)),
                                        valueTable.c['StartDate'] <= self.from_history)).cte()
        else:
            raise Exception('Wrong parameter from_history, it could be a date string value or "all" value')

        return self.dynamic_values_view

    def _where(self, query, criteria):
        _property = self.get_dynamic_property_by_name(criteria['Column'])
        column = self.get_column_by_name(criteria['Column'])

        if not _property:
            query = QueryEngine._where(self, query, criteria)
        else:
            query = self._where_exists(query, criteria)
        return query

    def _where_exists(self, query, criteria):
        '''
        @query :: SQLAlchemy query object,
        @criteria :: dict

        Used to apply filter on dynamic properties.
        Perform a where exists clause, increasing performance, mostly during count query
        '''
        column_name = criteria['Column']
        _property = self.get_dynamic_property_by_name(criteria['Column'])

        if self.from_history == 'all':
            dynamic_values_table = self.get_full_history_values_view()
        else:
            dynamic_values_table = self.get_dynamic_values_view()

        _alias = dynamic_values_table.alias('ex_'+column_name)
        value_column = self.model.ANALOG_DYNPROP_TYPES[_property['TypeProp']]

        exists_query = select([_alias])
        exists_query = exists_query.where(self.pk_model == _alias.c[self.model.fk_table_name])
        exists_query = exists_query.where(_alias.c[self.model.fk_table_DynProp_name] == _property['ID'])

        # management of "is null"/"is not null" operator applied on dynamic properties
        if 'null' in criteria['Operator'].lower():
            if 'is null' == criteria['Operator'].lower():
                exists_query_null = exists_query.where(_alias.c[value_column]==None)
                query = query.where(or_(
                        exists(exists_query_null),
                        ~exists(exists_query)
                    )
                )
            elif 'is not null' == criteria['Operator'].lower():
                exists_query_not_null = exists_query.where(_alias.c[value_column]!=None)
                query = query.where(and_(
                        exists(exists_query_not_null),
                        exists(exists_query)
                    )
                )
        else:
            exists_query = exists_query.where(
                                eval_.eval_binary_expr(
                                    _alias.c[value_column],
                                    criteria['Operator'],
                                    criteria['Value']
                                    )
                                )
        query = query.where(exists(exists_query))
        return query

    def _select_from(self):
        '''
        @returning :: SQLAlchemy outerjoin
        return the FROM statement with all junctures over all known dynamic properties
        '''
        join_table = self.model

        for prop in self.dynamic_properties:
            _alias, column = self.get_alias_property_values(prop)
            join_table = outerjoin(
                        join_table, _alias,
                        and_(self.pk_model == _alias.c['FK_'+self.model.__tablename__],
                             _alias.c[self.model.fk_table_DynProp_name] == prop['ID'])
                    )

            self.selectable.append(column.label(prop['Name']))
        return join_table

    def get_alias_property_values(self, _property):
        '''
        @property :: dictionary , represents the dynamic property (configured like the @@Entity@@DynProp Table)
                    like {
                            'Name':@@property_name@@,
                            'TypeProp': 'String',
                            'ID': @@PK_ID@@
                        }
        @returning :: tuple(@alias, @true_column)
        @alias :: the dynamic values view aliased
        @true_column :: the real column to query in the SELECT statement according the dynamic property configuration, ex: "ValueString"
        '''
        if not hasattr(self, 'all_alias'):
            self.all_alias = {}

        if not self.all_alias.get(_property['Name'], None):
            dynamic_values_table = self.get_dynamic_values_view()
            _alias = dynamic_values_table.alias('v'+_property['Name'].replace(' ','_'))
            column = _alias.c[self.model.ANALOG_DYNPROP_TYPES[_property['TypeProp']]]
            self.all_alias[_property['Name']] = (_alias, column)
        else:
            _alias, column = self.all_alias[_property['Name']]

        return _alias, column

    def get_column_by_name(self, column_name):
        '''
        like QueryEngine.get_column_by_name but try to get the true dynamic value column in junctures
        '''
        _property = self.get_dynamic_property_by_name(column_name)
        if _property:
            _alias, column = self.get_alias_property_values(_property)
        else:
            column = QueryEngine.get_column_by_name(self, column_name)
        return column

    def get_dynamic_property_by_name(self, property_name):
        return self.instance_model.get_property_by_name(property_name)
