from array import array

from pyramid.view import view_config
from pyramid.response import Response
from sqlalchemy import func, desc, select, union, union_all, and_, bindparam, update, or_, literal_column, join, text, update, Table
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

# ------------------------------------------------------------------------------------------------------------------------- #
# List all PTTs having unchecked locations, with individual id and number of locations.
@view_config(route_name=route_prefix+'uncheckedDatas',renderer='json', permission = NO_PERMISSION_REQUIRED)
def type_unchecked_list(request):
    type_= request.matchdict['type']

    if type_ == 'argos' :
        unchecked = ArgosDatasWithIndiv
    elif type_ == 'gsm' :
        unchecked = GsmDatasWithIndiv

    selectStmt = select([unchecked.c['FK_Individual'],unchecked.c['FK_ptt'], unchecked.c['StartDate'], unchecked.c['EndDate'],
            func.count().label('nb'), func.max(unchecked.c['date']).label('max_date'),
            func.min(unchecked.c['date']).label('min_date')])
    selectCount = select([func.count()])

    queryStmt = selectStmt.where(unchecked.c['checked'] == 0
            ).group_by(unchecked.c['FK_Individual'],unchecked.c['FK_ptt'], unchecked.c['StartDate'], unchecked.c['EndDate']
            ).order_by(unchecked.c['FK_Individual'].desc())
    data = DBSession.execute(queryStmt).fetchall()

    dataResult = [dict(row) for row in data]
    result = [{'total_entries':len(dataResult)}]
    result.append(dataResult)
    print (result)
    return result

# ------------------------------------------------------------------------------------------------------------------------- #
@view_config(route_name=route_prefix+'uncheckedDatas/ptt/id_indiv',renderer='json',request_method = 'GET', permission = NO_PERMISSION_REQUIRED)
def details_unchecked_indiv(request):
    type_= request.matchdict['type']
    id_indiv = request.matchdict['id_indiv']

    if type_ == 'argos' :
        unchecked = ArgosDatasWithIndiv
    elif type_ == 'gsm' :
        unchecked = GsmDatasWithIndiv

    if 'geo' in request.params :
        queryGeo = select([unchecked.c['type'],unchecked.c['lat'],unchecked.c['lon'],unchecked.c['date']]
            ).where(and_(unchecked.c['FK_ptt']== ptt
                ,and_(unchecked.c['checked'] == 0,unchecked.c['FK_Individual'] == id_indiv)))
            
        dataGeo = DBSession.execute(queryGeo).fetchall()

        geoJson = []
        for row in dataGeo:
            geoJson.append({'type':'Feature', 'properties':{'type':row['type'], 'date':row['date']}
                , 'geometry':{'type':'Point', 'coordinates':[row['lon'],row['lat']]}})
        result = {'type':'FeatureCollection', 'features':geoJson}
    else : 
        query = select([unchecked]
            ).where(and_(unchecked.c['FK_ptt']== ptt
                ,and_(unchecked.c['checked'] == 0,unchecked.c['FK_Individual'] == id_indiv)))

        data = DBSession.execute(query).fetchall()
        dataResult = [dict(row) for row in data]
        result = [{'total_entries':len(dataResult)}]
        result.append(dataResult)

    return result

# ------------------------------------------------------------------------------------------------------------------------- #

@view_config(route_name = route_prefix+'uncheckedDatas/ptt/id_indiv', renderer = 'json' , request_method = 'POST' )
def manual_validate(request) :

    ptt = request.matchdict['id_ptt']
    data = request.json_body.get('data')
    ind_id = asInt(request.matchdict['id_ind'])
    type_ = request.matchdict['type']

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
                ,bindparam('user', request.authenticated_userid))
            nb_insert, exist , error = DBSession.execute(stmt).fetchone()
            transaction.commit()

            stop = time.time()
            return { 'inserted' : nb_insert, 'existing' : exist, 'errors' : error}
        else : 
            return error_response(None)
    except  Exception as err :
        return error_response(err)

@view_config(route_name = route_prefix+'uncheckedDatas', renderer = 'json' , request_method = 'POST' )
def auto_validation(request):

    type_ = request.matchdict['type']

    print ('\n*************** AUTO VALIDATE *************** \n')
    param = request.json_body
    freq = param['frequency']
    listToValidate = param['toValidate']

    if freq == 'all' :
        freq = 1

    if ind_id == 'null' : 
        ind_id = None
    else :
        ind_id = int(ind_id)

    Total_nb_insert = 0
    Total_exist = 0
    Total_error = 0

    for row in listToValidate :
        ind_id = row['FK_Individual']
        ptt = row['FK_ptt']
        
        if ind_id == 'null' : 
            ind_id = None
        else :
            ind_id = int(ind_id)

        nb_insert, exist, error = auto_validate_stored_proc(ptt,ind_id,request.authenticated_userid, type_,freq)
        Total_exist += exist
        Total_nb_insert += nb_insert
        Total_error += error

    return { 'inserted' : Total_nb_insert, 'existing' : Total_exist, 'errors' : Total_error}


def auto_validate_stored_proc(ind_id,user,type_,freq):
    procStockDict = {
    'argos': '[sp_auto_validate_Argos_GPS]',
    'gsm': '[sp_auto_validate_GSM]'
    }

    if type_ == 'argos' :
        table = ArgosDatasWithIndiv
    elif type_ == 'gsm' :
        table = GsmDatasWithIndiv

    if ind_id is None:
        stmt = update(table).where(and_(table.c['FK_Individual'] == None, table.c['FK_ptt'] == ptt)).values(checked =1)
        DBSession.execute(stmt)
        nb_insert = exist = error = 0
    else:
        stmt = text(""" DECLARE @nb_insert int , @exist int , @error int;
        exec """+ dbConfig['data_schema'] + """."""+procStockDict[type_]+""" :ptt , :ind_id , :user ,:freq , @nb_insert OUTPUT, @exist OUTPUT, @error OUTPUT;
        SELECT @nb_insert, @exist, @error; """
        ).bindparams(bindparam('ind_id', ind_id),bindparam('user', user),bindparam('freq', freq),bindparam('ptt', ptt))

        nb_insert, exist , error= DBSession.execute(stmt).fetchone()

    transaction.commit()

    return nb_insert, exist , error