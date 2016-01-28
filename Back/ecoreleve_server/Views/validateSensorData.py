from array import array

from pyramid.view import view_config
from pyramid.response import Response
from sqlalchemy import func, desc, select, union, union_all, and_, bindparam, update, or_, literal_column, join, text, update, Table,distinct
import json
from pyramid.httpexceptions import HTTPBadRequest
from ..utils.data_toXML import data_to_XML
import pandas as pd
import numpy as np
import transaction, time, signal

from ..utils.distance import haversine
import win32con, win32gui, win32ui, win32service, os, time, re
from win32 import win32api
import shutil
from time import sleep
import subprocess , psutil
from pyramid.security import NO_PERMISSION_REQUIRED
from datetime import datetime
from ..Models import Base, dbConfig, DBSession,ArgosGps
from traceback import print_exc


route_prefix = 'sensors/'
def asInt(s):
    try:
        return int(s)
    except:
        return None

def error_response (err) : 
    if err !=None : 
        msg = err.args[0] if err.args else ""
        response=Response('Problem occurs : '+str(type(err))+' = '+msg)
    else : 
        response=Response('No induvidual equiped')
    response.status_int = 500
    return response

ArgosDatasWithIndiv = Table('VArgosData_With_EquipIndiv', Base.metadata, autoload=True)
GsmDatasWithIndiv = Table('VGSMData_With_EquipIndiv', Base.metadata, autoload=True) 
DataRfidWithSite = Table('VRfidData_With_equipSite', Base.metadata, autoload=True) 
DataRfidasFile = Table('V_dataRFID_as_file', Base.metadata, autoload=True) 


# ------------------------------------------------------------------------------------------------------------------------- #
# List all PTTs having unchecked locations, with individual id and number of locations.
@view_config(route_name=route_prefix+'uncheckedDatas',renderer='json')
def type_unchecked_list(request):
    session = request.dbsession

    type_= request.matchdict['type']
    if type_ == 'argos' :
        unchecked = ArgosDatasWithIndiv
    elif type_ == 'gsm' :
        unchecked = GsmDatasWithIndiv
    elif type_ == 'rfid':
        return unchecked_rfid(request)

    selectStmt = select([unchecked.c['FK_Individual'],unchecked.c['FK_ptt'], unchecked.c['FK_Sensor'], unchecked.c['StartDate'], unchecked.c['EndDate'],

            func.count().label('nb'), func.max(unchecked.c['date']).label('max_date'),
            func.min(unchecked.c['date']).label('min_date')])

    queryStmt = selectStmt.where(unchecked.c['checked'] == 0
            ).group_by(unchecked.c['FK_Individual'],unchecked.c['FK_ptt'], unchecked.c['StartDate'], unchecked.c['EndDate'], unchecked.c['FK_Sensor'],
            ).order_by(unchecked.c['FK_ptt'].asc())
    data = session.execute(queryStmt).fetchall()
    dataResult = [dict(row) for row in data]
    result = [{'total_entries':len(dataResult)}]
    result.append(dataResult)
    return result

def unchecked_rfid(request):
    session = request.dbsession

    unchecked = DataRfidasFile
    queryStmt = select(unchecked.c)
    data = DBSession().execute(queryStmt).fetchall()
    dataResult = [dict(row) for row in data]
    result = [{'total_entries':len(dataResult)}]
    result.append(dataResult)
    return result

# ------------------------------------------------------------------------------------------------------------------------- #
@view_config(route_name=route_prefix+'uncheckedDatas/id_indiv/ptt',renderer='json',request_method = 'GET')
def details_unchecked_indiv(request):
    session = request.dbsession

    type_= request.matchdict['type']
    id_indiv = request.matchdict['id_indiv']

    if(id_indiv == 'none'):
        id_indiv = None
    ptt = request.matchdict['id_ptt']

    if type_ == 'argos' :
        unchecked = ArgosDatasWithIndiv
    elif type_ == 'gsm' :
        unchecked = GsmDatasWithIndiv

    if 'geo' in request.params :
        queryGeo = select([unchecked.c['PK_id'],unchecked.c['type'],unchecked.c['lat'],unchecked.c['lon'],unchecked.c['date']]
            ).where(and_(unchecked.c['FK_ptt']== ptt
                ,and_(unchecked.c['checked'] == 0,unchecked.c['FK_Individual'] == id_indiv)))
            
        dataGeo = session.execute(queryGeo).fetchall()
        geoJson = []
        for row in dataGeo:
            geoJson.append({'type':'Feature', 'id': row['PK_id'], 'properties':{'type':row['type'], 'date':row['date']}
                , 'geometry':{'type':'Point', 'coordinates':[row['lat'],row['lon']]}})
        result = {'type':'FeatureCollection', 'features':geoJson}
    else : 
        query = select([unchecked]
            ).where(and_(unchecked.c['FK_ptt']== ptt
                ,and_(unchecked.c['checked'] == 0,unchecked.c['FK_Individual'] == id_indiv))).order_by(desc(unchecked.c['date']))
        data = session.execute(query).fetchall()

        df = pd.DataFrame.from_records(data, columns=data[0].keys(), coerce_float=True)
        X1 = df.iloc[:-1][['lat', 'lon']].values
        X2 = df.iloc[1:][['lat', 'lon']].values
        df['dist'] = np.append(haversine(X1, X2), 0).round(3)
        # Compute the speed
        df['speed'] = (df['dist'] / ((df['date'] - df['date'].shift(-1)).fillna(1) / np.timedelta64(1, 'h'))).round(3)
        df['date'] = df['date'].apply(lambda row: np.datetime64(row).astype(datetime)) 
        # Fill NaN
        df.fillna(value={'ele':-999}, inplace=True)
        df.fillna(value={'speed':0}, inplace=True)
        df.replace(to_replace = {'speed': np.inf}, value = {'speed':9999}, inplace = True)
        df.fillna(value=0,inplace=True)
        # dataResult = [dict(row) for row in data]
        dataResult = df.to_dict('records')
        result = [{'total_entries':len(dataResult)}]
        result.append(dataResult)

    return result

# ------------------------------------------------------------------------------------------------------------------------- #

@view_config(route_name = route_prefix+'uncheckedDatas/id_indiv/ptt', renderer = 'json' , request_method = 'POST' )
def manual_validate(request) :
    session = request.dbsession

    ptt = asInt(request.matchdict['id_ptt'])
    ind_id = asInt(request.matchdict['id_indiv'])
    type_ = request.matchdict['type']
    user = request.authenticated_userid['iss']
    user = 1
    data = json.loads(request.params['data'])

    procStockDict = {
    'argos': '[sp_validate_Argos_GPS]',
    'gsm': '[sp_validate_GSM]'
    }

    try : 
        if isinstance( ind_id, int ): 
            xml_to_insert = data_to_XML(data)
            # validate unchecked ARGOS_ARGOS or ARGOS_GPS data from xml data PK_id.
            start = time.time()
            # push xml data to insert into stored procedure in order ==> create stations and protocols if not exist
            stmt = text(""" DECLARE @nb_insert int , @exist int, @error int;
                exec """+ dbConfig['data_schema'] + """."""+procStockDict[type_]+""" :id_list, :ind_id , :user , :ptt, @nb_insert OUTPUT, @exist OUTPUT , @error OUTPUT;
                    SELECT @nb_insert, @exist, @error; """
                ).bindparams(bindparam('id_list', xml_to_insert),bindparam('ind_id', ind_id),bindparam('ptt', ptt)
                ,bindparam('user', user))
            nb_insert, exist , error = session.execute(stmt).fetchone()
            transaction.commit()

            stop = time.time()
            return { 'inserted' : nb_insert, 'existing' : exist, 'errors' : error}
        else : 
            return error_response(None)
    except  Exception as err :
        print_exc()
        return error_response(err)

@view_config(route_name = route_prefix+'uncheckedDatas', renderer = 'json' , request_method = 'POST' )
def auto_validation(request):
    session = request.dbsession

    type_ = request.matchdict['type']
    # print ('\n*************** AUTO VALIDATE *************** \n')
    param = request.params.mixed()
    freq = param['frequency']
    listToValidate = json.loads(param['toValidate'])
    user = request.authenticated_userid['iss']
    user = 1 
    if freq == 'all' :
        freq = 1

    Total_nb_insert = 0
    Total_exist = 0
    Total_error = 0

    if type_ == 'rfid':
        for row in listToValidate : 
            equipID = row['equipID']
            sensor = row['FK_Sensor']
            if equipID == 'null' or equipID is None: 
                equipID = None
            else :
                equipID = int(equipID)
            nb_insert, exist, error = auto_validate_proc_stocRfid(equipID,sensor,freq,user,session)
            Total_exist += exist
            Total_nb_insert += nb_insert
            Total_error += error
    else:
        for row in listToValidate : 
            ind_id = row['FK_Individual']
            ptt = row['FK_ptt']

            try :
                ind_id = int(ind_id)
            except TypeError:
                ind_id = None

            nb_insert, exist, error = auto_validate_stored_procGSM_Argos(ptt,ind_id,1, type_,freq,session)
            Total_exist += exist
            Total_nb_insert += nb_insert
            Total_error += error

    return { 'inserted' : Total_nb_insert, 'existing' : Total_exist, 'errors' : Total_error}

def auto_validate_stored_procGSM_Argos(ptt, ind_id,user,type_,freq,session):
    procStockDict = {
    'argos': '[sp_auto_validate_Argos_GPS]',
    'gsm': '[sp_auto_validate_GSM]'
    }

    if type_ == 'argos' :
        table = ArgosDatasWithIndiv
    elif type_ == 'gsm' :
        table = GsmDatasWithIndiv

    if ind_id is None:
        stmt = update(table).where(and_(table.c['FK_Individual'] == None, table.c['FK_ptt'] == ptt)
            ).where(table.c['checked'] == 0).values(checked =1)
 
        session.execute(stmt)
        nb_insert = exist = error = 0
    else:
        stmt = text(""" DECLARE @nb_insert int , @exist int , @error int;
        exec """+ dbConfig['data_schema'] + """."""+procStockDict[type_]+""" :ptt , :ind_id , :user ,:freq , @nb_insert OUTPUT, @exist OUTPUT, @error OUTPUT;
        SELECT @nb_insert, @exist, @error; """
        ).bindparams(bindparam('ind_id', ind_id),bindparam('user', user),bindparam('freq', freq),bindparam('ptt', ptt))
        nb_insert, exist , error= session.execute(stmt).fetchone()

    return nb_insert, exist , error

def auto_validate_proc_stocRfid(equipID,sensor,freq,user,session):
    if equipID is None : 
        stmt = update(DataRfidWithSite).where(and_(DataRfidWithSite.c['FK_Sensor'] == sensor, DataRfidWithSite.c['equipID'] == equipID)).values(checked =1)
        session.execute(stmt)
        nb_insert = exist = error = 0
    else :
        stmt = text(""" DECLARE @nb_insert int , @exist int , @error int;
            exec """+ dbConfig['data_schema'] + """.[sp_validate_rfid]  :equipID,:freq, :user , @nb_insert OUTPUT, @exist OUTPUT, @error OUTPUT;
            SELECT @nb_insert, @exist, @error; """
            ).bindparams(bindparam('equipID', equipID),bindparam('user', user),bindparam('freq', freq))
        nb_insert, exist , error= session.execute(stmt).fetchone()

    return nb_insert, exist , error
