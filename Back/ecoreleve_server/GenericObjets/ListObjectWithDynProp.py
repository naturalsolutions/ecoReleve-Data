from ecoreleve_server.Models import Base, DBSession
from sqlalchemy import (Column, DateTime, Float,
 ForeignKey, Index, Integer, Numeric,
  String, Text, Unicode, Sequence, select,and_,or_, exists)
from sqlalchemy.sql import text
from sqlalchemy.dialects.mssql.base import BIT
from sqlalchemy.orm import relationship
from collections import OrderedDict
from datetime import datetime
from .FrontModules import FrontModule,ModuleField
import transaction
from ecoreleve_server.utils import Eval
import pandas as pd
import json

eval_ = Eval()

class ListObjectWithDynProp():


    def __init__(self,ObjWithDynProp):
        self.ObjContext = DBSession
        self.ListPropDynValuesOfNow = {}
        self.ObjWithDynProp = ObjWithDynProp
        self.DynPropList = self.GetAllDynPropName()
        

    def GetDynPropValueView (self): 

        table = Base.metadata.tables[self.ObjWithDynProp.__tablename__+'DynPropValuesNow']
        return table

    def GetAllDynPropName(self) :
        DynPropTable = Base.metadata.tables[self.ObjWithDynProp().GetDynPropTable()]
        query = select([DynPropTable.c['Name'],DynPropTable.c['TypeProp']]).group_by(DynPropTable.c['Name'],DynPropTable.c['TypeProp'])

        result = self.ObjContext.execute(query).fetchall()

        result = pd.DataFrame(result,columns=['Name','TypeProp'])
        return result

    def LoadListNowValues(self,criteria={},offset=None,per_page=None, order_by=None):

            #### Perform queries to retrieve values of dynamic and static properties ####

            curQueryDynVal,curQueryStatVal = self.GetFullQueries(criteria)

            statValues = self.ObjContext.execute(curQueryStatVal).fetchall()
            dynValues = self.ObjContext.execute(curQueryDynVal).fetchall()

            #  TODO add offset , limit and order_by to the query

            self.statValues = statValues
            self.dynValues = dynValues

    def GetTypeProp (self,dynPropName) : 
        
        typeProp = self.DynPropList['TypeProp'].where(self.DynPropList['Name']==dynPropName).dropna().values[0]
        if typeProp == 'Integer':
            typeProp = 'Int'
        return typeProp
    def WhereInDynProp (self,query,criteriaObj) :

        dynPropName = criteriaObj['Column']
        typeProp = self.GetTypeProp(dynPropName)

        #### Perform the'where' in dyn props ####
        query = query.where(and_(self.GetDynPropValueView().c['Name'] == dynPropName
            , eval_.eval_binary_expr(self.GetDynPropValueView().c['Value'+typeProp],criteriaObj['Operator'],criteriaObj['Value'])
            ))
        return query

    def GetQueryInDynProp (self,obj) :

        query = select([self.GetDynPropValueView()]).where(
            self.GetDynPropValueView().c[self.ObjWithDynProp().GetSelfFKNameInValueTable()] == self.ObjWithDynProp.ID)
        query = self.WhereInDynProp(query,obj)

        return query

    def GetQueryInStatProp (self,query,obj) :
        #### perform 'where' in stat props ####
        if hasattr(self.ObjWithDynProp,obj['Column']) :
            query=query.where(eval_.eval_binary_expr(getattr(self.ObjWithDynProp,obj['Column']),obj['Operator'],obj['Value']))
        if 'Query' in obj :
            if obj['Operator'] == 'not exists' :
                query = query.where(~exists(obj['Value']))
        return query

    def GetFullQueries (self,criteria) :
        #### Build queries to get StaticProp and DynamicProp ####
        fullQueryDynVal = select([self.GetDynPropValueView()])
        fullQueryStatVal = select([self.ObjWithDynProp])
        subQuery = select([self.ObjWithDynProp.ID])

        if criteria != [] or criteria != {}:

            for obj in criteria:
                if obj['Value'] != None and obj['Value']!='':
                    #### build subquery for dyn props ####
                    subQuery = self.GetQueryInStatProp(subQuery,obj)
                    fullQueryStatVal = self.GetQueryInStatProp(fullQueryStatVal,obj)

                    if obj['Column'] in list(self.DynPropList['Name']) :

                        queryDynVal = self.GetQueryInDynProp(obj)
                        subQuery = subQuery.where(exists(queryDynVal))
                        fullQueryStatVal = fullQueryStatVal.where(exists(queryDynVal))

        fullQueryDynVal = fullQueryDynVal.where(
            self.GetDynPropValueView().c[self.ObjWithDynProp().GetSelfFKNameInValueTable()].in_(
                subQuery)
            )
        return fullQueryDynVal,fullQueryStatVal

    def GetFlatList(self,searchInfo=None) :

        # dictOrder = {'asc':1,'desc':0}
        if searchInfo is None or 'criteria' not in searchInfo:
            searchInfo['criteria'] = []
            print('********** NO Criteria ***************')

        ''' Solution test for order_by with pandas DataFrame but not good'''
        # if searchInfo is not None :
        #     if 'order_by' in searchInfo and searchInfo['order_by'] != None:
        #         order_by_clause = []
        #         print(' *************** ORDER BY ************')
        #         for obj in searchInfo['order_by'] :
        #             column, order = obj.split(':')
        #             if column in self.table.c:
        #                 if order == 'asc':
        #                     order_by_clause.append(self.table.c[column].asc())
        #                 elif order == 'desc':
        #                     order_by_clause.append(self.table.c[column].desc())
        #         if len(order_by_clause) > 0:
        #             query = query.order_by(*order_by_clause)


        self.LoadListNowValues(criteria=searchInfo['criteria'])

        allVal = pd.DataFrame()

        if len(self.statValues) > 0 :
            statValDF = pd.DataFrame(data=self.statValues, columns = self.ObjWithDynProp.__table__.columns.keys())
            if len(self.dynValues) > 0 :

                dynValDF = pd.DataFrame(data=self.dynValues, columns = self.GetDynPropValueView().columns.keys())
                # print(dynValDF)
                allVal = self.GetFlatDynVal(dynValDF,statValDF)
            else :
                allVal = statValDF

        ''' Solution test for order_by with pandas DataFrame but not good'''
        # if allVal.shape[0]>0 and searchInfo != None:
        #     if 'order_by' in searchInfo and searchInfo['order_by'] != None:
        #         cols =[]
        #         orderBool = []
        #         print(' *************** ORDER BY ************')
        #         for obj in searchInfo['order_by'] :
        #             column, order = obj.split(':')
        #             cols.append(column)
        #             orderBool.append(dictOrder[order])

        #         allVal = allVal.sort(cols,ascending = orderBool)

        #     if 'offset' in searchInfo and 'per_page' in searchInfo :
        #         if searchInfo['offset'] != None and searchInfo['per_page']:
                    
        #             offset =searchInfo['offset']
        #             limit = searchInfo['per_page']
        #             allVal = allVal[offset:offset+limit]

        return json.loads(allVal.to_json(orient='records', date_format = 'iso'))

    def GetFlatDynVal (self, dynValDF,statValDF) :
        #### add DynProp to staticProp as flat field ####
        Fk_Obj = self.ObjWithDynProp().GetSelfFKNameInValueTable()
        statValDF = statValDF.set_index(self.ObjWithDynProp.ID.name)
        #### Get list of dynamic properties and their TypeProp
        ListNameDynProp =dynValDF[['Name','TypeProp']].drop_duplicates()

        for nameProp in list(self.DynPropList['Name']):
            statValDF[nameProp] = None

        for i in dynValDF.index :
            row = dynValDF.ix[i]
            typeProp = self.GetTypeProp(row['Name'])
            statValDF.loc[row[Fk_Obj],row['Name']]= row['Value'+typeProp]

        return statValDF.reset_index()

    def OderBy (self) :

        return














