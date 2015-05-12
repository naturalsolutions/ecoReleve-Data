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



    def __init__(self,ObjContext,ObjWithDynProp):
        self.ObjContext = ObjContext
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

            #### Perform a query to retrieve values of dynamic properties ####

            curQueryDynVal,curQueryStatVal = self.GetFullQueries(criteria)
            statValues = self.ObjContext.execute(curQueryStatVal).fetchall()
            dynValues = self.ObjContext.execute(curQueryDynVal).fetchall()
            #  TODO add offset , limit and order_by to the query
            #  
            return statValues,dynValues

    def WhereInDynProp (self,query,criteriaObj) :

        dynPropName = criteriaObj['NameProp']
        typeProp = self.DynPropList['TypeProp'].where(self.DynPropList['Name']==dynPropName).dropna().values[0]

        print ('\n\n********* typeProp ************ ')
        print(typeProp)
        query = query.where(and_(self.GetDynPropValueView().c['Name'] == dynPropName
            , eval_.eval_binary_expr(self.GetDynPropValueView().c['Value'+typeProp],criteriaObj['Operator'],criteriaObj['Value'])
            ))
        return query

    def GetQueryInDynProp (self,obj) :

        query = select([self.GetDynPropValueView()]).where(
            self.GetDynPropValueView().c[self.ObjWithDynProp().GetSelfFKNameInValueTable()] == self.ObjWithDynProp.ID)
        query = self.WhereInDynProp(query,obj)
        print('\n\n________DynProp query : ______________')
        print (query)
        return query

    def GetQueryInStatProp (self,query,obj) :

        if hasattr(self.ObjWithDynProp,obj['NameProp']) :
            query=query.where(eval_.eval_binary_expr(getattr(self.ObjWithDynProp,obj['NameProp']),obj['Operator'],obj['Value']))
            print('\n\n________StatProp query : ______________')
            print (query)
        return query

    def GetFullQueries (self,criteria) :

        fullQueryDynVal = select([self.GetDynPropValueView()])
        fullQueryStatVal = select([self.ObjWithDynProp])
        subQuery = select([self.ObjWithDynProp.ID])
        if criteria != [] :
            for obj in criteria:
                if obj['Value'] != None and obj['Value']!='':
                    subQuery = self.GetQueryInStatProp(subQuery,obj)
                    fullQueryStatVal = self.GetQueryInStatProp(fullQueryStatVal,obj)
                    if obj['NameProp'] in list(self.DynPropList['Name']) :

                        queryDynVal = self.GetQueryInDynProp(obj)
                        subQuery = subQuery.where(exists(queryDynVal))
                        fullQueryStatVal = fullQueryStatVal.where(exists(queryDynVal))

        fullQueryDynVal = fullQueryDynVal.where(
            self.GetDynPropValueView().c[self.ObjWithDynProp().GetSelfFKNameInValueTable()].in_(
                subQuery)
            )
        return fullQueryDynVal,fullQueryStatVal

    def GetFlatList(self) :
        # TODO 
        statVal,dynVal = self.LoadListNowValues()
        statVal = pd.DataFrame(data=statVal)
        dynVal = self.GetFlatDynVal(pd.DataFrame(data=dynVal),statVal)

    def GetFlatDynVal (self, dynValDF,statValDF) :

        Fk_Obj = self.ObjWithDynProp().GetSelfFKNameInValueTable()
        for row in self.DynPropList :
            statValDF[row['Name']] = None

        for row in dynValDF : 
            statValDF[row['Name']][row['ID'] ==row[Fk_Obj]] = dynValDF
        return 














