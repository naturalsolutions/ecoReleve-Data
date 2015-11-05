from pyramid.view import view_config
from ..Models import (
    DBSession,
    Station,
    MonitoredSite,
    MonitoredSiteType,
    MonitoredSiteDynPropValue,
    MonitoredSiteDynProp,
    MonitoredSitePosition,
    Equipment,
    Sensor,
    SensorType,
    Base
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
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import aliased
from pyramid.security import NO_PERMISSION_REQUIRED
from pyramid.response import Response
from traceback import print_exc
from collections import OrderedDict


prefix = 'monitoredSite'

# ------------------------------------------------------------------------------------------------------------------------- #
@view_config(route_name= prefix+'/action', renderer='json', request_method = 'GET', permission = NO_PERMISSION_REQUIRED)
@view_config(route_name= prefix+'/id/history/action', renderer='json', request_method = 'GET', permission = NO_PERMISSION_REQUIRED)
@view_config(route_name= prefix+'/id/equipment/action', renderer='json', request_method = 'GET', permission = NO_PERMISSION_REQUIRED)
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

    transaction.commit()
    return response

# ------------------------------------------------------------------------------------------------------------------------- #
@view_config(route_name= prefix+'/id/history', renderer='json', request_method = 'GET',permission = NO_PERMISSION_REQUIRED)
def getMonitoredSiteHistory(request):
    print('**HISTOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOORY********' )
    id = request.matchdict['id']
    data = request.params.mixed()
    searchInfo = {}
    searchInfo['criteria'] = [{'Column': 'ID', 'Operator':'Is', 'Value':int(id)}]

    try:
        searchInfo['order_by'] = json.loads(data['order_by'])
    except:
        searchInfo['order_by'] = []
    # searchInfo['offset'] = json.loads(data['offset'])
    # searchInfo['per_page'] = json.loads(data['per_page'])

    ModuleType = 'MonitoredSiteGridHistory'
    moduleFront  = DBSession.query(FrontModules).filter(FrontModules.Name == ModuleType).one()
    view = Base.metadata.tables['MonitoredSitePosition']
    listObj = ListObjectWithDynProp(MonitoredSite,moduleFront,View=view)
    dataResult = listObj.GetFlatDataList(searchInfo)

    if 'geo' in request.params :
        geoJson=[]
        for row in dataResult:
            geoJson.append({'type':'Feature', 'properties':{'Date':row['StartDate']}, 'geometry':{'type':'Point', 'coordinates':[row['LON'],row['LAT']]}})
        result = {'type':'FeatureCollection', 'features':geoJson}
    else : 
        countResult = listObj.count(searchInfo)
        result = [{'total_entries':countResult}]
        result.append(dataResult)

    transaction.commit()
    return result

# ------------------------------------------------------------------------------------------------------------------------- #
@view_config(route_name= prefix+'/id/equipment', renderer='json', request_method = 'GET')
def getMonitoredSiteEquipment(request):

    id_site = request.matchdict['id']
    joinTable = join(Equipment,Sensor, Equipment.FK_Sensor == Sensor.ID
        ).join(SensorType,Sensor.FK_SensorType == SensorType.ID)
    query = select([Equipment.StartDate,SensorType.Name.label('Type'),Sensor.UnicIdentifier,Equipment.Deploy]).select_from(joinTable
        ).where(Equipment.FK_MonitoredSite == id_site).order_by(desc(Equipment.StartDate))
    result = DBSession.execute(query).fetchall()
    response = []
    for row in result:
        curRow = OrderedDict(row)
        if curRow['Deploy'] == 1 : 
            curRow['Deploy'] = 'Deploy'
        else : 
            curRow['Deploy'] = 'Remove'
        response.append(curRow)

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
    try:
        data = request.json_body
        id = request.matchdict['id']
        curMonitoredSite = DBSession.query(MonitoredSite).get(id)
    
        curMonitoredSite.LoadNowValues()
        curMonitoredSite.UpdateFromJson(data)
        transaction.commit()
        response = {}

    except Exception as e:
        print('\n\n\n *****IntegrityError errrroorr') 
        transaction.abort()
        response = request.response
        response.status_code = 510
        response.text = "IntegrityError"

    return response
    

# ------------------------------------------------------------------------------------------------------------------------- #
@view_config(route_name= prefix+'/', renderer='json', request_method = 'POST')
def insertMonitoredSite(request):
    data = request.json_body
    if not isinstance(data,list):
        print('_______INsert ROW *******')
        return insertOneNewMonitoredSite(request)
    else :
        print('_______INsert LIST')

# ------------------------------------------------------------------------------------------------------------------------- #
def insertOneNewMonitoredSite (request) :
    data = {}
    for items , value in request.json_body.items() :
        if value != "" :
            data[items] = value

    newMonitoredSite = MonitoredSite(FK_MonitoredSiteType = data['FK_MonitoredSiteType'], Creator = request.authenticated_userid )
    newMonitoredSite.MonitoredSiteType = DBSession.query(MonitoredSiteType).filter(MonitoredSiteType.ID==data['FK_MonitoredSiteType']).first()
    newMonitoredSite.init_on_load()
    newMonitoredSite.UpdateFromJson(data)
    DBSession.add(newMonitoredSite)
    DBSession.flush()
    # transaction.commit()
    return {'ID': newMonitoredSite.ID}

# ------------------------------------------------------------------------------------------------------------------------- #
@view_config(route_name= prefix, renderer='json', request_method = 'GET', permission = NO_PERMISSION_REQUIRED)
def searchMonitoredSite(request):
    data = request.params.mixed()
    print('*********data*************')
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
    listObj = ListObjectWithDynProp(MonitoredSite,moduleFront,View=Base.metadata.tables['MonitoredSitePositionsNow'])
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






