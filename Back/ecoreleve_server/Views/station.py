from pyramid.view import view_config
from ..Models import (
    DBSession,
    Station,
    StationType,
    Observation,
    FieldActivity_ProtocoleType,
    Station_FieldWorker
    )
from ecoreleve_server.GenericObjets.FrontModules import FrontModule
from ecoreleve_server.GenericObjets import ListObjectWithDynProp
import transaction
import json
from datetime import datetime
import datetime as dt
import pandas as pd
import numpy as np
from sqlalchemy import select, and_,cast, DATE,func
from sqlalchemy.orm import aliased
from pyramid.security import NO_PERMISSION_REQUIRED



prefix = 'stations'


# @view_config(route_name= prefix, renderer='json', request_method = 'PUT')
# def updateListStations(request):
#     # TODO 
#     # update a list of stations 
#     return

# @view_config(route_name= prefix, renderer='json', request_method = 'GET')
# def getListStations(request):
#     # TODO 
#     # return list of stations 
#     # can search/filter
#     return


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
#   ## TODO count stations

    print('*****************  STATION COUNT***********************')

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
    filtersList = Station().GetFilters(ModuleType)
    filters = {}
    for i in range(len(filtersList)) :
        filters[str(i)] = filtersList[i]

    return filters


def getForms(request) :

    typeSta = request.params['ObjectType']
    print('***************** GET FORMS ***********************')
    ModuleName = 'StationForm'
    Conf = DBSession.query(FrontModule).filter(FrontModule.Name==ModuleName ).first()
    newSta = Station(FK_StationType = typeSta)
    newSta.init_on_load()
    schema = newSta.GetDTOWithSchema(Conf,'edit')
    del schema['schema']['creationDate']
    transaction.commit()
    return schema

def getFields(request) :
### TODO return fields Station
    
    ### GET example #####
    
    # sta = DBSession.query(Station).get(1)
    # fieldworkers = sta.StationDynPropValues
    # print(fieldworkers)
    # 
    #### INSERT example #####
    # sta = Station(FK_StationType = 1 , StationDate='12/12/2015 00:00:00' , fieldActivityId = 1)
    # sta.FieldWorkersNames = [1,2,6,1,1,1,1,1]
    # DBSession.add(sta)
    # transaction.commit()
    # 
    # # #### DELETE  example #####
    # curSta = DBSession.query(Station).get(2484)
    # DBSession.delete(curSta)
    # transaction.commit()
    ModuleType = 'StationGrid'
    
    cols = Station().GetGridFields(ModuleType)
    return cols

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

        Conf = DBSession.query(FrontModule).filter(FrontModule.Name=='StationForm' ).first()
        response = curSta.GetDTOWithSchema(Conf,DisplayMode)
    else : 
        response  = curSta.GetFlatObject()
    transaction.commit()
    return response


@view_config(route_name= prefix+'/id', renderer='json', request_method = 'DELETE',permission = NO_PERMISSION_REQUIRED)
def deleteStation(request):
    id_ = request.matchdict['id']
    curSta = DBSession.query(Station).get(id_)
    DBSession.delete(curSta)
    transaction.commit()

    return True

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

@view_config(route_name= prefix, renderer='json', request_method = 'POST')
def insertStation(request):

    data = request.POST.mixed()
    if 'data' not in data :
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
    DBSession.add(newSta)
    DBSession.flush()
    # transaction.commit()
    return {'id': newSta.ID}

def insertListNewStations(request):
    data = request.POST.mixed()
    data = data['data']
    DTO = json.loads(data)
    data_to_insert = []
    format_dt = '%Y-%m-%d %H:%M:%S'
    format_dtBis = '%Y-%d-%m %H:%M:%S'
    dateNow = datetime.now()

    ##### Rename field and convert date #####
    for row in DTO :
        newRow = {}
        newRow['LAT'] = row['latitude']
        newRow['LON'] = row['longitude']
        newRow['Name'] = row['name']
        newRow['fieldActivityId'] = 1
        newRow['precision'] = row['Precision']
        newRow['creationDate'] = dateNow
        newRow['creator'] = request.authenticated_userid
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
    maxDate = DF_to_check['StationDate'].max(axis=1)
    minDate = DF_to_check['StationDate'].min(axis=1)
    maxLon = DF_to_check['LON'].max(axis=1)
    minLon = DF_to_check['LON'].min(axis=1)
    maxLat = DF_to_check['LAT'].max(axis=1)
    minLat = DF_to_check['LAT'].min(axis=1)

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
        stmt = Station.__table__.insert(returning=[Station.ID]).values(data_to_insert)
        res = DBSession.execute(stmt).fetchall()
        result = list(map(lambda y: y[0], res))
    else : 
        result = []

    response = {'exist': len(DTO)-len(data_to_insert), 'new': len(data_to_insert)}
    transaction.commit()
    return response 

@view_config(route_name= prefix, renderer='json', request_method = 'GET', permission = NO_PERMISSION_REQUIRED)
def searchStation(request):

    data = request.params.mixed()
    searchInfo = {}

    searchInfo['criteria'] = []
    if 'criteria' in data: 
        data['criteria'] = json.loads(data['criteria'])
        if data['criteria'] != {} :
            searchInfo['criteria'] = [obj for obj in data['criteria'] if obj['Value'] != str(-1) ]

    searchInfo['order_by'] = json.loads(data['order_by'])
    searchInfo['offset'] = json.loads(data['offset'])
    searchInfo['per_page'] = json.loads(data['per_page'])


    if 'lastImported' in data :

        o = aliased(Station)
        print('-*********************** LAST IMPORTED !!!!!!!!! ******')

        criteria = [
        {'Column' : 'creator',
        'Operator' : '=',
        'Value' : request.authenticated_userid
        },
        # {'Query':'Observation',
        # 'Column': 'FK_ProtocoleType',
        # 'Operator' : 'not exists',
        # 'Value': select([Observation]).where(Observation.FK_Station == Station.ID) # keep only stations without Observations
        # },
        # {'Query':'Station',
        # 'Column': 'None',
        # 'Operator' : 'not exists',
        # 'Value': select([o]).where(cast(o.creationDate,DATE) > cast(Station.creationDate,DATE)) # keep only the last importation day
        # },
        {'Column' : 'FK_StationType',
        'Operator' : '=',
        'Value' : 4 # => TypeID of GPX station
        },
        ]

        searchInfo['criteria'].extend(criteria)


    ModuleType = 'StationGrid'

    moduleFront  = DBSession.query(FrontModule).filter(FrontModule.Name == ModuleType).one()
    # criteria = [
    #     {'Column' : 'StationDate',
    #     'Operator' : '>=',
    #     'Value' : '12/12/2012 00:00:00.000'
    #     },
    #     {'Column' : 'FieldWorker1',
    #     'Operator' : '=',
    #     'Value' : 1 }
    #     ]
    # searchInfo['criteria'].extend(criteria)
    # searchInfo['order_by'] = ['StationDate:desc']
    # searchInfo['per_page'] = 25
    # searchInfo['offset'] = 

    start = datetime.now()
    listObj = ListObjectWithDynProp(Station,moduleFront)
    dataResult = listObj.GetFlatDataList(searchInfo)
    stop = datetime.now()

    print ('______ TIME to get DATA : ')
    print (stop-start)

    start = datetime.now()
    countResult = count_(listObj =listObj)
    print ('______ TIME to get Count : ')
    stop = datetime.now()
    print (stop-start)

    result = [{'total_entries':countResult}]
    result.append(dataResult)
    transaction.commit()

    return result

@view_config(route_name= prefix+'/id/protocols', renderer='json', request_method = 'GET', permission = NO_PERMISSION_REQUIRED)
def GetProtocolsofStation (request) :

    sta_id = request.matchdict['id']
    data = {}
    searchInfo = {}
    criteria = [{'Column': 'FK_Station', 'Operator':'=','Value':sta_id}]
    response = []
    curSta = DBSession.query(Station).get(sta_id)
    try : 
        if 'criteria' in request.params or request.params == {} :
            print (' ********************** criteria params ==> Search ****************** ')
            
            searchInfo = data
            searchInfo['criteria'] = []
            searchInfo['criteria'].extend(criteria)
            listObs = ListObjectWithDynProp(DBSession,Observation,searchInfo)
            response = listObs.GetFlatList()
    except : 
        pass

    try :
        if 'FormName' in request.params : 
            print (' ********************** Forms in params ==> DATA + FORMS ****************** ')
            ModuleName = 'ObservationForm'

            listObs = list(DBSession.query(Observation).filter(Observation.FK_Station == sta_id))
            listType =list(DBSession.query(FieldActivity_ProtocoleType
                ).filter(FieldActivity_ProtocoleType.FK_fieldActivity == curSta.fieldActivityId))
            Conf = DBSession.query(FrontModule).filter(FrontModule.Name == ModuleName ).first()

            ### TODO : if protocols exists, append the new protocol form at the after : 2 loops, no choice
            if listObs or listType:
                # max_iter = max(len(listObs),len(listType))
                listProto = {}

                for i in range(len(listObs)) :

                    try : 
                        DisplayMode = 'display'
                        obs = listObs[i]
                        typeName = obs.GetType().Name
                        typeID = obs.GetType().ID
                        obs.LoadNowValues()
                        try :
                            listProto[typeID]['obs'].append(obs.GetDTOWithSchema(Conf,DisplayMode))
                        except :
                            

                            listObsWithSchema = []
                            listObsWithSchema.append(obs.GetDTOWithSchema(Conf,DisplayMode))
                            listProto[typeID] = {'Name': typeName,'obs':listObsWithSchema}
                            pass
                    except : 
                      
                        pass

                for i in range(len(listType)) :
                    try : 
                        DisplayMode = 'edit'
                       
                        virginTypeID = listType[i].FK_ProtocoleType
                        virginObs = Observation(FK_ProtocoleType = virginTypeID)
                        viginTypeName = virginObs.GetType().Name
                        try :
                            if virginTypeID not in listProto :
                                virginForm = virginObs.GetDTOWithSchema(Conf,DisplayMode)
                                virginForm['data']['FK_ProtocoleType'] = virginTypeID
                                listProto[virginTypeID]['obs'].append(virginForm)
                        except :

                            if virginTypeID not in listProto :
                                listSchema = []
                                virginForm = virginObs.GetDTOWithSchema(Conf,DisplayMode)
                                virginForm['data']['FK_ProtocoleType'] = virginTypeID
                                listSchema.append(virginForm)
                                listProto[virginTypeID] = {'Name': viginTypeName,'obs':listSchema}
                                pass

                    except :
                        
                        pass

            globalListProto = [{'ID':objID, 'Name':listProto[objID]['Name'],'obs':listProto[objID]['obs'] } for objID in listProto.keys()]

            response = globalListProto
    except Exception as e :
        print (e)
        pass
    transaction.commit()
    return response

@view_config(route_name= prefix+'/id/protocols', renderer='json', request_method = 'POST')
def insertNewProtocol (request) :

    data = {}
    for items , value in request.json_body.items() :
        if value != "" :
            data[items] = value
    data['FK_Station'] = request.matchdict['id']

    newProto = Observation(FK_ProtocoleType = data['FK_ProtocoleType'])
    newProto.ProtocoleType = DBSession.query(ProtocoleType).filter(ProtocoleType.ID==data['FK_ProtocoleType']).first()
    newProto.init_on_load()
    newProto.UpdateFromJson(data)
    DBSession.add(newProto)
    DBSession.flush()
    transaction.commit()
    return {'id': newProto.ID}

@view_config(route_name= prefix+'/id/protocols/obs_id', renderer='json', request_method = 'PUT')
def updateObservation(request):

    print('*********************** UPDATE Observation *****************')
    data = request.json_body
    id_obs = request.matchdict['obs_id']
    curObs = DBSession.query(Observation).get(id_obs)
    curObs.LoadNowValues()
    curObs.UpdateFromJson(data)
    transaction.commit()
    return {}

@view_config(route_name= prefix+'/id/protocols/obs_id', renderer='json', request_method = 'DELETE')
def deleteObservation(request):

    print('*********************** DELETE Observation *****************')

    id_obs = request.matchdict['obs_id']
    curObs = DBSession.query(Observation).get(id_obs)
    DBSession.delete(curObs)
    transaction.commit()
    return {}

@view_config(route_name= prefix+'/id/protocols/obs_id', renderer='json', request_method = 'GET', permission = NO_PERMISSION_REQUIRED)
def getObservation(request):

    print('*********************** GET Observation *****************')
    
    id_obs = request.matchdict['obs_id']
    id_sta = request.matchdict['id']
    
    try :
        curObs = DBSession.query(Observation).filter(and_(Observation.ID ==id_obs, Observation.FK_Station == id_sta )).one()
        curObs.LoadNowValues()
        # if Form value exists in request --> return data with schema else return only data
        if 'FormName' in request.params :
            ModuleName = request.params['FormName']
            try :
                DisplayMode = request.params['DisplayMode']
            except : 
                DisplayMode = 'display'

            Conf = DBSession.query(FrontModule).filter(FrontModule.Name=='Observation' ).first()
            response = curObs.GetDTOWithSchema(Conf,DisplayMode)
        else : 
            response  = curObs.GetFlatObject()

    except Exception as e :
        print(e)
        response = {}
    transaction.commit()
    return response

@view_config(route_name= prefix+'/id/protocols/action', renderer='json', request_method = 'GET', permission = NO_PERMISSION_REQUIRED)
def actionOnObs(request):
    print ('\n*********************** Action **********************\n')
    dictActionFunc = {
    'count' : countObs,
    'forms' : getObsForms,
    '0' : getObsForms,
    'fields': getObsFields
    }
    actionName = request.matchdict['action']
    return dictActionFunc[actionName](request)

def countObs (request) :
#   ## TODO count stations
    return

def getObsForms(request) :

    typeObs = request.params['ObjectType']
    print('***************** GET FORMS ***********************')
    ModuleName = 'Observation'
    Conf = DBSession.query(FrontModule).filter(FrontModule.Name==ModuleName ).first()
    newObs = Observation(FK_ProtocoleType = typeObs)
    newObs.init_on_load()
    schema = newObs.GetDTOWithSchema(Conf,'edit')
    del schema['schema']['creationDate']
    transaction.commit()
    return schema

def getObsFields(request) :
#     ## TODO return fields Station
    return


