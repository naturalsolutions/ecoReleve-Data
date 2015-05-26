from pyramid.view import view_config
from ..Models import (
    DBSession,
    Station,
    StationType,
    Observation
    )
from ecoreleve_server.GenericObjets.FrontModules import (FrontModule,ModuleField)
from ecoreleve_server.GenericObjets import ListObjectWithDynProp
import transaction
import json
from datetime import datetime
import pandas as pd
import numpy as np
from sqlalchemy import select, and_
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

@view_config(route_name= prefix+'/action', renderer='json', request_method = 'GET')
def actionOnStations(request):
    print ('\n*********************** Action **********************\n')
    dictActionFunc = {
    'count' : count,
    'forms' : getForms,
    '0' : getForms,
    'fields': getFields
    }
    actionName = request.matchdict['action']
    return dictActionFunc[actionName](request)

def count (request) :
#   ## TODO count stations
    return

def getForms(request) :

    typeSta = request.params['ObjectType']
    print('***************** GET FORMS ***********************')
    ModuleName = 'StaForm'
    Conf = DBSession.query(FrontModule).filter(FrontModule.Name==ModuleName ).first()
    newSta = Station(FK_StationType = typeSta)
    newSta.init_on_load()
    schema = newSta.GetDTOWithSchema(Conf,'edit')
    del schema['schema']['creationDate']
    return schema

def getFields(request) :
#     ## TODO return fields Station
    return

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

        Conf = DBSession.query(FrontModule).filter(FrontModule.Name=='StaForm' ).first()
        response = curSta.GetDTOWithSchema(Conf,DisplayMode)
    else : 
        response  = curSta.GetFlatObject()

    return response

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
        print (data['data'])
        print('_______INsert LIST')

        return insertListNewStations(request)

def insertOneNewStation (request) :

    data = {}
    for items , value in request.json_body.items() :
        if value != "" :
            data[items] = value

    newSta = Station(FK_StationType = data['FK_StationType'])
    newSta.StationType = DBSession.query(StationType).filter(StationType.ID==data['FK_StationType']).first()
    newSta.init_on_load()
    newSta.UpdateFromJson(data)
    DBSession.add(newSta)
    DBSession.flush()
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
    
    return response 

@view_config(route_name= prefix, renderer='json', request_method = 'GET', permission = NO_PERMISSION_REQUIRED)
def searchStation(request):

    # data = request.params
    
    # searchInfo = data.mixed()
    # print (json.loads(searchInfo))
    listObj = ListObjectWithDynProp(DBSession,Station,searchInfo)
    response = listObj.GetFlatList()
    # return response

@view_config(route_name= prefix+'/id/protocols', renderer='json', request_method = 'GET', permission = NO_PERMISSION_REQUIRED)
def GetProtocolsofStation (request) :

    sta_id = request.matchdict['id']
    data = {}
    searchInfo = {}
    criteria = {'Column': 'FK_Station', 'Operator':'=','Value':sta_id}

    response = []

    try : 
        if 'criteria' in request.params or request.params == {} :
            print (' ********************** criteria params ==> Search ****************** ')

            searchInfo = data
            searchInfo['criteria'] = []
            searchInfo['criteria'].append(criteria)
            listObj = ListObjectWithDynProp(DBSession,Observation,searchInfo)
            response = listObj.GetFlatList()
    except : 
        pass

    try :
        if 'FormName' in request.params : 
            print (' ********************** Forms in params ==> DATA + FORMS ****************** ')
            ModuleName = request.params['FormName']
            try :
                DisplayMode = request.params['DisplayMode']
            except : 
                DisplayMode = 'display'

            listObs = DBSession.query(Observation).filter(Observation.FK_Station == sta_id)

            if listObs :
                listObsWithSchema = {}
                for obs in listObs : 
                    typeName = obs.GetType().Name
                    Conf = DBSession.query(FrontModule).filter(FrontModule.Name==ModuleName ).first()
                    obs.LoadNowValues()
                    try :
                        listObsWithSchema[typeName].append(obs.GetDTOWithSchema(Conf,DisplayMode))
                    except :
                        listObsWithSchema[typeName] = []
                        listObsWithSchema[typeName].append(obs.GetDTOWithSchema(Conf,DisplayMode))

            response = listObsWithSchema
    except Exception as e :
        print (e)
        pass
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

@view_config(route_name= prefix+'/id/protocols/obs_id', renderer='json', request_method = 'GET', permission = NO_PERMISSION_REQUIRED)
def GetObservation(request):

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

            Conf = DBSession.query(FrontModule).filter(FrontModule.Name=='ObsForm' ).first()
            response = curObs.GetDTOWithSchema(Conf,DisplayMode)
        else : 
            response  = curObs.GetFlatObject()

    except Exception as e :
        print(e)
        response = {}

    return response


