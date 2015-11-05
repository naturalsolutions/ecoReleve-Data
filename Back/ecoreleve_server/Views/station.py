from pyramid.view import view_config
from ..Models import (
    DBSession,
    Station,
    StationType,
    Observation,
    FieldActivity_ProtocoleType,
    Station_FieldWorker,
    StationList
    )
from ecoreleve_server.GenericObjets.FrontModules import FrontModules, ModuleForms
from ecoreleve_server.GenericObjets import ListObjectWithDynProp
import transaction
import json, itertools
from datetime import datetime
import datetime as dt
import pandas as pd
import numpy as np
from sqlalchemy import select, and_,cast, DATE,func
from sqlalchemy.orm import aliased
from pyramid.security import NO_PERMISSION_REQUIRED
from traceback import print_exc



prefix = 'stations'


# ------------------------------------------------------------------------------------------------------------------------- #
@view_config(route_name= prefix+'/action', renderer='json', request_method = 'GET', permission = NO_PERMISSION_REQUIRED)
def actionOnStations(request):
    print ('\n*********************** Action **********************\n')
    dictActionFunc = {
    'count' : count_,
    'forms' : getForms,
    '0' : getForms,
    'getFields': getFields,
    'getFilters': getFilters
    }
    actionName = request.matchdict['action']
    return dictActionFunc[actionName](request)

def count_ (request = None,listObj = None) :
    if request is not None : 
        data = request.params
        if 'criteria' in data: 
            data['criteria'] = json.loads(data['criteria'])
            if data['criteria'] != {} :
                searchInfo['criteria'] = [obj for obj in data['criteria'] if obj['Value'] != str(-1) ]

        listObj = ListObjectWithDynProp(Station)
        count = listObj.count(searchInfo = searchInfo)
    else : 
        count = listObj.count()
    return count 

def getFilters (request):
    ModuleType = 'StationGrid'
    moduleName = request.params.get('FilterName',None)
    filtersList = Station().GetFilters(moduleName)
    filters = {}
    for i in range(len(filtersList)) :
        filters[str(i)] = filtersList[i]
    transaction.commit()
    return filters

def getForms(request) :
    typeSta = request.params['ObjectType']
    ModuleName = 'StationForm'
    Conf = DBSession.query(FrontModules).filter(FrontModules.Name==ModuleName ).first()
    newSta = Station(FK_StationType = typeSta)
    newSta.init_on_load()
    schema = newSta.GetDTOWithSchema(Conf,'edit')
    # print(schema)
    transaction.commit()
    return schema

def getFields(request) :
    ModuleType = 'StationVisu'
    cols = Station().GetGridFields(ModuleType)
    transaction.commit()
    return cols

# ------------------------------------------------------------------------------------------------------------------------- #
@view_config(route_name= prefix+'/id', renderer='json', request_method = 'GET',permission = NO_PERMISSION_REQUIRED)
def getStation(request):
    print('***************** GET STATION ***********************')
    id = request.matchdict['id']
    curSta = DBSession.query(Station).get(id)
    curSta.LoadNowValues()

    # if Form value exists in request --> return data with schema else return only data
    if 'FormName' in request.params :
        ModuleName = request.params['FormName']
        try :
            DisplayMode = request.params['DisplayMode']
        except : 
            DisplayMode = 'display'

        Conf = DBSession.query(FrontModules).filter(FrontModules.Name=='StationForm' ).first()
        response = curSta.GetDTOWithSchema(Conf,DisplayMode)
    else : 
        response  = curSta.GetFlatObject()
    transaction.commit()
    return response

# ------------------------------------------------------------------------------------------------------------------------- #
@view_config(route_name= prefix+'/id', renderer='json', request_method = 'DELETE',permission = NO_PERMISSION_REQUIRED)
def deleteStation(request):
    id_ = request.matchdict['id']
    curSta = DBSession.query(Station).get(id_)
    DBSession.delete(curSta)
    transaction.commit()
    return True

# ------------------------------------------------------------------------------------------------------------------------- #
@view_config(route_name= prefix+'/id', renderer='json', request_method = 'PUT')
def updateStation(request):
    print('*********************** UPDATE Station *****************')
    data = request.json_body
    id = request.matchdict['id']
    curSta = DBSession.query(Station).get(id)
    curSta.LoadNowValues()
    curSta.UpdateFromJson(data)
    transaction.commit()
    return {}

# ------------------------------------------------------------------------------------------------------------------------- #
@view_config(route_name= prefix, renderer='json', request_method = 'POST')
def insertStation(request):
    data = request.json_body
    if not isinstance(data,list):
        print('_______INsert ROW *******')
        return insertOneNewStation(request)
    else :
        print('_______INsert LIST')
        transaction.commit()
        return insertListNewStations(request)

def insertOneNewStation (request) :
    data = {}
    for items , value in request.json_body.items() :
        if value != "" :
            data[items] = value

    newSta = Station(FK_StationType = data['FK_StationType'], creator = request.authenticated_userid)
    newSta.StationType = DBSession.query(StationType).filter(StationType.ID==data['FK_StationType']).first()
    newSta.init_on_load()
    newSta.UpdateFromJson(data)
    # print (newSta.__dict__)
    DBSession.add(newSta)
    DBSession.flush()
    # transaction.commit()
    return {'ID': newSta.ID}

def insertListNewStations(request):
    data = request.json_body
    data_to_insert = []
    format_dt = '%Y-%m-%d %H:%M:%S'
    format_dtBis = '%Y-%d-%m %H:%M:%S'
    dateNow = datetime.now()

    ##### Rename field and convert date #####
    #TODO
    for row in data :
        newRow = {}
        newRow['LAT'] = row['latitude']
        newRow['LON'] = row['longitude']
        newRow['Name'] = row['name']
        newRow['fieldActivityId'] = 1
        newRow['precision'] = 10 #row['Precision']
        newRow['creationDate'] = dateNow
        newRow['creator'] = 1 #request.authenticated_userid
        newRow['FK_StationType']=4
        newRow['id'] = row['id']

        try :
            newRow['StationDate'] = datetime.strptime(row['waypointTime'],format_dt)
        except :
            newRow['StationDate'] = datetime.strptime(row['waypointTime'],format_dtBis)
        data_to_insert.append(newRow)

    ##### Load date into pandas DataFrame then round LAT,LON into decimal(5) #####
    DF_to_check = pd.DataFrame(data_to_insert)
    DF_to_check['LAT'] = np.round(DF_to_check['LAT'],decimals = 5)
    DF_to_check['LON'] = np.round(DF_to_check['LON'],decimals = 5)
    
    ##### Get min/max Value to query potential duplicated stations #####
    maxDate = DF_to_check['StationDate'].max()
    minDate = DF_to_check['StationDate'].min()
    maxLon = DF_to_check['LON'].max()
    minLon = DF_to_check['LON'].min()
    maxLat = DF_to_check['LAT'].max()
    minLat = DF_to_check['LAT'].min()

    ##### Retrieve potential duplicated stations from Database #####
    query = select([Station]).where(
        and_(
            Station.StationDate.between(minDate,maxDate),
            Station.LAT.between(minLat,maxLat)
            ))
    result_to_check = DBSession.execute(query).fetchall()

    if result_to_check :
        ##### IF potential duplicated stations, load them into pandas DataFrame then join data to insert on LAT,LON,DATE #####
        result_to_check = pd.DataFrame(data=result_to_check, columns = Station.__table__.columns.keys())
        result_to_check['LAT'] = result_to_check['LAT'].astype(float)
        result_to_check['LON'] = result_to_check['LON'].astype(float)
        merge_check = pd.merge(DF_to_check,result_to_check , on =['LAT','LON','StationDate'])

        ##### Get only non existing data to insert #####
        DF_to_check = DF_to_check[~DF_to_check['id'].isin(merge_check['id'])]

    DF_to_check = DF_to_check.drop(['id'],1)
    data_to_insert = json.loads(DF_to_check.to_json(orient='records',date_format='iso'))

    ##### Build block insert statement and returning ID of new created stations #####
    if len(data_to_insert) != 0 :
        # print('********* insertion plusieurs stations **********')
        stmt = Station.__table__.insert(returning=[Station.ID]).values(data_to_insert)
        res = DBSession.execute(stmt).fetchall()
        # print('********* station list**********')
        result =list(map(lambda y:  y[0], res))
        #result = list(map(lambda y: {'FK_Station' : y[0], }, res))


    ###### Insert FieldWorkers ######
        print('**********fieldworkers************')
        # print(data[0])
        if not data[0]['FieldWorkers'] == None or "" :
            list_ = list(map( lambda b : list(map(lambda a : {'FK_Station' : a,'FK_FieldWorker': b  },result)),data[0]['FieldWorkers'] ))
            list_ = list(itertools.chain.from_iterable(list_))
            stmt = Station_FieldWorker.__table__.insert().values(list_)
            DBSession.execute(stmt)
    else : 
        result = []

    response = {'exist': len(data)-len(data_to_insert), 'new': len(data_to_insert)}
    transaction.commit()
    return response 

# ------------------------------------------------------------------------------------------------------------------------- #
@view_config(route_name= prefix, renderer='json', request_method = 'GET', permission = NO_PERMISSION_REQUIRED)
def searchStation(request):
    ''' return data according to filter parameter, if "geo" is in request return geojson format '''
    data = request.params.mixed()
    searchInfo = {}
    searchInfo['criteria'] = []
    user = request.authenticated_userid
    user = 1 
    if 'criteria' in data: 
        data['criteria'] = json.loads(data['criteria'])
        if data['criteria'] != {} :
            searchInfo['criteria'] = [obj for obj in data['criteria'] if obj['Value'] != str(-1) ]

    if not 'geo' in data:
        ModuleType = 'StationVisu'
        searchInfo['order_by'] = json.loads(data['order_by'])
        searchInfo['offset'] = json.loads(data['offset'])
        searchInfo['per_page'] = json.loads(data['per_page'])
        getFW = True
    else :
        searchInfo['order_by'] = []
        ModuleType = 'StationVisu'
        getFW = False
        criteria = [
        {'Column' : 'LAT',
        'Operator' : 'Is not',
        'Value' : None
        },
        {
        'Column': 'LON',
        'Operator' : 'Is not',
        'Value' : None
        }]
        searchInfo['criteria'].extend(criteria)
        # searchInfo['offset'] = 0

    #### add filter parameters to retrieve last stations imported : last day of station created by user and without linked observation ####
    if 'lastImported' in data :
        print('-*********************** LAST IMPORTED !!!!!!!!! ******')
        criteria = [
        {'Column' : 'creator',
        'Operator' : '=',
        'Value' : user
        },
        {
        'Column': 'LastImported',
        'Operator' : '=',
        'Value' : True
        },
        {'Column' : 'FK_StationType',
        'Operator' : '=',
        'Value' : 4 # => TypeID of GPX station
        },
        ]
        searchInfo['criteria'].extend(criteria)

    moduleFront  = DBSession.query(FrontModules).filter(FrontModules.Name == ModuleType).one()
    start = datetime.now()
    listObj = StationList(moduleFront)
    countResult = listObj.count(searchInfo)

    if 'geo' in data: 
        geoJson=[]
        exceed = True
        if countResult < 50000 : 
            exceed = False
            dataResult = listObj.GetFlatDataList(searchInfo,getFW)
            print('****************** GEOJSON !!!!--------------')
            for row in dataResult:
                geoJson.append({'type':'Feature', 'properties':{'name':row['Name'], 'date':row['StationDate']}, 'geometry':{'type':'Point', 'coordinates':[row['LON'],row['LAT']]}})
        return {'type':'FeatureCollection', 'features':geoJson, 'exceed': exceed}
    else :
        dataResult = listObj.GetFlatDataList(searchInfo,getFW)
        result = [{'total_entries':countResult}]
        result.append(dataResult)
        transaction.commit()
        return result

# ------------------------------------------------------------------------------------------------------------------------- #

def linkToMonitoredSite(request):
    curSta = DBSession.query(Station).get(request.matchdict['id'])
    idSite = request.params['idSite']
    curSta.FK_MonitoredSite = idSite
    transaction.commit()
    return {}


