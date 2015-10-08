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
from ..Models import Base, dbConfig, DBSession



route_prefix = 'sensors/'
def asInt(s):
    try:
        return int(s)
    except:
        return None

ArgosDatasWithIndiv = Table('VArgosData_With_EquipIndiv', Base.metadata, autoload=True)
GsmDatasWithIndiv = Table('VGSMData_With_EquipIndiv', Base.metadata, autoload=True)

# ------------------------------------------------------------------------------------------------------------------------- #
# @view_config(route_name= route_prefix+'uncheckedDatas/action', renderer='json', request_method = 'GET', permission = NO_PERMISSION_REQUIRED)
# def actionOnIndividuals(request):
#     print ('\n*********************** Action **********************\n')
#     dictActionFunc = {
#     'count' : count_,
#     'forms' : getForms,
#     '0' : getForms,
#     'getFields': getFields,
#     'getFilters': getFilters,
#     }
#     actionName = request.matchdict['action']
#     return dictActionFunc[actionName](request)

# def getFields(request) :

#     ModuleType = request.params['name']
#     if ModuleType == 'default' :
#         ModuleType = 'IndivFilter'
#     cols = Individual().GetGridFields(ModuleType)
#     transaction.commit()
#     return cols


# ------------------------------------------------------------------------------------------------------------------------- #
# List all PTTs having unchecked locations, with individual id and number of locations.
@view_config(route_name=route_prefix+'uncheckedDatas',renderer='json', permission = NO_PERMISSION_REQUIRED)
def type_unchecked_list(request):
    type_= request.matchdict['type']

    if type_ == 'argos' :
        unchecked = ArgosDatasWithIndiv
    elif type_ == 'gsm' :
        unchecked = GsmDatasWithIndiv

    selectStmt = select([unchecked.c['FK_Individual'], unchecked.c['StartDate'], unchecked.c['EndDate'],
            func.count().label('nb'), func.max(unchecked.c['date']).label('max_date'),
            func.min(unchecked.c['date']).label('min_date')])
    selectCount = select([func.count()])

    queryStmt = selectStmt.where(unchecked.c['checked'] == 0
            ).group_by(unchecked.c['FK_Individual'], unchecked.c['StartDate'], unchecked.c['EndDate']
            ).order_by(unchecked.c['FK_Individual'].desc())
    data = DBSession.execute(queryStmt).fetchall()

    dataResult = [dict(row) for row in data]
    result = [{'total_entries':len(dataResult)}]
    result.append(dataResult)
    print (result)
    return result

# ------------------------------------------------------------------------------------------------------------------------- #
@view_config(route_name=route_prefix+'uncheckedDatas/id_indiv',renderer='json', permission = NO_PERMISSION_REQUIRED)
def details_unchecked_indiv(request):
    type_= request.matchdict['type']
    id_indiv = request.matchdict['id_indiv']

    if type_ == 'argos' :
        unchecked = ArgosDatasWithIndiv
    elif type_ == 'gsm' :
        unchecked = GsmDatasWithIndiv

    if 'geo' in request.params :
        queryGeo = select([unchecked.c['type'],unchecked.c['lat'],unchecked.c['lon'],unchecked.c['date']]
            ).where(and_(unchecked.c['checked'] == 0,unchecked.c['FK_Individual'] == id_indiv))
        dataGeo = DBSession.execute(queryGeo).fetchall()

        geoJson = []
        for row in dataGeo:
            geoJson.append({'type':'Feature', 'properties':{'type':row['type'], 'date':row['date']}
                , 'geometry':{'type':'Point', 'coordinates':[row['lon'],row['lat']]}})
        result = {'type':'FeatureCollection', 'features':geoJson}
    else : 
        query = select([unchecked]).where(and_(unchecked.c['checked'] == 0,unchecked.c['FK_Individual'] == id_indiv))
        data = DBSession.execute(query).fetchall()
        dataResult = [dict(row) for row in data]
        result = [{'total_entries':len(dataResult)}]
        result.append(dataResult)

    return result


# ------------------------------------------------------------------------------------------------------------------------- #
# @view_config(route_name=route_prefix + 'unchecked/count', renderer='json')
# def argos_unchecked_count(request):
#         """Returns the unchecked argos data count."""
#         return DBSession.query(func.count(Argos.pk)
#                 ).filter(Argos.checked == False).scalar()
     
# @view_config(route_name = 'gps/unchecked/count', renderer = 'json')
# def gps_unchecked_count(request):
#         """Returns the unchecked gps data count."""
#         return {'count': DBSession.query(func.count(Gps.pk)
#                 ).filter(Gps.checked == 0).scalar()}

# @view_config(route_name = 'argos/import', renderer = 'json')
# def argos_manual_validate(request) :

#     ptt = request.matchdict['id']
#     data = request.json_body.get('data')
#     ind_id = request.matchdict['ind_id']
#     type_ = request.matchdict['type']
#     ind_id = asInt(ind_id)
    
#     try : 
#         if isinstance( ind_id, int ): 
#             xml_to_insert = data_to_XML(data)
#             # validate unchecked ARGOS_ARGOS or ARGOS_GPS data from xml data PK_id.         
#             start = time.time()
#             # push xml data to insert into stored procedure in order ==> create stations and protocols if not exist
#             stmt = text(""" DECLARE @nb_insert int , @exist int, @error int;

#                 exec """+ dbConfig['data_schema'] + """.[sp_validate_argosArgos_argosGPS] :id_list, :ind_id , :user , :ptt , @nb_insert OUTPUT, @exist OUTPUT , @error OUTPUT;
#                     SELECT @nb_insert, @exist, @error; """
#                 ).bindparams(bindparam('id_list', xml_to_insert),bindparam('ind_id', ind_id),bindparam('user', request.authenticated_userid),bindparam('ptt', ptt))
#             nb_insert, exist , error = DBSession.execute(stmt).fetchone()
#             transaction.commit()

#             stop = time.time()
#             return str(nb_insert)+' stations/protocols was inserted, '+str(exist)+' are already existing and '+str(error)+' error(s)'
#         else : 
#             return error_response(None)
#     except  Exception as err :
#         return error_response(err)

# @view_config(route_name=route_prefix + 'import/auto', renderer='json', request_method='POST')
# def data_argos_validation_auto(request):
#     # try :
#         ptt = request.matchdict['id']
#         ind_id = request.matchdict['ind_id']
#         type_ = request.matchdict['type']
#         print (ind_id)

#         print ('\n*************** AUTO VALIDATE *************** \n')
#         param = request.json_body
#         freq = param['frequency']
#         if freq == 'all' :
#             freq = 1

#         if ind_id == None or ind_id == 'null' : 
#             ind_id = None
#         else :
#             ind_id = int(ind_id)

#         # ind_id = asInt(ind_id)
#         nb_insert, exist , error = auto_validate_argos_gps(ptt,ind_id,request.authenticated_userid,type_,freq)
#         return str(nb_insert)+' stations/protocols inserted, '+str(exist)+' existing and '+str(error)+' error(s)'
#         # else : 
#         #     return error_response(None) 
#     # except  Exception as err :
#     #     return error_response(err)

# def error_response (err) : 
        
#         if err !=None : 
#             msg = err.args[0] if err.args else ""
#             response=Response('Problem occurs : '+str(type(err))+' = '+msg)
#         else : 
#             response=Response('No induvidual is equiped with this ptt at this date')
#         response.status_int = 500
#         return response

# @view_config(route_name=route_prefix + 'importAll/auto', renderer='json', request_method='POST')
# def data_argos_ALL_validation_auto(request):
#     unchecked_list = argos_unchecked_list(request)
#     type_ = request.matchdict['type']
#     param = request.json_body
#     freq = param['frequency']
#     if freq == 'all':
#         freq = 1
#     Total_nb_insert = 0
#     Total_exist = 0
#     Total_error = 0
#     start = time.time()
#     try : 
#         for row in unchecked_list : 
#             ptt = row['platform_']
#             ind_id = row['ind_id']

#             if ind_id == None or ind_id == 'null' : 
#                 ind_id = None
#             else :
#                 ind_id = int(ind_id)
                
#             nb_insert, exist, error = auto_validate_argos_gps(ptt,ind_id,request.authenticated_userid, type_,freq)
#             Total_exist += exist
#             Total_nb_insert += nb_insert
#             Total_error += error
#         stop = time.time()
#         return str(Total_nb_insert)+' stations/protocols inserted, '+str(Total_exist)+' existing and '+str(Total_error)+' error(s)'
#     except  Exception as err :

#         msg = err.args[0] if err.args else ""
#         response=Response('Problem occurs  : '+str(type(err))+' = '+msg)
#         response.status_int = 500
#         return response

# def auto_validate_argos_gps (ptt,ind_id,user,type_,freq) :

#     if ind_id is not None : 
#         start = time.time()
#         stmt = text(""" DECLARE @nb_insert int , @exist int , @error int;

#             exec """+ dbConfig['data_schema'] + """.[sp_auto_validate_argosArgos_argosGPS] :ptt , :ind_id , :user ,:freq , @nb_insert OUTPUT, @exist OUTPUT, @error OUTPUT;
#                 SELECT @nb_insert, @exist, @error; """
#             ).bindparams(bindparam('ptt', ptt), bindparam('ind_id', ind_id),bindparam('user', user),bindparam('freq', freq))
#         nb_insert, exist , error= DBSession.execute(stmt).fetchone()
#         transaction.commit()

#         stop = time.time()
#         return nb_insert, exist , error
#     else :
#         table = V_dataARGOS_GPS_with_IndivEquip
#         stmt = update(table).where(and_(table.ind_id == None, table.ptt == ptt)).values(checked =1)
#         DBSession.execute(stmt)
#         transaction.commit()
#         return 0,0,0


# @view_config(route_name = 'argos/check', renderer = 'json')
# def argos_check(request):
#      argos_id = array('i')
#      gps_id = array('i')
#      try:
#             for ptt_obj in request.json_body:
#                  ptt = ptt_obj['ptt']
#                  ind_id = ptt_obj['ind_id']
#                  for location in ptt_obj['locations']:
#                         if location['type'] == 0:
#                              argos_id.append(location['id'])
#                         elif location['type'] == 1:
#                              gps_id.append(location['id'])
#             DBSession.execute(update(Argos).where(Argos.id.in_(argos_id)).values(checked=True))
#             DBSession.execute(update(Gps).where(Gps.id.in_(gps_id)).values(checked=True))
#             return {'argosChecked': len(argos_id), 'gpsChecked':len(gps_id)}
#      except Exception as e:
#             raise


# @view_config(route_name= 'argos/details', renderer='json')
# def indiv_details(request):
#     type_= request.matchdict['type']
#     unchecked = V_dataARGOS_GPS_with_IndivEquip
#     ptt = int(request.matchdict['id'])
#     ind_id = int(request.matchdict['ind_id'])
#     join_table = join(Individual,unchecked, Individual.id == unchecked.ind_id) 

#     query = select([Individual.id.label('ind_id'),
#         Individual.survey_type.label('survey_type'),
#         Individual.status.label('status'),
#         Individual.monitoring_status.label('monitoring_status'),
#         Individual.ptt.label('ptt'),
#         Individual.species.label('species'),
#         Individual.breeding_ring.label('breeding_ring'),
#         Individual.release_ring.label('release_ring'),
#         Individual.chip_code.label('chip_code'),
#         Individual.sex.label('sex'),
#         Individual.origin.label('origin'),
#         Individual.age.label('age'),
#         unchecked.begin_date,
#         unchecked.end_date]).select_from(join_table).where(and_(unchecked.ptt == ptt,unchecked.ind_id == ind_id)
#                                                               ).order_by(desc(unchecked.begin_date))
#     data = DBSession.execute(query).first()
#     transaction.commit()
#     result = dict([ (key[0],key[1]) for key in data.items()])
#     query = select([V_Individuals_LatLonDate.c.date]).where(V_Individuals_LatLonDate.c.ind_id == result['ind_id']).order_by(desc(V_Individuals_LatLonDate.c.date)).limit(1)  
#     lastObs = DBSession.execute(query).fetchone()
#     result['last_observation'] = lastObs['date'].strftime('%d/%m/%Y')
#     result['ptt'] = ptt
#     return result

# # Unchecked data for one PTT.
# @view_config(route_name='argos/unchecked/format', renderer='json')
# def argos_unchecked_get_format (request):
#     format_ = request.matchdict['format']
#     platform = int(request.matchdict['id'])
#     ind_id = request.matchdict['ind_id']

#     if format_ == 'json' : 
#         return argos_unchecked_json(platform,ind_id)
#     elif format_ == 'geo' : 
#         return argos_unchecked_geo(platform,ind_id)

# def argos_unchecked_geo(platform,ind_id):
#     """Returns list of unchecked locations for a given ptt."""
#     unchecked = V_dataARGOS_GPS_with_IndivEquip

#     if (ind_id != 'null') :
#         ind_id = int(ind_id)
#     else :
#         ind_id = None

#     query = select([unchecked.data_PK_ID.label('id'),
#         unchecked.lat,
#         unchecked.lon,
#         unchecked.date_.label('date'),
#         unchecked.ele,
#         unchecked.type_]).where(and_(unchecked.ptt == platform,unchecked.ind_id == ind_id)).where(unchecked.checked == 0).order_by(desc(unchecked.date_))
#     data = DBSession.execute(query).fetchall()
#     features = [
#         {
#             'type':'Feature',
#             'properties':{'date':str(date),'type':type_},
#             'geometry':{'type':'Point', 'coordinates':[float(lon),float(lat)]},
#             'id':id_
#         }
#     for id_, lat, lon, date, ele, type_ in data]
#     transaction.commit()
#     result = {'type':'FeatureCollection', 'features':features}
#     return result

# def argos_unchecked_json(platform,ind_id):  
#         unchecked = V_dataARGOS_GPS_with_IndivEquip

#         if (ind_id != 'null') :
#             ind_id = int(ind_id)
#         else :
#             ind_id = None
#         query = select([unchecked.data_PK_ID.label('id'),
#         unchecked.lat,
#         unchecked.lon,
#         unchecked.date_.label('date'),
#         unchecked.ele,
#         unchecked.type_]).where(and_(unchecked.ptt == platform,unchecked.ind_id == ind_id)).where(unchecked.checked == 0).order_by(desc(unchecked.date_))

#         data = DBSession.execute(query).fetchall()
#         # Load data from the DB then
#         # compute the distance between 2 consecutive points.
         
#         df = pd.DataFrame.from_records(data, columns=data[0].keys(), coerce_float=True)
#         X1 = df.iloc[:-1][['lat', 'lon']].values
#         X2 = df.iloc[1:][['lat', 'lon']].values
#         df['dist'] = np.append(haversine(X1, X2), 0).round(3)
#         # Compute the speed
#         df['speed'] = (df['dist'] / ((df['date'] - df['date'].shift(-1)).fillna(1) / np.timedelta64(1, 'h'))).round(3)
#         # Values to import : the first per hour
#         ids = df.set_index('date').resample('1H', how='first').dropna().id.values
#         df['import'] = df.id.isin(ids)
#         df['date'] = df['date'].apply(str) 
#         # Fill NaN
#         df.fillna(value={'ele':-999}, inplace=True)
#         df.fillna(value={'speed':0}, inplace=True)
#         df.replace(to_replace = {'speed': np.inf}, value = {'speed':9999}, inplace = True)
#         return df.to_dict('records')


