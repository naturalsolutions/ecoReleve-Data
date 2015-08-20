from ecoreleve_server.Models import Base, DBSession
from sqlalchemy import (Column, DateTime, Float,
 ForeignKey, Index, Integer, Numeric,
  String, Text, Unicode, Sequence, select,and_,or_, exists,func, join, outerjoin)
from sqlalchemy.sql import text
from sqlalchemy.dialects.mssql.base import BIT
from sqlalchemy.orm import relationship, aliased
from collections import OrderedDict
from datetime import datetime
from .FrontModules import FrontModules,ModuleGrids
import transaction
from ecoreleve_server.utils import Eval
import pandas as pd
import json
from traceback import print_exc


eval_ = Eval()

class ListObjectWithDynProp():


    def __init__(self,ObjWithDynProp, frontModule):
        self.ObjContext = DBSession
        self.ListPropDynValuesOfNow = {}
        self.ObjWithDynProp = ObjWithDynProp
        self.DynPropList = self.GetDynPropList()
        self.frontModule = frontModule
        self.Conf = frontModule.ModuleGrids
        self.vAliasList = {}
        self.joinTable = None


    def GetDynPropValueView (self): 

        table = Base.metadata.tables[self.ObjWithDynProp.__tablename__+'DynPropValuesNow']
        return table

    def GetAllPropNameInConf(self) :

        DynPropsDisplay = list(filter(lambda x : x.IsSearchable == True or x.GridRender >= 2  , self.Conf))
        return DynPropsDisplay

    def GetJoinTable (self) :
        ''' build join table to filter and retrieve all data type (Static and Dynamic) '''
        joinTable = self.ObjWithDynProp
        view = self.GetDynPropValueView()
        selectable = [self.ObjWithDynProp.ID]
        i = 1
        objTable = self.ObjWithDynProp.__table__

        #  get all foreign keys
        fk_list = {fk.parent.name : fk for fk in self.ObjWithDynProp.__table__.foreign_keys}

        for objConf in self.GetAllPropNameInConf() :

            curDynProp = self.GetDynProp(objConf.Name)
            if objConf.Name in fk_list and objConf.QueryName is not None:
                tableRef = fk_list[objConf.Name].column.table
                nameRef = fk_list[objConf.Name].column.name
                joinTable = outerjoin (joinTable,tableRef,objTable.c[objConf.Name] == tableRef.c[nameRef])
                selectable.append(tableRef.c[objConf.QueryName])


            elif curDynProp != None and objConf.Name in self.ObjWithDynProp().GetAllProp():
                print(curDynProp)
                v = view.alias('v'+curDynProp['Name'])

                self.vAliasList['v'+curDynProp['Name']] = v

                joinTable = outerjoin(
                    joinTable,v
                    , and_(self.ObjWithDynProp.ID == v.c[self.ObjWithDynProp().GetSelfFKNameInValueTable()] 
                        , v.c[self.ObjWithDynProp().GetDynPropFKName()] == curDynProp['ID']) 
                    )

                selectable.append(v.c['Value'+curDynProp['TypeProp']].label(curDynProp['Name']))
                i+=1
            elif objConf.QueryName is not None :
                try : 
                    print('JOIN OUTER OBJ GO')
                    print(objConf.QueryName)
                    print(type(objConf.QueryName))
                    jsonQuery =json.loads(objConf.QueryName)
                    tableRef = Base.metadata.tables[jsonQuery['table']]
                    joinTable = outerjoin (joinTable,tableRef,objTable.c[jsonQuery['tableJoin']] == tableRef.c[jsonQuery['joinON']])
                    self.jsonQuery = jsonQuery
                    print('JOIN OUTER OBJ ===> OK')

                except :
                    print_exc()
                    pass

            else :
                selectable.append(objTable.c[objConf.Name])
        self.selectable = selectable
        return joinTable
    def AddJoinFields (self,selectable,joinTable):

        for obj in self.ObjWithDynProp.__table__.foreign_keys :
            if 'Type' not in obj.column.table.name : 
                return


    def GetDynPropList (self) : 

        DynPropTable = Base.metadata.tables[self.ObjWithDynProp().GetDynPropTable()]
        query = select([DynPropTable]) #.where(DynPropTable.c['Name'] == dynPropName)
        result  = DBSession.execute(query).fetchall()

        df = pd.DataFrame(result, columns = DynPropTable.columns.keys())

        return df

    def GetDynProp (self,dynPropName) : 

        curDynProp = self.DynPropList[self.DynPropList['Name'] == dynPropName]
        curDynProp = curDynProp.to_dict(orient = 'records')

        if curDynProp != [] :

            curDynProp = curDynProp[0]
            if curDynProp['TypeProp'] == 'Integer':
                curDynProp['TypeProp'] = 'Int'
            return curDynProp
        else : 
            return None


    def WhereInJoinTable (self,query,criteriaObj) :

        curProp = criteriaObj['Column']
        
        if hasattr(self.ObjWithDynProp,curProp) :
            query = query.where(
                eval_.eval_binary_expr(self.ObjWithDynProp.__table__.c[curProp],criteriaObj['Operator'],criteriaObj['Value'])
                )
        elif curProp in self.ObjWithDynProp().GetAllProp() : 
            curDynProp = self.GetDynProp(curProp)
            viewAlias = self.vAliasList['v'+curDynProp['Name']]

            #### Perform the'where' in dyn props ####
            query = query.where(
                eval_.eval_binary_expr(viewAlias.c['Value'+curDynProp['TypeProp']],criteriaObj['Operator'],criteriaObj['Value'])
            )
        elif self.jsonQuery and curProp ==self.jsonQuery['where'] :
            tableRef = tableRef = Base.metadata.tables[self.jsonQuery['table']]
            query = query.where(
                eval_.eval_binary_expr(tableRef.c[curProp],criteriaObj['Operator'],criteriaObj['Value'])
            )
    


        return query


    def GetFullQuery(self,searchInfo=None) :

        # dictOrder = {'asc':1,'desc':0}
        if searchInfo is None or 'criteria' not in searchInfo:
            searchInfo['criteria'] = []
            print('********** NO Criteria ***************')

        joinTable = self.GetJoinTable()
        fullQueryJoin = select(self.selectable).select_from(joinTable)
        countQuery = select([func.count('ID')]).select_from(joinTable)

        for obj in searchInfo['criteria'] :
            fullQueryJoin = self.WhereInJoinTable(fullQueryJoin,obj)
            countQuery = self.WhereInJoinTable(countQuery,obj)

        # print(countQuery)
        self.countQuery = countQuery 
        fullQueryJoinOrdered = self.OderByAndLimit(fullQueryJoin,searchInfo)

        return fullQueryJoinOrdered

    def GetFlatDataList(self,searchInfo=None) :

        fullQueryJoinOrdered = self.GetFullQuery(searchInfo)

        result = DBSession.execute(fullQueryJoinOrdered).fetchall()

        data = []
        for row in result :
            row = OrderedDict(row)
            row['StationDate']= row['StationDate'].strftime('%d/%m/%Y %H:%M:%S')
            data.append(row)
        return data


    def count(self,searchInfo = None) :

        if self.countQuery is None :
            if searchInfo is None :
                return 'error'
            self.GetFullQuery(searchInfo)

        query = self.countQuery

        count = DBSession.execute(query).scalar()
        # print(count)
        return count

    def OderByAndLimit (self, query, searchInfo) :

        if len(searchInfo['order_by']) > 0 : 

            for obj in searchInfo['order_by']:
                order_by_clause = []
                curProp, order = obj.split(':')
                curDynProp = self.GetDynProp(curProp)

                if curDynProp is not None :
                    viewAlias = self.vAliasList['v'+curDynProp['Name']]
                    trueCol = viewAlias.c['Value'+curDynProp['TypeProp']]
                    # print (trueCol)

                else :
                    trueCol = curProp

                if order == 'asc':
                    try : 
                        order_by_clause.append(trueCol.asc())
                    except : 
                        order_by_clause.append(self.ObjWithDynProp.__table__.c[trueCol].asc())
                elif order == 'desc':
                    try : 
                        order_by_clause.append(trueCol.desc())
                    except : 
                        order_by_clause.append(self.ObjWithDynProp.__table__.c[trueCol].desc())
            if len(order_by_clause) > 0:
                query = query.order_by(*order_by_clause)

        else :
            query = query.order_by(self.ObjWithDynProp.__table__.c['ID'].asc())

            # Define the limit and offset if exist
        if 'per_page' in searchInfo :
            limit = int(searchInfo['per_page'])
            query = query.limit(limit)

        if 'offset' in searchInfo :
            offset = int(searchInfo['offset'])
            query = query.offset(offset)

        return query







    # def GetFlatDynVal (self, dynValDF,statValDF) :
    #     #### add DynProp to staticProp as flat field ####
    #     Fk_Obj = self.ObjWithDynProp().GetSelfFKNameInValueTable()
    #     statValDF = statValDF.set_index(self.ObjWithDynProp.ID.name)
    #     #### Get list of dynamic properties and their TypeProp
    #     ListNameDynProp =dynValDF[['Name','TypeProp']].drop_duplicates()

    #     for nameProp in list(self.DynPropList['Name']):
    #         statValDF[nameProp] = None

    #     for i in dynValDF.index :
    #         row = dynValDF.ix[i]
    #         typeProp = self.GetTypeProp(row['Name'])
    #         statValDF.loc[row[Fk_Obj],row['Name']]= row['Value'+typeProp]

    #     return statValDF.reset_index()

    # def LoadListNowValues(self,searchInfo):

    #         #### Perform queries to retrieve values of dynamic and static properties ####

    #         curQueryDynVal,curQueryStatVal = self.GetFullQueries(searchInfo)
    #         self.curQueryStatVal = curQueryStatVal

    #         # static = aliased(curQueryStatVal)
    #         # dyn = aliased(curQueryDynVal.where(self.GetDynPropValueView().c['Name'] == 'FieldWorker1'))
    #         # joined = join(static,dyn,static.c['ID'] == dyn.c[self.ObjWithDynProp().GetSelfFKNameInValueTable()]
    #         #     )


    #         # joined = static.join(dyn,static.c['ID'] == dyn.c[self.ObjWithDynProp().GetSelfFKNameInValueTable()]
    #         #     )

    #         # query = select([static.c['ID']]).select_from(joined).order_by(dyn.c['Value'+self.GetTypeProp('FieldWorker1')])

    #         # print(query)
    #         # print(self.ObjContext.execute(query).fetchall())

    #         print(curQueryStatVal.limit(25).order_by(self.ObjWithDynProp.ID).offset(25))
    #         statValues = self.ObjContext.execute(curQueryStatVal).fetchall()
    #         dynValues = self.ObjContext.execute(curQueryDynVal).fetchall()

    #         #  TODO add offset , limit and order_by to the query

    #         self.statValues = statValues
    #         self.dynValues = dynValues


    # def GetQueryInDynProp (self,obj) :

    #     query = select([self.GetDynPropValueView()]).where(
    #         self.GetDynPropValueView().c[self.ObjWithDynProp().GetSelfFKNameInValueTable()] == self.ObjWithDynProp.ID)
    #     query = self.WhereInDynProp(query,obj)

    #     return query

    # def GetQueryInStatProp (self,query,obj) :
    #     #### perform 'where' in stat props ####
    #     if hasattr(self.ObjWithDynProp,obj['Column']) :
    #         query=query.where(eval_.eval_binary_expr(getattr(self.ObjWithDynProp,obj['Column']),obj['Operator'],obj['Value']))
    #     if 'Query' in obj :
    #         if obj['Operator'] == 'not exists' :
    #             query = query.where(~exists(obj['Value']))
    #     return query

    # def GetFullQueries (self,searchInfo) :
    #     #### Build queries to get StaticProp and DynamicProp ####
    #     fullQueryDynVal = select([self.GetDynPropValueView()])
    #     fullQueryStatVal = select([self.ObjWithDynProp])
    #     subQuery = select([self.ObjWithDynProp.ID])

    #     criteria = searchInfo['criteria']
    #     if criteria != [] or criteria != {}:

    #         for obj in criteria:
    #             if obj['Value'] != None and obj['Value']!='':
    #                 #### build subquery for dyn props ####
    #                 subQuery = self.GetQueryInStatProp(subQuery,obj)
    #                 fullQueryStatVal = self.GetQueryInStatProp(fullQueryStatVal,obj)

    #                 if obj['Column'] in list(self.DynPropList['Name']) :

    #                     queryDynVal = self.GetQueryInDynProp(obj)
    #                     subQuery = subQuery.where(exists(queryDynVal))
    #                     fullQueryStatVal = fullQueryStatVal.where(exists(queryDynVal))

    #     fullQueryStatVal = fullQueryStatVal.limit(25).order_by(self.ObjWithDynProp.ID).offset(25)
    #     fullQueryDynVal = fullQueryDynVal.where(
    #         self.GetDynPropValueView().c[self.ObjWithDynProp().GetSelfFKNameInValueTable()].in_(
    #             subQuery)
    #         )
    #     return fullQueryDynVal,fullQueryStatVal








