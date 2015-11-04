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
    ''' This class is used to filter Object with dyn props over all properties '''
    def __init__(self,ObjWithDynProp, frontModule, history = False, View = None):
        self.ObjContext = DBSession
        self.ListPropDynValuesOfNow = {}
        self.ObjWithDynProp = ObjWithDynProp
        self.DynPropList = self.GetDynPropList()
        self.frontModule = frontModule
        self.Conf = frontModule.ModuleGrids
        self.vAliasList = {}
        self.optionView = View
        self.history = history

    def GetDynPropValueView (self): 
        ''' WARNING !!! : in order to use this class you have to build View over last DATE of dynamic properties '''
        table = Base.metadata.tables[self.ObjWithDynProp.__tablename__+'DynPropValuesNow']
        if self.history: 
            dynPropTable = Base.metadata.tables[self.ObjWithDynProp().GetDynPropTable()]
            valueTable = Base.metadata.tables[self.ObjWithDynProp().GetDynPropValuesTable()]
            joinTable = join(valueTable,dynPropTable
                ,valueTable.c[self.ObjWithDynProp().GetDynPropFKName()] == dynPropTable.c['ID'])
            table = select([valueTable,dynPropTable.c['Name'].label('Name'),dynPropTable.c['TypeProp'].label('TypeProp')]
                ).select_from(joinTable)
        return table

    def GetAllPropNameInConf(self) :
        ''' Get configured properties to display '''
        DynPropsDisplay = list(filter(lambda x : x.IsSearchable == True or x.GridRender >= 2  , self.Conf))
        return DynPropsDisplay

    def GetJoinTable (self,searchInfo) :
        ''' build join table and select statement over all dynamic properties and foreign keys in filter query'''
        joinTable = self.ObjWithDynProp
        view = self.GetDynPropValueView()
        selectable = [self.ObjWithDynProp.ID]
        objTable = self.ObjWithDynProp.__table__
        self.firstStartDate = None

        ##### get all foreign keys #####
        self.fk_list = {fk.parent.name : fk for fk in self.ObjWithDynProp.__table__.foreign_keys}

        for objConf in self.GetAllPropNameInConf() :
            # print(objConf.Name)
            curDynProp = self.GetDynProp(objConf.Name)
            if objConf.Name in self.fk_list and objConf.QueryName is not None:
                tableRef = self.fk_list[objConf.Name].column.table
                nameRef = self.fk_list[objConf.Name].column.name

                joinTable = outerjoin (joinTable,tableRef,objTable.c[objConf.Name] == tableRef.c[nameRef])
                selectable.append(tableRef.c[objConf.QueryName])

            elif curDynProp != None: #and objConf.Name in self.ObjWithDynProp().GetAllProp():
                v = view.alias('v'+curDynProp['Name'])
                self.vAliasList['v'+curDynProp['Name']] = v

                if self.history is False or self.firstStartDate is None :
                    joinTable = outerjoin(
                        joinTable,v
                        , and_(self.ObjWithDynProp.ID == v.c[self.ObjWithDynProp().GetSelfFKNameInValueTable()] 
                            , v.c[self.ObjWithDynProp().GetDynPropFKName()] == curDynProp['ID']) 
                        )
                    selectable.append(v.c['Value'+curDynProp['TypeProp']].label(curDynProp['Name']))
                    if self.history :
                        selectable.append(v.c['StartDate'])
                        self.firstStartDate = 'v'+curDynProp['Name']
                else:
                    tmpV = self.vAliasList[self.firstStartDate] 
                    joinTable = outerjoin(
                        joinTable,v
                        , and_(v.c['StartDate'] == tmpV.c['StartDate'],and_(self.ObjWithDynProp.ID == v.c[self.ObjWithDynProp().GetSelfFKNameInValueTable()] 
                            , v.c[self.ObjWithDynProp().GetDynPropFKName()] == curDynProp['ID']))
                        )
                    selectable.append(v.c['Value'+curDynProp['TypeProp']].label(curDynProp['Name']))

            elif self.optionView is not None and objConf.Name in self.optionView.c:
                if self.optionView.name not in self.vAliasList:
                    joinTable = outerjoin(joinTable,self.optionView, self.ObjWithDynProp.ID == self.optionView.c['FK_'+self.ObjWithDynProp.__tablename__])
                    self.vAliasList[self.optionView.name] = self.optionView
                selectable.append(self.optionView.c[objConf.Name])

            elif hasattr(self.ObjWithDynProp,objConf.Name):
                selectable.append(objTable.c[objConf.Name])
        self.selectable = selectable
        return joinTable

    def GetDynPropList (self) :
        ''' Retrieve all dynamic properties of object ''' 
        DynPropTable = Base.metadata.tables[self.ObjWithDynProp().GetDynPropTable()]
        query = select([DynPropTable]) #.where(DynPropTable.c['Name'] == dynPropName)
        result  = DBSession.execute(query).fetchall()

        if result == []:
            df = None
        else :

            df = pd.DataFrame(result, columns = DynPropTable.columns.keys())
        return df

    def GetDynProp (self,dynPropName) : 
        ''' Get dyn Prop with its name '''


        if self.DynPropList is not None :
            curDynProp = self.DynPropList[self.DynPropList['Name'] == dynPropName]
            curDynProp = curDynProp.to_dict(orient = 'records')
        else :
            curDynProp = None
            
        if curDynProp != [] and curDynProp is not None:
            curDynProp = curDynProp[0]
            if curDynProp['TypeProp'] == 'Integer':
                curDynProp['TypeProp'] = 'Int'
            return curDynProp
        else : 
            return None

    def WhereInJoinTable (self,query,criteriaObj) :
        ''' Apply where clause over filter criteria '''
        curProp = criteriaObj['Column']
 
        if hasattr(self.ObjWithDynProp,curProp) :
            # static column criteria
            query = query.where(
                eval_.eval_binary_expr(self.ObjWithDynProp.__table__.c[curProp],criteriaObj['Operator'],criteriaObj['Value'])
                )

        elif self.optionView is not None and curProp in self.optionView.c:
            query = query.where(
                eval_.eval_binary_expr(self.optionView.c[curProp],criteriaObj['Operator'],criteriaObj['Value'])
                )
        else:
            #try :
            curDynProp = None
            for x in self.ObjWithDynProp().GetAllProp():
                if x['name'] == curProp:
                    curDynProp = x
            if curDynProp == None:
                # print(curProp)
                print('Prop dyn inconnue')
                    # Gerer l'exception
            else :
                viewAlias = self.vAliasList['v'+curDynProp['name']]
                      #### Perform the'where' in dyn props ####
                query = query.where(
                eval_.eval_binary_expr(viewAlias.c['Value'+curDynProp['type']],criteriaObj['Operator'],criteriaObj['Value']))

        return query

    def GetFullQuery(self,searchInfo=None) :
        ''' return the full query to execute '''
        if searchInfo is None or 'criteria' not in searchInfo:
            searchInfo['criteria'] = []
            print('********** NO Criteria ***************')
        joinTable = self.GetJoinTable(searchInfo)
        fullQueryJoin = select(self.selectable).select_from(joinTable)
        # countQuery = select([func.count('*')]).select_from(joinTable)

        for obj in searchInfo['criteria'] :
            fullQueryJoin = self.WhereInJoinTable(fullQueryJoin,obj)
            # countQuery = self.WhereInJoinTable(countQuery,obj)
        # self.countQuery = countQuery 
        fullQueryJoinOrdered = self.OderByAndLimit(fullQueryJoin,searchInfo)

        return fullQueryJoinOrdered

    def GetFlatDataList(self,searchInfo=None) :
        ''' Main function to call : return filtered (paged) ordered flat data list according to filter parameters'''
        fullQueryJoinOrdered = self.GetFullQuery(searchInfo)
        result = DBSession.execute(fullQueryJoinOrdered).fetchall()
        data = []
        for row in result :
            row = OrderedDict(row)
            data.append(row)
        return data

    def count(self,searchInfo = None) :
        ''' Main function to call : return count according to filter parameters'''
        if searchInfo is None:
            criteria = None
        else:
            criteria = searchInfo['criteria'] 
        query = self.countQuery(criteria)
        count = DBSession.execute(query).scalar()
        return count

    def countQuery(self,criteria = None):
        fullQuery = select([func.count(self.ObjWithDynProp.ID)])
        filterOnDynProp = False
        existQuery = select([self.GetDynPropValueView()])
        if criteria is not None:
            for obj in criteria:
                curDynProp = self.GetDynProp(obj['Column'])
              
                if hasattr(self.ObjWithDynProp,obj['Column']):
                    fullQuery = fullQuery.where(
                        eval_.eval_binary_expr(self.ObjWithDynProp.__table__.c[obj['Column']],obj['Operator'],obj['Value'])
                    )
                elif curDynProp != None:
                    filterOnDynProp = True
                    existQuery = existQuery.where(
                        and_(
                        self.GetDynPropValueView().c['Name'] == obj['Column'],
                        eval_.eval_binary_expr(self.GetDynPropValueView().c['Value'+curDynProp['TypeProp']],obj['Operator'],obj['Value'] )))

            if filterOnDynProp == True:
                fullQuery = fullQuery.where(exists(
                    existQuery.where(self.ObjWithDynProp.ID == self.GetDynPropValueView().c[self.ObjWithDynProp().GetSelfFKNameInValueTable()])))
        return fullQuery

    def OderByAndLimit (self, query, searchInfo) :
        ''' Apply "order by" and limit according to filter parameters '''
        if len(searchInfo['order_by']) > 0 : 
            for obj in searchInfo['order_by']:
                order_by_clause = []
                curProp, order = obj.split(':')
                curDynProp = self.GetDynProp(curProp)

                if curDynProp is not None :
                    viewAlias = self.vAliasList['v'+curDynProp['Name']]
                    trueCol = viewAlias.c['Value'+curDynProp['TypeProp']]

                elif 'FK_'+curProp in self.fk_list:
                    # print('\n **---** ORDER BY ON FK !')
                    tableRef = self.fk_list['FK_'+curProp].column.table
                    nameRef = self.fk_list['FK_'+curProp].column.name
                    trueCol = tableRef.c[curProp]

                elif hasattr(self.ObjWithDynProp,curProp):
                    trueCol = curProp

                elif self.optionView is not None and curProp in self.optionView.c:
                    trueCol = self.optionView.c[curProp]

                elif (self.history and curProp == 'StartDate'):
                    viewAlias = self.vAliasList[self.firstStartDate]
                    trueCol = viewAlias.c['StartDate']

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
