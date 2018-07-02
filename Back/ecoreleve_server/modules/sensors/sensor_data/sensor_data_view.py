import json
import transaction
from datetime import datetime
from traceback import print_exc
import numpy as np
import pandas as pd
from pyramid.view import view_config
from pyramid.response import Response
from sqlalchemy import func, desc, select, and_, bindparam, update, text, Table

from ecoreleve_server.core import Base, dbConfig
from ecoreleve_server.utils.distance import haversine
from ecoreleve_server.utils.data_toXML import data_to_XML
from ecoreleve_server.modules.permissions import routes_permission
from ecoreleve_server.modules.statistics import graphDataDate


route_prefix = 'sensors/'


def asInt(s):
    try:
        return int(s)
    except:
        return None


def error_response(err):
    if err is not None:
        msg = err.args[0] if err.args else ""
        response = Response('Problem occurs : ' + str(type(err)) + ' = ' + msg)
    else:
        response = Response('No induvidual equiped')
    response.status_int = 500
    return response

ArgosDatasWithIndiv = Table(
    'VArgosData_With_EquipIndiv', Base.metadata, autoload=True)
GsmDatasWithIndiv = Table('VGSMData_With_EquipIndiv',
                          Base.metadata, autoload=True)
DataRfidWithSite = Table('VRfidData_With_equipSite',
                         Base.metadata, autoload=True)
DataRfidasFile = Table('V_dataRFID_as_file', Base.metadata, autoload=True)


@view_config(route_name=route_prefix + 'uncheckedDatas',
             renderer='json',
             match_param='type=rfid',
             permission=routes_permission['rfid']['GET'])
@view_config(route_name=route_prefix + 'uncheckedDatas',
             renderer='json',
             match_param='type=gsm',
             permission=routes_permission['gsm']['GET'])
@view_config(route_name=route_prefix + 'uncheckedDatas',
             renderer='json',
             match_param='type=argos',
             permission=routes_permission['argos']['GET'])
def type_unchecked_list(request):
    session = request.dbsession

    type_ = request.matchdict['type']
    if type_ == 'argos':
        unchecked = ArgosDatasWithIndiv
    elif type_ == 'gsm':
        unchecked = GsmDatasWithIndiv
    elif type_ == 'rfid':
        return unchecked_rfid(request)

    selectStmt = select([unchecked.c['FK_Individual'],
                         unchecked.c['Survey_type'],
                         unchecked.c['FK_ptt'],
                         unchecked.c['FK_Sensor'],
                         unchecked.c['StartDate'],
                         unchecked.c['EndDate'],
                         func.count().label('nb'),
                         func.max(unchecked.c['date']).label('max_date'),
                         func.min(unchecked.c['date']).label('min_date')])

    queryStmt = selectStmt.where(unchecked.c['checked'] == 0
                                 ).group_by(unchecked.c['FK_Individual'],
                                            unchecked.c['Survey_type'],
                                            unchecked.c['FK_ptt'],
                                            unchecked.c['StartDate'],
                                            unchecked.c['EndDate'],
                                            unchecked.c['FK_Sensor']
                                            ).order_by(unchecked.c['FK_ptt'].asc())
    data = session.execute(queryStmt).fetchall()
    dataResult = [dict(row) for row in data]
    result = [{'total_entries': len(dataResult)}]
    result.append(dataResult)
    return result


def unchecked_rfid(request):
    session = request.dbsession

    unchecked = DataRfidasFile
    queryStmt = select(unchecked.c)
    data = session.execute(queryStmt).fetchall()
    dataResult = [dict(row) for row in data]
    result = [{'total_entries': len(dataResult)}]
    result.append(dataResult)
    return result


@view_config(route_name=route_prefix + 'uncheckedDatas/id_indiv/ptt',
             renderer='json',
             request_method='GET',
             match_param='type=argos',
             permission=routes_permission['argos']['GET'])
@view_config(route_name=route_prefix + 'uncheckedDatas/id_indiv/ptt',
             renderer='json',
             request_method='GET',
             match_param='type=gsm',
             permission=routes_permission['gsm']['GET'])
def details_unchecked_indiv(request):
    session = request.dbsession

    type_ = request.matchdict['type']
    id_indiv = request.matchdict['id_indiv']

    if(id_indiv == 'null'):
        id_indiv = None
    ptt = request.matchdict['id_ptt']

    if type_ == 'argos':
        unchecked = ArgosDatasWithIndiv
    elif type_ == 'gsm':
        unchecked = GsmDatasWithIndiv

    if 'geo' in request.params:
        queryGeo = select([unchecked.c['PK_id'],
                           unchecked.c['type'],
                           unchecked.c['lat'],
                           unchecked.c['lon'],
                           unchecked.c['date']]
                          ).where(and_(unchecked.c['FK_ptt'] == ptt,
                                       and_(unchecked.c['checked'] == 0,
                                            unchecked.c['FK_Individual'] == id_indiv)
                                       ))

        dataGeo = session.execute(queryGeo).fetchall()
        geoJson = []
        for row in dataGeo:
            geoJson.append({'type': 'Feature',
                            'id': row['PK_id'],
                            'properties': {'type': row['type'],
                                           'date': row['date'].strftime('%Y-%m-%d %H:%M:%S')},
                            'geometry': {'type': 'Point',
                                         'coordinates': [row['lat'], row['lon']]}
                            })
        result = {'type': 'FeatureCollection', 'features': geoJson}
    else:
        query = select([unchecked]
                       ).where(and_(unchecked.c['FK_ptt'] == ptt,
                                    and_(unchecked.c['checked'] == 0,
                                         unchecked.c['FK_Individual'] == id_indiv))
                               ).order_by(desc(unchecked.c['date']))
        data = session.execute(query).fetchall()

        df = pd.DataFrame.from_records(
            data, columns=data[0].keys(), coerce_float=True)
        X1 = df.iloc[:-1][['lat', 'lon']].values
        X2 = df.iloc[1:][['lat', 'lon']].values
        df['dist'] = np.append(haversine(X1, X2), 0).round(3)
        # Compute the speed
        df['speed'] = (df['dist'] / ((df['date'] - df['date'].shift(-1)
                                      ).fillna(1) / np.timedelta64(1, 'h'))).round(3)
        df['date'] = df['date'].apply(
            lambda row: np.datetime64(row).astype(datetime))
        # Fill NaN
        df.fillna(value={'ele': -999}, inplace=True)
        df.fillna(value={'speed': 0}, inplace=True)
        df.replace(to_replace={'speed': np.inf},
                   value={'speed': 9999}, inplace=True)
        df.fillna(value=0, inplace=True)

        dataResult = df.to_dict('records')
        result = [{'total_entries': len(dataResult)}]
        result.append(dataResult)

    return result


@view_config(route_name=route_prefix + 'uncheckedDatas/id_indiv/ptt',
             renderer='json',
             request_method='POST',
             permission=routes_permission['gsm']['POST'])
def manual_validate(request):
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

    try:
        if isinstance(ind_id, int):
            xml_to_insert = data_to_XML(data)
            stmt = text(""" DECLARE @nb_insert int , @exist int, @error int;
                exec """ + dbConfig['data_schema'] + """.""" + procStockDict[type_]
                        + """ :id_list, :ind_id , :user , :ptt, @nb_insert OUTPUT, @exist OUTPUT , @error OUTPUT;
                    SELECT @nb_insert, @exist, @error; """
                        ).bindparams(bindparam('id_list', xml_to_insert),
                                     bindparam('ind_id', ind_id),
                                     bindparam('ptt', ptt),
                                     bindparam('user', user))
            nb_insert, exist, error = session.execute(stmt).fetchone()
            transaction.commit()

            graphDataDate['pendingSensorData'] = None
            graphDataDate['indivLocationData'] = None
            return {'inserted': nb_insert, 'existing': exist, 'errors': error}
        else:
            return error_response(None)
    except Exception as err:
        print_exc()
        return error_response(err)


@view_config(route_name=route_prefix + 'uncheckedDatas',
             renderer='json',
             request_method='POST',
             match_param='type=rfid',
             permission=routes_permission['rfid']['POST'])
@view_config(route_name=route_prefix + 'uncheckedDatas',
             renderer='json',
             request_method='POST',
             match_param='type=gsm',
             permission=routes_permission['gsm']['POST'])
@view_config(route_name=route_prefix + 'uncheckedDatas',
             renderer='json',
             request_method='POST',
             match_param='type=argos',
             permission=routes_permission['argos']['POST'])
def auto_validation(request):
    session = request.dbsession
    global graphDataDate

    type_ = request.matchdict['type']
    param = request.params.mixed()
    freq = param['frequency']
    listToValidate = json.loads(param['toValidate'])
    user = request.authenticated_userid['iss']

    if freq == 'all':
        freq = 1

    Total_nb_insert = 0
    Total_exist = 0
    Total_error = 0

    if listToValidate == 'all':
        Total_nb_insert, Total_exist, Total_error = auto_validate_ALL_stored_procGSM_Argos(
            user, type_, freq, session)
    else:
        if type_ == 'rfid':
            for row in listToValidate:
                equipID = row['equipID']
                sensor = row['FK_Sensor']
                if equipID == 'null' or equipID is None:
                    equipID = None
                else:
                    equipID = int(equipID)
                nb_insert, exist, error = auto_validate_proc_stocRfid(
                    equipID, sensor, freq, user, session)
                session.commit()
                Total_exist += exist
                Total_nb_insert += nb_insert
                Total_error += error
        else:
            for row in listToValidate:
                ind_id = row['FK_Individual']
                ptt = row['FK_ptt']

                try:
                    ind_id = int(ind_id)
                except TypeError:
                    ind_id = None

                nb_insert, exist, error = auto_validate_stored_procGSM_Argos(
                    ptt, ind_id, user, type_, freq, session)
                session.commit()

                Total_exist += exist
                Total_nb_insert += nb_insert
                Total_error += error

    graphDataDate['pendingSensorData'] = None
    graphDataDate['indivLocationData'] = None
    return {'inserted': Total_nb_insert, 'existing': Total_exist, 'errors': Total_error}


def auto_validate_stored_procGSM_Argos(ptt, ind_id, user, type_, freq, session):
    procStockDict = {
        'argos': '[sp_auto_validate_Argos_GPS]',
        'gsm': '[sp_auto_validate_GSM]'
    }

    if type_ == 'argos':
        table = ArgosDatasWithIndiv
    elif type_ == 'gsm':
        table = GsmDatasWithIndiv

    if ind_id is None:
        stmt = update(table).where(and_(table.c['FK_Individual'] == None,
                                        table.c['FK_ptt'] == ptt)
                                   ).where(table.c['checked'] == 0).values(checked=1)

        session.execute(stmt)
        nb_insert = exist = error = 0
    else:
        stmt = text(""" DECLARE @nb_insert int , @exist int , @error int;
        exec """ + dbConfig['data_schema'] + """.""" + procStockDict[type_]
                    + """ :ptt , :ind_id , :user ,:freq , @nb_insert OUTPUT, @exist OUTPUT, @error OUTPUT;
        SELECT @nb_insert, @exist, @error; """
                    ).bindparams(bindparam('ind_id', ind_id),
                                 bindparam('user', user),
                                 bindparam('freq', freq),
                                 bindparam('ptt', ptt))
        nb_insert, exist, error = session.execute(stmt).fetchone()

    return nb_insert, exist, error


def auto_validate_proc_stocRfid(equipID, sensor, freq, user, session):
    if equipID is None:
        stmt = update(DataRfidWithSite).where(and_(DataRfidWithSite.c[
            'FK_Sensor'] == sensor, DataRfidWithSite.c['equipID'] == equipID)).values(checked=1)
        session.execute(stmt)
        nb_insert = exist = error = 0
    else:
        stmt = text(""" DECLARE @nb_insert int , @exist int , @error int;
            exec """ + dbConfig['data_schema']
                    + """.[sp_validate_rfid]  :equipID,:freq, :user , @nb_insert OUTPUT, @exist OUTPUT, @error OUTPUT;
            SELECT @nb_insert, @exist, @error; """
                    ).bindparams(bindparam('equipID', equipID),
                                 bindparam('user', user),
                                 bindparam('freq', freq))
        nb_insert, exist, error = session.execute(stmt).fetchone()

    return nb_insert, exist, error


def auto_validate_ALL_stored_procGSM_Argos(user, type_, freq, session):
    procStockDict = {
        'argos': '[sp_auto_validate_ALL_Argos_GPS]',
        'gsm': '[sp_auto_validate_ALL_GSM]',
        'rfid': '[sp_validate_ALL_rfid]'
    }

    stmt = text(""" DECLARE @nb_insert int , @exist int , @error int;
    exec """ + dbConfig['data_schema'] + """.""" + procStockDict[type_] + """ :user ,:freq , @nb_insert OUTPUT, @exist OUTPUT, @error OUTPUT;
    SELECT @nb_insert, @exist, @error; """
                ).bindparams(bindparam('user', user), bindparam('freq', freq))
    nb_insert, exist, error = session.execute(stmt).fetchone()

    return nb_insert, exist, error
