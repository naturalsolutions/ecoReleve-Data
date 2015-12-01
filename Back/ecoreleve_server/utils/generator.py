import operator, transaction
from sqlalchemy import *
import json,transaction
from ..Models import Base, DBSession
from collections import OrderedDict
from .eval import Eval
from .datetime import parse
import re


eval_ = Eval()

class Generator :

    def __init__(self,table):
        self.dictCell={
            'VARCHAR':'string',
            'NVARCHAR':'string',
            'INTEGER':'number',
            'DECIMAL':'number',
            'DATETIME':'date',
            'BIT':'boolean'
            }
        self.dictFilter = {
            'VARCHAR':'Text',
            'NVARCHAR':'Text',
            'INTEGER':'Number',
            'DECIMAL':'Number',
            'NUMERIC':'Number',
            'DATETIME':'DateTimePicker',
        }
        self.table=Base.metadata.tables[table]
        self.cols=[]

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
                else:
                    cell_type='string'
                final.append({'name':field_name,
                    'label':field_label,
                    'cell':cell_type,
                    'renderable':True,
                    'editable':False})
                # self.cols.append({'name':field_name,'type_grid':cell_type})
        else : 
            for col in self.table.c:
                field_name=col.name
                field_label=col.name
                
                field_type=self.table.c[col.name].type
                if field_type in self.dictCell:
                    cell_type=self.dictCell[field_type]
                else:
                    cell_type='string'
                final.append({'name':field_name,
                    'label':field_label,
                    'cell':cell_type,
                    'renderable':False,
                    'editable':False})
                self.cols.append({'name':field_name,'type_grid':cell_type})

        if(checked):
            final.append({'name': 'import','label': 'Import', 'cell': 'select-row', 'headerCell' : 'select-all'})
        return final

    def get_filters(self):
        data = []
        for column in self.table.c:
            name_c = str(column.name)
            try : 
                type_c = str(column.type).split('(')[0]
            except: pass
            if type_c in self.dictFilter :
                type_c = self.dictFilter[type_c]
            else : 
                type_c = 'Text'
            data.append({'name':name_c, 'type':type_c , 'title':name_c })
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
                    if 'date' in typeCol.lower() : 
                        obj['Value'] = parse(obj['Value'].replace(' ',''))
                except: 
                    Col=dictio[key]
                query=self.where_(query,Col, obj['Operator'], obj['Value'])
        return query

    def search(self,criteria={},offset=None,per_page=None, order_by=None, columnsList = None) :
        result=[]
        total=None
        query = self.getFullQuery(criteria,columnsList=columnsList)
        if offset!=None:
            query, total=self.get_page(query,offset,per_page, order_by)

        data = DBSession.execute(query).fetchall()
        if(total or total == 0):
            result = [{'total_entries':total}]
            result.append([OrderedDict(row) for row in data])
        else :
            result = [OrderedDict(row) for row in data]
        transaction.commit()
        return result

    def count_(self,criteria={}):
        query = self.getFullQuery(criteria,count=True)
        print(query)
        countResult = DBSession.execute(query).scalar()
        return countResult

    def get_page(self,query,offset,limit,order_by):
        total = DBSession.execute(select([func.count()]).select_from(query.alias())).scalar()
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
        # Define the limit and offset if exist
        if limit > 0:
            query = query.limit(limit)
        if offset > 0:
            query = query.offset(offset)
        return query, total
    
    def get_geoJSON(self,criteria={}) :
        result=[]
        total=None
        countResult = self.count_(criteria)

        if 'lat' in self.table.c or 'LAT'in self.table.c:
            if(countResult <= 50000):
                query = self.getFullQuery(criteria)
                try :
                    data=DBSession.execute(query.where(self.table.c['LAT'] != None)).fetchall()
                except :
                    try:
                        data=DBSession.execute(query.where(self.table.c['lat'] != None)).fetchall()
                    except:
                        pass

                tmp = data[0]
                lat = self.case(tmp, 'LAT')
                lon = self.case(tmp, 'LON')
                geoJson=[]
                for row in data:
                    properties = {}
                    # if cols_for_properties != None :
                    #     for col in cols_for_properties :
                    #         properties[col.replace('_',' ')] = row[col]
                    geoJson.append({'type':'Feature', 'properties':properties, 'geometry':{'type':'Point', 'coordinates':[row[lat],row[lon]]}})
                transaction.commit()
                return {'type':'FeatureCollection', 'features': geoJson, 'exceed': False, 'total':countResult}
        else :
            return {'type':'FeatureCollection', 'features': [],'exceed': True, 'total':countResult}
                

    def case(self, row, arg) :
        if( arg in row ) :
            return arg
        else :
            return arg.lower()


