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
from sqlalchemy.orm import aliased, exc
from .FrontModules import ModuleGrids
from ..utils import Eval
import pandas as pd
from pyramid import threadlocal
from ..utils.datetime import parse
import time
from sqlalchemy.inspection import inspect
from datetime import datetime
from ..utils.parseValue import parser
from functools import wraps
from sqlalchemy.ext.declarative import declared_attr
import abc 
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
    custom_filters = {}
    def __init__(self, session, model):
        '''
        @session :: SQLAlchemy Connection Session,
        @model :: SQLAlchemy Model or Table object (and View too)
        '''

        self.session = session
        self.model = model
        self.model_table = model
        if self.model.__class__.__name__ != 'Table':
            self.model_table = model.__table__

        self.fk_list = {fk.parent.name: fk for fk in self.model_table.foreign_keys}
        self.fk_join_list = []

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
        self.fk_join_list = []
        self.selectable = []
        if selectable:
            # self.selectable = []
            for column in selectable:
                if column.__class__.__name__ in ['InstrumentedAttribute', 'Label'] :
                    if column.__class__.__name__ == 'InstrumentedAttribute':
                        column = column.label(column.name)
                    self.selectable.append(column)
                else:
                    true_column = self.get_column_by_name(column)
                    if true_column is None:
                        continue
                    else:
                        self.selectable.append(true_column.label(column))

        join_table, computed_selectable = self._select_from()
        join_table = self.extend_from(join_table)
        join_table = self._from_foreign(join_table)
        
        if not selectable:
            self.selectable.extend(computed_selectable)
        if not self.selectable:
            raise ColumnError('error on given columns ! ')

        query = select(self.selectable).select_from(join_table)
        return query

    def init_count_statement(self):
        '''
        initialize "SELECT COUNT(*) FROM" statement,
        @returning :: SQLAlchemy Query Object
        '''
        self.selectable = []
        self.fk_join_list = []
        from_table = self.extend_from(self.model)
        from_table = self._from_foreign(from_table)
        query = select([func.count()]).select_from(from_table)
      
        
        return query

    def _select_from(self):
        '''
        initialize the "FROM" Statement
        @returning :: SQLAlchemy model or SQLAlchemy join/outerjoin, list of column element list(SQLAlchemy.Column)
        '''
        join_table = self.model
        selectable = [self.model]

        return join_table, selectable

    def _from_foreign(self, join_table):
        '''
        Apply join, over all detected foreign reference in selectable
        '''
        if self.selectable:
            for column in self.selectable:
                if self.is_foreign_reference(column):
                    foreign_infos = self.get_fk_column_and_table(column)
                    fk_target_table = foreign_infos['fk_target_table']

                    if fk_target_table in self.fk_join_list or fk_target_table == self.model_table:
                        continue
                    join_table = outerjoin(join_table, fk_target_table,
                                            self.model_table.c[foreign_infos['fk_column_name']] == fk_target_table.c[foreign_infos['fk_column_name_in_target']])
                    self.fk_join_list.append(fk_target_table)

        return join_table

    def extend_from(self, _from):
        '''
        @_from :: SQLAlchemy model or SQLAlchemy join/outerjoin

        Called after "FROM" Statement initialization (_select_from)
        function to override in order to apply custom junctures

        @returning :: SQLAlchemy model or SQLAlchemy join/outerjoin
        '''
        return _from

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
        query = self.apply_custom_filters(query, filters)
        query = self._order_by(query, order_by)
        query = self._limit(query, limit)
        query = self._offset(query, offset)
        return query

    def apply_filters(self, query, filters):
        for criteria in filters:
            query = self._where(query, criteria)
        return query

    def apply_custom_filters(self, query, filters):
        for criteria in filters:
            if criteria['Column'] in self.custom_filters:
                query = self.custom_filters.get(criteria['Column'])(self, query, criteria)
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
        if column is None:
            return query

        if self.is_foreign_reference(column):
            # TODO Filter on foreign Reference with sub query exists ? 
            print('filters on foreign ref : ',criteria['Column'])
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
        query = self.apply_custom_filters(query, filters)
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
                if column is None:
                    continue

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
        #SEARCH column by alias name (label)
        filter_aliased_column = list(filter(lambda x: x.__class__.__name__ == 'Label' and x.name == column_name , self.selectable))
        if len(filter_aliased_column) > 0:
            column = filter_aliased_column[0].element
            return column

        if self.is_foreign_reference(column_name):
            foreign_infos = self.get_fk_column_and_table(column_name)
            return foreign_infos['target_column']
        column = getattr(self.model, column_name, None)
        try:
            if column is None:
                column = self.model.c[column_name]
            
        except Exception as e:
            #raise error or just pass through ?? 
            # raise ColumnError('Column :col not exists !'.format(col=column_name))
            print('Column {col} not exists !'.format(col=column_name))
            column = None
        return column

    def is_foreign_reference(self, name):
        if name.__class__.__name__ == 'str' and '@' in name:
            fk_target_table_name = name.split('@')[0]
        elif name.__class__.__name__ =='InstrumentedAttribute':
            fk_target_table_name = name.table.name
        elif name.__class__.__name__ =='Label':
            fk_target_table_name = name.element.table.name
        else:
            return False

        found_fk_target = list(filter(lambda fk_name: self.fk_list[fk_name].column.table.name == fk_target_table_name , self.fk_list))
        if len(found_fk_target)>0:
            return True
        else:
            return False
    
    def get_fk_column_and_table(self, column_name):
        '''
        @column_name :: string or SQLAlchemy Column Object (InstrumentedAttribute),
        @returning :: SQLAlchemy Column Object, SQLAlchemy Table Object
        '''
        if column_name.__class__.__name__ == 'str' and '@' in column_name:
            fk_target_table_name = column_name.split('@')[0]
            fk_target_name = column_name.split('@')[1]
    
        elif column_name.__class__.__name__ =='InstrumentedAttribute' : 
            fk_target_table_name = column_name.table.name
            fk_target_name = column_name.name
        elif column_name.__class__.__name__ =='Label':
            fk_target_table_name = column_name.element.table.name
            fk_target_name = column_name.element.name

        for name, fk in self.fk_list.items():
            fk_target_table= fk.column.table
            fk_column_name_in_target = fk.column.name
            fk_column_name = name

            if fk_target_table.name == fk_target_table_name:
                target_column = fk_target_table.c[fk_target_name].label(fk_target_name)

                return {'fk_column_name_in_target':fk_column_name_in_target,
                        'fk_target_table':fk_target_table,
                        'fk_column_name':fk_column_name,
                        'target_column':target_column
                        }


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
        if column is None and not _property:
            return query

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
                        ~exists(exists_query),
                        exists(exists_query_null)
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
        join_table, selectable = QueryEngine._select_from(self)
        for prop in self.dynamic_properties:
            prop_in_select = list(filter(lambda x: x.element == self.get_column_by_name(prop['Name']) ,self.selectable))

            if not prop_in_select :
                continue

            _alias, column = self.get_alias_property_values(prop)
            join_table = outerjoin(
                        join_table, _alias,
                        and_(self.pk_model == _alias.c['FK_'+self.model.__tablename__],
                             _alias.c[self.model.fk_table_DynProp_name] == prop['ID'])
                    )
            selectable.append(column.label(prop['Name']))
        return join_table, selectable

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
        #return self.instance_model.get_property_by_name(property_name)

        try:
            prop = self.session.query(self.model.TypeClass.PropertiesClass).filter_by(Name=property_name).one()
            return prop.as_dict()
        except exc.NoResultFound:
            return None


class Query_engine():
    '''
    DECORATOR
    '''
    def __init__(self, param):
        self.from_inherit = QueryEngine
        self.param = param
        if len(list(filter(lambda x: x.__name__ == 'HasDynamicProperties' , param.__bases__)))>0:
            self.from_inherit = DynamicPropertiesQueryEngine
    
    def __call__(self, klass):
        return self.setCustomEngine(klass)

    @staticmethod
    def add_filter(klass, filter_name):
        def real_add_custom_filter(function):
            klass.custom_filters[filter_name] = function
            @wraps(function)
            def wrapper(self, *args, **kwargs):
                function(self, *args, **kwargs)
            return wrapper
        return real_add_custom_filter

    def setCustomEngine(self, cls):
        def init(instance, session, object_type=None, from_history=None):
            self.from_inherit.__init__(instance, session=session, model=self.param, object_type=object_type, from_history=from_history)

        new_class = type(cls.__name__,(self.from_inherit,)+cls.__bases__,dict(cls.__dict__))
        new_class.__init__ = init
        new_class.custom_filters = {}
        return new_class