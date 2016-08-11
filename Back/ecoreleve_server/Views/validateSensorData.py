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
from ..Models import Base, dbConfig, DBSession,ArgosGps,graphDataDate,CamTrap
from traceback import print_exc
from pyramid import threadlocal


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
DataCamTrapFile = Table('V_dataCamTrap_With_equipSite', Base.metadata, autoload=True)


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
    elif type_ == 'camtrap':
        return unchecked_camtrap(request)

    selectStmt = select([unchecked.c['FK_Individual'],unchecked.c['Survey_type'],unchecked.c['FK_ptt'], unchecked.c['FK_Sensor'], unchecked.c['StartDate'], unchecked.c['EndDate'],

            func.count().label('nb'), func.max(unchecked.c['date']).label('max_date'),
            func.min(unchecked.c['date']).label('min_date')])

    queryStmt = selectStmt.where(unchecked.c['checked'] == 0
            ).group_by(unchecked.c['FK_Individual'],unchecked.c['Survey_type'],unchecked.c['FK_ptt'], unchecked.c['StartDate'], unchecked.c['EndDate'], unchecked.c['FK_Sensor'],
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
    data = session.execute(queryStmt).fetchall()
    dataResult = [dict(row) for row in data]
    result = [{'total_entries':len(dataResult)}]
    result.append(dataResult)
    return result

def unchecked_camtrap(request):
    session = request.dbsession

    unchecked = DataCamTrapFile
    queryMoche = "SELECT equipID,UnicIdentifier,fk_sensor,site_name,FK_MonitoredSite,site_type,StartDate,EndDate,COUNT(DISTINCT pk_id) AS nb_photo FROM [dbo].V_dataCamTrap_With_equipSite WHERE equipID IS NOT NULL GROUP BY UnicIdentifier, site_name, site_type, StartDate, EndDate, equipID, fk_sensor, FK_MonitoredSite;"
    #queryStmt = select(unchecked.c)
    #data = session.execute(queryStmt).fetchall()
    data2 = session.execute(queryMoche).fetchall()
    dataResult = [dict(row) for row in data2]
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
    elif type_ == 'camtrap':
        return details_unchecked_camtrap(request)


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
@view_config(route_name=route_prefix+'uncheckedDatas/id_indiv/ptt/id_equip',renderer='json',request_method = 'GET')
def details_unchecked_indiv(request):
    session = request.dbsession

    type_= request.matchdict['type']
    id_indiv = request.matchdict['id_indiv']
    id_equip = request.matchdict['id_equip']

    if(id_indiv == 'none'):
        id_indiv = None
    ptt = request.matchdict['id_ptt']


    if type_ == 'argos' :
        unchecked = ArgosDatasWithIndiv
    elif type_ == 'gsm' :
        unchecked = GsmDatasWithIndiv
    elif type_ == 'camtrap':
        return details_unchecked_camtrap(request)


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

def details_unchecked_camtrap(request):
    session = threadlocal.get_current_request().dbsession
    result = []
    id_indiv = request.matchdict['id_indiv']
    if(id_indiv == 'none'):
        id_indiv = None
    ptt = request.matchdict['id_ptt']
    id_equip = request.matchdict['id_equip']

    unchecked = DataCamTrapFile
    """query = select([unchecked]
        ).where(and_(unchecked.c['FK_sensor']== ptt
            ,and_(unchecked.c['checked'] == 0,unchecked.c['FK_MonitoredSite'] == id_indiv))).order_by(desc(unchecked.c['date']))"""

    query = 'select PK_id,path,name,checked,validated,tags from ecoReleve_Sensor.dbo.TcameraTrap where pk_id in (select pk_id from [dbo].V_dataCamTrap_With_equipSite where fk_sensor = '+str(id_indiv)+' AND FK_MonitoredSite = '+str(ptt)+' AND equipID ='+str(id_equip)+' );'
    data = session.execute(query).fetchall()
    dataResults = [dict(row) for row in data]
    for tmp in dataResults:
        varchartmp = tmp['path'].split('\\')
        tmp['path']="imgcamtrap/"+str(varchartmp[len(varchartmp)-2])+"/"
        tmp['name'] = tmp['name'].replace(" ","%20")
        tmp['id'] = tmp['PK_id']

    result = [{'total_entries':len(dataResults)}]
    result.append(dataResults)
    ''' todo '''
    return dataResults
# ------------------------------------------------------------------------------------------------------------------------- #

@view_config(route_name = route_prefix+'uncheckedDatas/id_indiv/ptt', renderer = 'json' , request_method = 'POST' )
def manual_validate(request) :
    global graphDataDate
    session = request.dbsession

    ptt = asInt(request.matchdict['id_ptt'])
    ind_id = asInt(request.matchdict['id_indiv'])
    type_ = request.matchdict['type']
    user = request.authenticated_userid['iss']

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
            graphDataDate['pendingSensorData'] = None
            graphDataDate['indivLocationData'] = None
            return { 'inserted' : nb_insert, 'existing' : exist, 'errors' : error}
        else :
            return error_response(None)
    except  Exception as err :
        print_exc()
        return error_response(err)

@view_config(route_name = route_prefix+'uncheckedDatas', renderer = 'json' , request_method = 'POST' )
def auto_validation(request):
    session = request.dbsession
    global graphDataDate

    type_ = request.matchdict['type']
    if type_ == 'camtrap':
        return validateCamTrap(request)
    # print ('\n*************** AUTO VALIDATE *************** \n')
    param = request.params.mixed()
    freq = param['frequency']
    listToValidate = json.loads(param['toValidate'])
    user = request.authenticated_userid['iss']

    if freq == 'all' :
        freq = 1

    Total_nb_insert = 0
    Total_exist = 0
    Total_error = 0

    if listToValidate == 'all':
        Total_nb_insert,Total_exist,Total_error = auto_validate_ALL_stored_procGSM_Argos(user,type_,freq,session)
    else :
        if type_ == 'rfid':
            for row in listToValidate :
                equipID = row['equipID']
                sensor = row['FK_Sensor']
                if equipID == 'null' or equipID is None:
                    equipID = None
                else :
                    equipID = int(equipID)
                nb_insert, exist, error = auto_validate_proc_stocRfid(equipID,sensor,freq,user,session)
                session.commit()
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

                nb_insert, exist, error = auto_validate_stored_procGSM_Argos(ptt,ind_id,user, type_,freq,session)
                session.commit()

                Total_exist += exist
                Total_nb_insert += nb_insert
                Total_error += error

    graphDataDate['pendingSensorData'] = None
    graphDataDate['indivLocationData'] = None
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

def auto_validate_ALL_stored_procGSM_Argos(user,type_,freq,session):
    procStockDict = {
    'argos': '[sp_auto_validate_ALL_Argos_GPS]',
    'gsm': '[sp_auto_validate_ALL_GSM]',
    'rfid' : '[sp_validate_ALL_rfid]'
    }

    stmt = text(""" DECLARE @nb_insert int , @exist int , @error int;
    exec """+ dbConfig['data_schema'] + """."""+procStockDict[type_]+""" :user ,:freq , @nb_insert OUTPUT, @exist OUTPUT, @error OUTPUT;
    SELECT @nb_insert, @exist, @error; """
    ).bindparams(bindparam('user', user),bindparam('freq', freq))
    nb_insert, exist , error= session.execute(stmt).fetchone()

    return nb_insert, exist , error

def deletePhotoOnSQL(request ,fk_sensor):
    session = request.dbsession
    #currentPhoto = CamTrap(fk_sensor = fk_sensor)
    currentPhoto = session.query(CamTrap).get(fk_sensor)
    session.delete(currentPhoto)
    return True

def validateCamTrap(request):
    print("route atteinte")
    data = request.params.mixed()
    data = json.loads(data['data'])
    pathPrefix = dbConfig['camTrap']['path']
    for index in data:
        """if ( index['checked'] == None ):
            print( " la photo id :"+str(index['PK_id'])+" "+str(index['name'])+" est a check" )
            #changer status
            request.response.status_code = 510
            return {'message': ""+str(index['name'])+" not checked yet"}
        else :# photo check"""
        if (index['validated'] != None):
            if (index['validated'] == False ):
                pathSplit = index['path'].split('/')
                destfolder = str(pathPrefix)+"\\"+str(pathSplit[1])+"\\"+str(index['name'])
                print (" la photo id :"+str(index['PK_id'])+" "+str(index['name'])+" est a supprimer")
                print("on va supprimier :" +str(destfolder))
                if os.path.isfile(destfolder):
                    os.remove(destfolder)
                deletePhotoOnSQL(request,str(index['PK_id']))

            else:
                print (" la photo id :"+str(index['PK_id'])+" "+str(index['name'])+" est a sauvegarder")
                #inserer en base
        else:
            print( " la photo id :"+str(index['PK_id'])+" "+str(index['name'])+" est a check" )
        """for key in index:
            if ( str(key) =='checkedvalidated'   )
            print ( str(key)+":"+str(index[key]))"""
    return 10
