from sqlalchemy import select
from traceback import print_exc
import pandas as pd
import re
import datetime
import itertools

from ecoreleve_server.core import dbConfig
from ..sensors.sensor_data import Gsm, GsmEngineering
from .import_model import Import


def uploadFilesGSM(request):
    # Import unchecked GSM data.
    session = request.dbsession
    response = 'Success'
    user = request.authenticated_userid['iss']

    # detect if is a row file retrieve directly from mail
    ptt_pattern = re.compile('[0]*(?P<platform>[0-9]+)g')
    eng_pattern = re.compile('[0]*(?P<platform>[0-9]+)e')

    # detect if is concatenated file retrieve from exctract GSM python software
    ALL_ptt_pattern = re.compile('GPS')
    ALL_eng_pattern = re.compile('Engineering')

    dict_pattern = {
        'all_gps': ALL_ptt_pattern,
        'all_eng': ALL_eng_pattern,
        'ptt_gps': ptt_pattern,
        'ptt_eng': eng_pattern
    }

    dict_func_data = {
        'all_gps': get_ALL_gps_toInsert,
        'all_eng': get_ALL_eng_toInsert,
        'ptt_gps': get_gps_toInsert,
        'ptt_eng': get_eng_toInsert
    }
    res = None
    try:
        file_obj = request.POST['file']
        filename = request.POST['file'].filename
        importObj = Import(ImportFileName=filename, FK_User=user)
        importObj.ImportType = 'GSM'

        session.add(importObj)
        session.flush()

        for k in dict_pattern:
            if (dict_pattern[k].search(filename)):
                res = dict_func_data[k](file_obj, session, importObj)
    except:
        print_exc()
        response = 'An error occured.'
        request.response.status_code = 500
    return res


def get_ALL_gps_toInsert(file_obj, session, importObj):
    file = file_obj.file
    # Load raw csv data
    csv_data = pd.read_csv(file, sep='\t',
                           index_col=0,
                           parse_dates=True,
                           na_values=['No Fix', 'Batt Drain', 'Low Voltage']
                           )
    # Remove the lines containing NaN and columns
    csv_data.dropna(inplace=True)
    csv_data.drop(['ShowInKML', 'file_date'], axis=1, inplace=True)
    # get list of ptt
    platform_df = csv_data[['GSM_ID']]
    platform_df = platform_df.groupby('GSM_ID')['GSM_ID'].agg(['count'])
    platform_list = platform_df.index.get_values().tolist()
    # go to insert data in the database
    return insert_GPS(platform_list, csv_data, session, importObj)


def get_gps_toInsert(file_obj, session, importObj):
    file = file_obj.file
    filename = file_obj.filename
    ptt_pattern = re.compile('[0]*(?P<platform>[0-9]+)g')
    platform = int(ptt_pattern.search(filename).group('platform'))

    csv_data = pd.read_csv(file, sep='\t',
                           index_col=0,
                           parse_dates=True,
                           # Read those values as NaN
                           na_values=['No Fix', 'Batt Drain', 'Low Voltage'],
                           # Only import the first 8 columns
                           usecols=range(9)
                           )
    # Remove the lines containing NaN
    csv_data.dropna(inplace=True)
    # go to insert data in the database
    return insert_GPS(platform, csv_data, session, importObj)


def insert_GPS(platform, csv_data, session, importObj):
    if (type(platform) is list):
        query = select([Gsm.date]).where(Gsm.platform_.in_(platform))
    elif (type(platform) is int):
        query = select([Gsm.date]).where(Gsm.platform_ == platform)
    else:
        return 'error type : "platform" '
    # Read dates that are already in the database
    df = pd.DataFrame.from_records(session.execute(
        query).fetchall(), index=Gsm.date.name, columns=[Gsm.date.name])
    # Filter data with no elevation by converting the column to numeric type
    csv_data[Gsm.ele.name] = csv_data[
        Gsm.ele.name].convert_objects(convert_numeric=True)

    # Get the data to insert
    data_to_insert = csv_data[~csv_data.index.isin(df.index)]
    # Add the platform to the DataFrame
    nbInsertedGPS = data_to_insert.shape[0]
    nbExistingGPS = csv_data.shape[0] - nbInsertedGPS
    if (type(platform) is int):
        data_to_insert[Gsm.platform_.name] = platform
        res = {'inserted gps':nbInsertedGPS , 'existing gps': nbExistingGPS}
    else:
        if ( nbInsertedGPS != 0):
            ptt_name = 'GSM_ID'
            platform_count = data_to_insert.groupby(
                ptt_name)[ptt_name].agg(['count'])
            res = platform_count.to_dict()
        else:
            res = {'inserted gps': 0, 'existing gps': nbExistingGPS}
    # Add the platform to the DataFrame
    data_to_insert.rename(columns={'GSM_ID': Gsm.platform_.name}, inplace=True)
    # data_to_insert['DateTime'] = data_to_insert.index
    # Write into the database

    # Build block insert statement and returning ID of new created 
    if len(data_to_insert) != 0:
        # stmt = Gsm.__table__.insert().values(data_to_insert)
        # result = DBSession.execute(stmt)
        data_to_insert.loc[:, ('checked')] = list(
            itertools.repeat(0, len(data_to_insert.index)))
        data_to_insert.loc[:, ('imported')] = list(
            itertools.repeat(0, len(data_to_insert.index)))
        data_to_insert.loc[:, ('validated')] = list(
            itertools.repeat(0, len(data_to_insert.index)))
        data_to_insert.loc[:, ('FK_Import')] = list(itertools.repeat(importObj.ID, len(data_to_insert.index)))

        data_to_insert.to_sql(Gsm.__table__.name, session.get_bind(
        ), if_exists='append', schema=dbConfig['sensor_schema'])
        # result = list(map(lambda y: y[0], res))
    # else :
    #     result = []

    importObj.maxDate = csv_data.index.max()
    importObj.minDate = csv_data.index.min()
    importObj.nbRows = nbInsertedGPS + nbExistingGPS
    importObj.nbInserted = nbInsertedGPS
    return res


def get_eng_toInsert(file_obj, session, importObj):
    file = file_obj.file
    filename = file_obj.filename
    eng_pattern = re.compile('[0]*(?P<platform>[0-9]+)e')
    platform = int(eng_pattern.search(filename).group('platform'))
    # Load raw csv data
    csv_data = pd.read_csv(file, sep='\t',
                           index_col=0,
                           parse_dates=True,
                           )
    # Remove the lines containing NaN
    csv_data.dropna(inplace=True)
    return insert_ENG(platform, csv_data, session, importObj)


def get_ALL_eng_toInsert(file_obj, session, importObj):
    file = file_obj.file
    # Load raw csv data
    csv_data = pd.read_csv(file, sep='\t',
                           index_col=0,
                           parse_dates=True,
                           )
    # Remove the lines containing NaN
    csv_data.dropna(inplace=True)
    csv_data.drop(['file_date'], axis=1, inplace=True)
    # get list of ptt
    platform_df = csv_data[['GSM_ID']]
    platform_df = platform_df.groupby('GSM_ID')['GSM_ID'].agg(['count'])
    platform_list = platform_df.index.get_values().tolist()
    # go to insert data in the database
    return insert_ENG(platform_list, csv_data, session, importObj)


def insert_ENG(platform, csv_data, session, importObj):
    if (type(platform) is list):
        query = select([GsmEngineering.date]).where(
            GsmEngineering.platform_.in_(platform))
    elif (type(platform) is int):
        query = select([GsmEngineering.date]).where(
            GsmEngineering.platform_ == platform)
    else:
        return 'error type : "platform" '

    '''# Read dates that are already in the database'''
    df = pd.DataFrame.from_records(session.execute(query).fetchall(
    ), index=GsmEngineering.date.name, columns=[GsmEngineering.date.name])

    data_to_insert = csv_data[~csv_data.index.isin(df.index)]
    # Add the platform to the DataFrame
    nbInsertEng = data_to_insert.shape[0]
    nbExistingEng = csv_data.shape[0] - nbInsertEng
    if (type(platform) is int):
        data_to_insert[GsmEngineering.platform_.name] = platform
        res = {'inserted Engineering': nbInsertEng, 'existing Engineering': nbExistingEng}
    else:
        data_to_insert.rename(
            columns={'GSM_ID': GsmEngineering.platform_.name}, inplace=True)
        if (nbInsertEng != 0):
            platform_count = data_to_insert.groupby(
                GsmEngineering.platform_.name)[
                GsmEngineering.platform_.name].agg(['count'])
            # res = platform_count.to_dict()
            res = {'inserted Engineering': nbInsertEng, 'existing Engineering': nbExistingEng}
        else:
            res = {'inserted Engineering': 0, 'existing Engineering': nbExistingEng}
    data_to_insert[GsmEngineering.file_date.name] = datetime.datetime.now()
    data_to_insert.loc[:, ('FK_Import')] = list(itertools.repeat(importObj.ID, len(data_to_insert.index)))

    importObj.maxDate = csv_data.index.max()
    importObj.minDate = csv_data.index.min()
    importObj.nbRows = nbInsertEng + nbExistingEng
    importObj.nbInserted = nbInsertEng

    # Write into the database
    data_to_insert.to_sql(GsmEngineering.__table__.name, session.get_bind(
    ), if_exists='append', schema=dbConfig['sensor_schema'])
    return res
