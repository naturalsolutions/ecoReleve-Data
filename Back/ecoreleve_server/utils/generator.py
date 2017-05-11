import operator, transaction
from sqlalchemy import *
import json,transaction
from ..Models import BaseExport, DBSession,Base
from collections import OrderedDict
from .eval import Eval
from .datetime import parse
import re
from pyramid import threadlocal
from traceback import print_exc
from datetime import datetime


eval_ = Eval()

class Generator :

    def __init__(self,table,sessionMaker):
        self.sessionMaker = sessionMaker
        self.dictCell={
            'VARCHAR':'string',
            'NVARCHAR':'string',
            'INTEGER':'number',
            'DECIMAL':'number',
            'DATETIME':'string',
            'DATE':'string',
            'TIME':'string',
            'BIT':'boolean'
            }
        self.dictFilter = {
            'VARCHAR':'Text',
            'NVARCHAR':'Text',
            'INTEGER':'Number',
            'DECIMAL':'Number',
            'NUMERIC':'Number',
            'DATETIME':'DateTimePickerEditor',
            'DATE':'DateTimePickerEditor',
            'TIME':'DateTimePickerEditor',
        }
        try : 
            self.table=BaseExport.metadata.tables[table]
        except :
            try :
                self.table=Base.metadata.tables[table]
            except:
                self.table = table

        self.cols=[]
        self.columnLower = {c.name.lower():c.name for c in self.table.c}
        self.splittedColumnLower = {c.name.lower().replace('_',''):c.name for c in self.table.c}

    def get_col(self,columnsList=False, checked=False):
        ###### model of columnsList #####
        final=[]
        if columnsList :
            for col in columnsList:
                field_name=col
                field_label=col
                field_type=str(self.table.c[field_name].type).split('(')[0]
                if field_type in self.dictCell:
                    cell_type=self.dictCell[field_type]
                    cell_type = 'string'
                else:
                    cell_type='string'
                final.append({'field':field_name,
                    'headerName':field_label,
                    'cell':cell_type,
                    'editable':False})
                # self.cols.append({'name':field_name,'type_grid':cell_type})
        else : 
            for col in self.table.c:
                field_name=col.name
                field_label=col.name
                
                field_type=self.table.c[col.name].type
                if field_type in self.dictCell:
                    cell_type=self.dictCell[field_type]
                    cell_type='string'
                    
                else:
                    cell_type='string'
                final.append({'field':field_name,
                    'headerName':field_label,
                    'cell':cell_type,
                    'editable':False})
                self.cols.append({'name':field_name,'type_grid':cell_type})

        if(checked):
            final.append({'name': 'import','label': 'Import', 'cell': 'select-row', 'headerCell' : 'select-all'})
        return final

    def get_filters(self):
        data = []
        options = None
        for column in self.table.c:
            name_c = str(column.name)
            options = None
            try :
                db_type = str(column.type).split('(')[0]
            except: 
                db_type = None
                pass
            if db_type in self.dictFilter :
                type_f = self.dictFilter[db_type]
                if type_f == 'DateTimePickerEditor':
                    if db_type == 'TIME':
                        options ={'format':'hh:mm:ss'}
                    elif db_type == 'DATE':
                        options ={'format':'DD/MM/YYYY'}
                    else : 
                        options ={'format':'DD/MM/YYYY hh:mm:ss'}
            else :
                type_f = 'Text'
            data.append({'name':name_c, 'type':type_f , 'title':name_c, 'options':options})

        return data

    def where_(self,query,col,operator,value):
        return query.where(eval_.eval_binary_expr(self.table.c[col], operator, value))

    def getFullQuery(self,criteria={},count=False, columnsList = None):
        if count:
            query = select([func.count()]).select_from(self.table)
        elif columnsList is not None :
            query = select(columnsList)
        else:
            query = select(self.table.c)
        for obj in criteria:
            if obj['Value'] != None and obj['Value']!='':
                try:
                    Col=obj['Column']
                    typeCol = str(self.table.c[Col].type).split('(')[0]
                    if 'date' in typeCol.lower() and isinstance(obj['Value'],str):
                        try :
                            obj['Value'] = parse(obj['Value'].replace(' ',''))
                        except: pass
                except:
                    print_exc()
                    # Col=dictio[key]
                query=self.where_(query,Col, obj['Operator'], obj['Value'])
        return query

    def search(self,criteria={},offset=None,per_page=None, order_by=None, columnsList = None) :
        result=[]
        total=None
        query = self.getFullQuery(criteria,columnsList=columnsList)
        if offset!=None:
            query, total=self.get_page(query,offset,per_page, order_by)

        data = self.sessionMaker.execute(query).fetchall()
        if(total or total == 0):
            result = [{'total_entries':total}]
            result.append([OrderedDict(row) for row in data])
        else :
            result = [OrderedDict(row) for row in data]
        transaction.commit()
        return result

    def count_(self,criteria={}):
        query = self.getFullQuery(criteria,count=True)
        countResult = self.sessionMaker.execute(query).scalar()
        return countResult

    def get_page(self,query,offset,limit,order_by):
        total = self.sessionMaker.execute(select([func.count()]).select_from(query.alias())).scalar()
        order_by_clause = []
        query = self.get_order(query, order_by)
        # Define the limit and offset if exist
        if limit > 0:
            query = query.limit(limit)
        if offset > 0:
            query = query.offset(offset)
        return query, total

    def get_order(self, query, order_by):
        order_by_clause = []
        for obj in order_by:
            column, order = obj.split(':')
            #if column in dictio :
            #    column=dictio[column]
            if column in self.table.c:
                if order == 'asc':
                    order_by_clause.append(self.table.c[column].asc())
                elif order == 'desc':
                    order_by_clause.append(self.table.c[column].desc())
        if len(order_by_clause) > 0:
            query = query.order_by(*order_by_clause)
        else :
            col= self.table.c[self.table.c.keys()[0]].asc()
            query = query.order_by(col)
        return query
    
    def get_geoJSON(self,criteria={}, geoJson_properties = None, order_by=None) :
        result=[]
        total=None
        countResult = self.count_(criteria)

        exceed = None
        geoJson=[]
        if 'lat' in self.columnLower:
            if countResult <= 100000 :
                exceed = False
                query = self.getFullQuery(criteria)
                if order_by:
                    query = self.get_order(query, order_by)
                try :
                    data=self.sessionMaker.execute(query.where(self.table.c[self.columnLower['lat']] != None)).fetchall()
                except :
                    print_exc()
                for row in data:
                    properties = {}
                    if geoJson_properties != None :
                        for col in geoJson_properties :
                            properties[col] = row[col]
                    geoJson.append({'type':'Feature', 'properties':properties, 'geometry':{'type':'Point'
                        , 'coordinates':[row[self.columnLower['lat']],row[self.columnLower['lon']]]}})
            else :
                exceed = True
        return {'type':'FeatureCollection', 'features': geoJson,'exceed': exceed, 'total':countResult}

    def case(self, row, arg) :
        if( arg in row ) :
            return arg
        else :
            return arg.lower()
