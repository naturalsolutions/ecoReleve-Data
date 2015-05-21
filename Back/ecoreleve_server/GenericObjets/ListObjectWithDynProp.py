from ecoreleve_server.Models import Base
from sqlalchemy import (Column, DateTime, Float,
 ForeignKey, Index, Integer, Numeric,
  String, Text, Unicode, text,Sequence, select,and_,or_, exists)
from sqlalchemy.dialects.mssql.base import BIT
from sqlalchemy.orm import relationship
from collections import OrderedDict
from datetime import datetime
from .FrontModules import FrontModule,ModuleField
import transaction
from ecoreleve_server.utils import Eval
import pandas as pd


eval_ = Eval()

class ListObjectWithDynProp():


    def __init__(self,ObjContext,ObjWithDynProp, searchInfo = None):
        self.ObjContext = ObjContext
        self.ListPropDynValuesOfNow = {}
        self.ObjWithDynProp = ObjWithDynProp
        self.DynPropList = self.GetAllDynPropName()
        if searchInfo is None :
            self.statValues = None
            self.dynValues = None
        else : 
            self.LoadListNowValues(criteria=searchInfo['criteria'])
             #  TODO add offset , limit and order_by to the query

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

            #### Perform a query to retrieve values of dynamic properties ####

            curQueryDynVal,curQueryStatVal = self.GetFullQueries(criteria)
            statValues = self.ObjContext.execute(curQueryStatVal).fetchall()
            dynValues = self.ObjContext.execute(curQueryDynVal).fetchall()

            #  TODO add offset , limit and order_by to the query
            #  
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

        print ('\n\n********* typeProp ************ ')
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

        if hasattr(self.ObjWithDynProp,obj['Column']) :
            query=query.where(eval_.eval_binary_expr(getattr(self.ObjWithDynProp,obj['Column']),obj['Operator'],obj['Value']))
        return query

    def GetFullQueries (self,criteria) :
        #### Build queries to get StaticProp and DynamicProp ####
        fullQueryDynVal = select([self.GetDynPropValueView()])
        fullQueryStatVal = select([self.ObjWithDynProp])
        subQuery = select([self.ObjWithDynProp.ID])

        if criteria != [] :
            for obj in criteria:
                if obj['Value'] != None and obj['Value']!='':
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

    def GetFlatList(self) :

        allVal = pd.DataFrame()
        if len(self.statValues) > 0 :
            statValDF = pd.DataFrame(data=self.statValues, columns = self.ObjWithDynProp.__table__.columns.keys())
            if len(self.dynValues) > 0 :
                dynValDF = pd.DataFrame(data=self.dynValues, columns = self.GetDynPropValueView().columns.keys())
                allVal = self.GetFlatDynVal(dynValDF,statValDF)
            else :
                allVal = statValDF

        return allVal.to_json(orient='records',date_format='iso')

    def GetFlatDynVal (self, dynValDF,statValDF) :
        #### add DynProp to staticProp as flat field ####
        Fk_Obj = self.ObjWithDynProp().GetSelfFKNameInValueTable()
        statValDF = statValDF.set_index(self.ObjWithDynProp.ID.name)
        print('\n\n________DynProp Col : ______________')
        #### Get list of dynamic properties and their TypeProp
        ListNameDynProp =dynValDF[['Name','TypeProp']].drop_duplicates()

        # for i in ListNameDynProp.index :
        #     statValDF[ListNameDynProp.ix[i]['Name']] = None
        # print(statValDF)

        for nameProp in list(self.DynPropList['Name']):
            statValDF[nameProp] = None

        for i in dynValDF.index :
            row = dynValDF.ix[i]
            typeProp = self.GetTypeProp(row['Name'])
            statValDF.loc[row[Fk_Obj],row['Name']]= row['Value'+typeProp]
            

        return statValDF.reset_index()














