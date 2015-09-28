from pyramid.view import view_config
from ..Models import (
    DBSession,
    MonitoredSite,
    MonitoredSiteType,
    MonitoredSiteDynPropValue,
    MonitoredSiteDynProp
    )
from ecoreleve_server.GenericObjets.FrontModules import FrontModules
from ecoreleve_server.GenericObjets import ListObjectWithDynProp
import transaction
import json, itertools
from datetime import datetime
import datetime as dt
import pandas as pd
import numpy as np
from sqlalchemy import select, and_,cast, DATE,func,desc,join
from sqlalchemy.orm import aliased
from pyramid.security import NO_PERMISSION_REQUIRED
from traceback import print_exc
from collections import OrderedDict


prefix = 'monitoredSite'

# ------------------------------------------------------------------------------------------------------------------------- #
@view_config(route_name= prefix+'/action', renderer='json', request_method = 'GET', permission = NO_PERMISSION_REQUIRED)
@view_config(route_name= prefix+'/id/history/action', renderer='json', request_method = 'GET', permission = NO_PERMISSION_REQUIRED)
def actionOnMonitoredSite(request):
    print ('\n*********************** Action **********************\n')
    dictActionFunc = {
    'count' : count_,
    'forms' : getForms,
    '0' : getForms,
    'getFields': getFields,
    'getFilters': getFilters,
    }
    actionName = request.matchdict['action']
    return dictActionFunc[actionName](request)

def count_ (request = None,listObj = None) :
    print('*****************  MonitoredSite COUNT***********************')
    if request is not None : 
        data = request.params
        if 'criteria' in data: 
            data['criteria'] = json.loads(data['criteria'])
            if data['criteria'] != {} :
                searchInfo['criteria'] = [obj for obj in data['criteria'] if obj['Value'] != str(-1) ]

        listObj = ListObjectWithDynProp(MonitoredSite)
        count = listObj.count(searchInfo = searchInfo)
    else : 
        count = listObj.count()

    print(count)
    return count 

def getFilters (request):
    ModuleType = 'MonitoredSiteGrid'
    filtersList = MonitoredSite().GetFilters(ModuleType)
    filters = {}
    for i in range(len(filtersList)) :
        filters[str(i)] = filtersList[i]
    transaction.commit()
    return filters

def getForms(request) :
    typeMonitoredSite = request.params['ObjectType']
    print('***************** GET FORMS ***********************')
    ModuleName = 'MonitoredSiteForm'
    Conf = DBSession.query(FrontModules).filter(FrontModules.Name==ModuleName ).first()
    newMonitoredSite = MonitoredSite(FK_MonitoredSiteType = typeMonitoredSite)
    newMonitoredSite.init_on_load()
    schema = newMonitoredSite.GetDTOWithSchema(Conf,'edit')
    transaction.commit()
    return schema

def getFields(request) :

    ModuleType = request.params['name']
    if ModuleType == 'default' :
        ModuleType = 'MonitoredSiteGrid'
    cols = MonitoredSite().GetGridFields(ModuleType)
    transaction.commit()
    return cols

# ------------------------------------------------------------------------------------------------------------------------- #
@view_config(route_name= prefix+'/id', renderer='json', request_method = 'GET',permission = NO_PERMISSION_REQUIRED)
def getMonitoredSite(request):
    print('***************** GET MonitoredSite ***********************')
    id = request.matchdict['id']
    curMonitoredSite = DBSession.query(MonitoredSite).get(id)
    curMonitoredSite.LoadNowValues()

    # if Form value exists in request --> return data with schema else return only data
    if 'FormName' in request.params :
        ModuleName = request.params['FormName']
        try :
            DisplayMode = request.params['DisplayMode']
        except : 
            DisplayMode = 'display'
        Conf = DBSession.query(FrontModules).filter(FrontModules.Name=='MonitoredSiteForm').first()
        response = curMonitoredSite.GetDTOWithSchema(Conf,DisplayMode)
    elif 'geo' in request.params :
        geoJson=[]
        result = {'type':'FeatureCollection', 'features':geoJson}
        response = result
    #if 'geo' in request.params :
        #geoJson=[]
    #     stmt = select([MonitoredSite_Location]).where(MonitoredSite_Location.FK_MonitoredSite == id)
    #     dataResult = DBSession.execute(stmt).fetchall()
        # for row in dataResult:
        #     geoJson.append({'type':'Feature', 'properties':{'name':row['Name']}, 'geometry':{'type':'Point', 'coordinates':[row['LON'],row['LAT']]}})
        #result = {'type':'FeatureCollection', 'features':geoJson}
        #response = result
    #else : 
        #response  = curMonitoredSite.GetFlatObject()

    transaction.commit()
    return response

# ------------------------------------------------------------------------------------------------------------------------- #
@view_config(route_name= prefix+'/id/history', renderer='json', request_method = 'GET',permission = NO_PERMISSION_REQUIRED)
def getMonitoredSiteHistory(request):

    #128145
    id = request.matchdict['id']
    tableJoin = join(MonitoredSiteDynPropValue,MonitoredSiteDynProp
        ,MonitoredSiteDynPropValue.FK_MonitoredSiteDynProp == MonitoredSiteDynProp.ID)
    query = select([MonitoredSiteDynPropValue,MonitoredSiteDynProp.Name]).select_from(tableJoin).where(
        MonitoredSiteDynPropValue.FK_MonitoredSite == id
        ).order_by(desc(MonitoredSiteDynPropValue.StartDate))
    result = DBSession.execute(query).fetchall()
    response = []
    for row in result:
        curRow = OrderedDict(row)
        dictRow = {}
        for key in curRow :
            if curRow[key] is not None :
                if 'Value' in key :
                    dictRow['value'] = curRow[key] 
                elif 'FK' not in key :
                    dictRow[key] = curRow[key]
        response.append(dictRow)

    return response

# ------------------------------------------------------------------------------------------------------------------------- #
@view_config(route_name= prefix+'/id', renderer='json', request_method = 'DELETE',permission = NO_PERMISSION_REQUIRED)
def deleteMonitoredSite(request):
    id_ = request.matchdict['id']
    curMonitoredSite = DBSession.query(MonitoredSite).get(id_)
    DBSession.delete(curMonitoredSite)
    transaction.commit()
    return True

# ------------------------------------------------------------------------------------------------------------------------- #
@view_config(route_name= prefix+'/id', renderer='json', request_method = 'PUT')
def updateMonitoredSite(request):
    print('*********************** UPDATE MonitoredSite *****************')
    data = request.json_body
    id = request.matchdict['id']
    curMonitoredSite = DBSession.query(MonitoredSite).get(id)
    curMonitoredSite.LoadNowValues()
    curMonitoredSite.UpdateFromJson(data)
    transaction.commit()
    return {}

# ------------------------------------------------------------------------------------------------------------------------- #
@view_config(route_name= prefix, renderer='json', request_method = 'POST')
def insertMonitoredSite(request):
    data = request.json_body
    if not isinstance(data,list):
        print('_______INsert ROW *******')
        return insertOneNewMonitoredSite(request)
    else :
        print('_______INsert LIST')
        #transaction.commit()
        #return insertListNewMonitoredSites(request)

# ------------------------------------------------------------------------------------------------------------------------- #
def insertOneNewMonitoredSite (request) :
    data = {}
    for items , value in request.json_body.items() :
        if value != "" :
            data[items] = value

    newMonitoredSite = MonitoredSite(FK_MonitoredSiteType = data['FK_MonitoredSiteType'], creator = request.authenticated_userid)
    newMonitoredSite.MonitoredSiteType = DBSession.query(MonitoredSiteType).filter(MonitoredSiteType.ID==data['FK_MonitoredSiteType']).first()
    newMonitoredSite.init_on_load()
    newMonitoredSite.UpdateFromJson(data)
    print (newMonitoredSite.__dict__)
    DBSession.add(newMonitoredSite)
    DBSession.flush()
    # transaction.commit()
    return {'ID': newMonitoredSite.ID}

# ------------------------------------------------------------------------------------------------------------------------- #
@view_config(route_name= prefix, renderer='json', request_method = 'GET', permission = NO_PERMISSION_REQUIRED)
def searchMonitoredSite(request):
    data = request.params.mixed()
    print('*********data*************')
    print(data)
    searchInfo = {}
    searchInfo['criteria'] = []
    if 'criteria' in data: 
        data['criteria'] = json.loads(data['criteria'])
        if data['criteria'] != {} :
            searchInfo['criteria'] = [obj for obj in data['criteria'] if obj['Value'] != str(-1) ]

    searchInfo['order_by'] = json.loads(data['order_by'])
    searchInfo['offset'] = json.loads(data['offset'])
    searchInfo['per_page'] = json.loads(data['per_page'])

    ModuleType = 'MonitoredSiteGrid'
    moduleFront  = DBSession.query(FrontModules).filter(FrontModules.Name == ModuleType).one()
    print('**criteria********' )
    print(searchInfo['criteria'])
    start = datetime.now()
    listObj = ListObjectWithDynProp(MonitoredSite,moduleFront)
    dataResult = listObj.GetFlatDataList(searchInfo)

    stop = datetime.now()
    print ('______ TIME to get DATA : ')
    print (stop-start)
    start = datetime.now()
    countResult = listObj.count(searchInfo)
    print ('______ TIME to get Count : ')
    stop = datetime.now()
    print (stop-start)

    result = [{'total_entries':countResult}]
    result.append(dataResult)
    transaction.commit()
    return result






