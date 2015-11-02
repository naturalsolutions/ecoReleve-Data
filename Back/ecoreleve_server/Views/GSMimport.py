from pyramid.response import Response
from pyramid.view import view_config
from sqlalchemy import desc, select, func,text, insert, join, Integer, cast, and_, Float, or_,bindparam, update, outerjoin
from ..Models import Gsm, GsmEngineering, DBSession, Base , dbConfig
from ..utils.distance import haversine
from ..utils.data_toXML import data_to_XML
from traceback import print_exc
import pandas as pd
import numpy as np
import re
import datetime, time
import transaction
import json
from sqlalchemy.orm import query
import itertools



# ------------------------------------------------------------------------------------------------------------------------- #
def uploadFilesGSM(request):
    #Import unchecked GSM data.
    response = 'Success'
    # detect if is a row file retrieve directly from mail 
    ptt_pattern = re.compile('[0]*(?P<platform>[0-9]+)g')
    eng_pattern = re.compile('[0]*(?P<platform>[0-9]+)e')

    # detect if is concatenated file retrieve from exctract GSM python software
    ALL_ptt_pattern = re.compile('GPS')
    ALL_eng_pattern = re.compile('Engineering')

    dict_pattern = {
        'all_gps': ALL_ptt_pattern,
        'all_eng' : ALL_eng_pattern,
        'ptt_gps' : ptt_pattern,
        'ptt_eng' :eng_pattern
        }

    dict_func_data = {
        'all_gps': get_ALL_gps_toInsert,
        'all_eng' : get_ALL_eng_toInsert,
        'ptt_gps' : get_gps_toInsert,
        'ptt_eng' : get_eng_toInsert
        }
    res = None
    try:
        file_obj = request.POST['file']
        filename = request.POST['file'].filename
        for k in dict_pattern :
            if (dict_pattern[k].search(filename)) :
                res = dict_func_data[k](file_obj)
    except:
        print_exc()
        response = 'An error occured.'
        request.response.status_code = 500
    return (response,res)       

# ------------------------------------------------------------------------------------------------------------------------- #
def get_ALL_gps_toInsert(file_obj) :
        file = file_obj.file
        # Load raw csv data
        csv_data = pd.read_csv(file, sep='\t',
            index_col=0,
            parse_dates=True,
            na_values=['No Fix', 'Batt Drain', 'Low Voltage']
            )
        # Remove the lines containing NaN and columns 
        csv_data.dropna(inplace=True)
        csv_data.drop(['ShowInKML','file_date'], axis=1, inplace=True)
        # get list of ptt
        platform_df = csv_data[['GSM_ID']]
        platform_df = platform_df.groupby('GSM_ID')['GSM_ID'].agg(['count'])
        platform_list = platform_df.index.get_values().tolist()
        print('Parse File')
        #go to insert data in the database
        return insert_GPS(platform_list, csv_data)

# ------------------------------------------------------------------------------------------------------------------------- #
def get_gps_toInsert(file_obj) :
    file = file_obj.file
    filename=file_obj.filename
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
    #go to insert data in the database
    return insert_GPS(platform, csv_data)

# ------------------------------------------------------------------------------------------------------------------------- #
def insert_GPS(platform, csv_data) :
    if (type(platform) is list) :
        print ('is list GSM')
        query = select([Gsm.date]).where(Gsm.platform_.in_(platform))
    elif (type(platform) is int) :
        query = select([Gsm.date]).where(Gsm.platform_ == platform) 
    else : return 'error type : "platform" '
    ## Read dates that are already in the database
    df = pd.DataFrame.from_records(DBSession.execute(query).fetchall(), index=Gsm.date.name, columns=[Gsm.date.name])
    ### Filter data with no elevation by converting the column to numeric type
    csv_data[Gsm.ele.name] = csv_data[Gsm.ele.name].convert_objects(convert_numeric=True)

    ### Get the data to insert
    data_to_insert = csv_data[~csv_data.index.isin(df.index)]
    #### Add the platform to the DataFrame
    if (type(platform) is int) :
        data_to_insert[Gsm.platform_.name] = platform
        res = {'new GPS data inserted' : data_to_insert.shape[0]}
    else : 
        if (data_to_insert.shape[0] != 0) :
            ptt_name = 'GSM_ID'
            platform_count = data_to_insert.groupby(ptt_name)[ptt_name].agg(['count'])
            res = platform_count.to_dict()
        else : 
            res = {'new GPS data inserted' : 0}
    ### Add the platform to the DataFrame
    data_to_insert.rename(columns={'GSM_ID':Gsm.platform_.name}, inplace = True)
    # data_to_insert['DateTime'] = data_to_insert.index
    ### Write into the database
    #data_to_insert = json.loads(data_to_insert.to_json(orient='records',date_format='iso'))

    ##### Build block insert statement and returning ID of new created stations #####
    if len(data_to_insert) != 0 :
        # stmt = Gsm.__table__.insert().values(data_to_insert)
        # result = DBSession.execute(stmt)
        data_to_insert.loc[:,('checked')]=list(itertools.repeat(0,len(data_to_insert.index)))
        data_to_insert.loc[:,('imported')]=list(itertools.repeat(0,len(data_to_insert.index)))
        data_to_insert.loc[:,('validated')]=list(itertools.repeat(0,len(data_to_insert.index)))
        data_to_insert.to_sql(Gsm.__table__.name, DBSession.get_bind(), if_exists='append', schema = dbConfig['sensor_schema'] )
        # result = list(map(lambda y: y[0], res))
    # else : 
    #     result = []
    return res

# ------------------------------------------------------------------------------------------------------------------------- #
def get_eng_toInsert(file_obj) :
    file = file_obj.file
    filename=file_obj.filename
    eng_pattern = re.compile('[0]*(?P<platform>[0-9]+)e')
    platform = int(eng_pattern.search(filename).group('platform'))
    # Load raw csv data
    csv_data = pd.read_csv(file, sep='\t',
        index_col=0,
        parse_dates=True,
    )
    # Remove the lines containing NaN
    csv_data.dropna(inplace=True)
    return insert_ENG(platform, csv_data)

# ------------------------------------------------------------------------------------------------------------------------- #
def get_ALL_eng_toInsert(file_obj) : 
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
    #go to insert data in the database
    return insert_ENG(platform_list, csv_data)

# ------------------------------------------------------------------------------------------------------------------------- #
def insert_ENG(platform, csv_data):
    if (type(platform) is list) :
        query = select([GsmEngineering.date]).where(GsmEngineering.platform_.in_(platform))
    elif (type(platform) is int) :
        query = select([GsmEngineering.date]).where(GsmEngineering.platform_== platform)
    else : return 'error type : "platform" '

    '''# Read dates that are already in the database'''
    df = pd.DataFrame.from_records(DBSession.execute(query).fetchall(), index=GsmEngineering.date.name, columns=[GsmEngineering.date.name])
        
    data_to_insert = csv_data[~csv_data.index.isin(df.index)]
    # Rename columns and Date index
    # data_to_insert.rename(columns = {'Temperature_C':'TArE_TEMP','BatteryVoltage_V':'TArE_BATT','ActivityCount':'TArE_TX_CNT'}, inplace=True)       
    # data_to_insert.index.rename('TArE_TXDATE', inplace = True)
    # Add the platform to the DataFrame
    if (type(platform) is int) :
        data_to_insert[GsmEngineering.platform_.name] = platform
        res = {'new Engineering data inserted' : data_to_insert.shape[0]}
    else :
        data_to_insert.rename(columns = {'GSM_ID':GsmEngineering.platform_.name}, inplace = True)
        if (data_to_insert.shape[0] != 0) :
            platform_count = data_to_insert.groupby(GsmEngineering.platform_.name)[GsmEngineering.platform_.name].agg(['count'])
            res = platform_count.to_dict()
            res = {'new Engineering data inserted': res['count']}
        else : 
            res = {'new Engineering data inserted' : 0}
    data_to_insert[GsmEngineering.file_date.name] = datetime.datetime.now()
    # Write into the database
    data_to_insert.to_sql(GsmEngineering.__table__.name, DBSession.get_bind(), if_exists='append',schema = dbConfig['sensor_schema'])
    return res
