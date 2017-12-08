from datetime import datetime
from sqlalchemy import select, and_, insert
from sqlalchemy.exc import IntegrityError
from ..Models import (
    Station,
    StationType,
    Station_FieldWorker,
    Import,
    GPX,
    dbConfig
)
from traceback import print_exc
import pandas as pd
from pyramid import threadlocal
import json
import itertools


model = Station


def uploadFileGPX(request):

    session = request.dbsession
    data = request.json_body
    format_dt = '%d/%m/%Y %H:%M'
    GPXdata = formatData(data, request)

    dataFrame_to_insert, existing_dataFrame = checkExisting(session, GPXdata)
    inserted_raw_dataFrame = insertRawData(
        session, GPXdata, existing_dataFrame)

    dataFrame_to_insert = pd.merge(
        dataFrame_to_insert, inserted_raw_dataFrame, on=['Name', 'StationDate'])
    # dataFrame_to_insert = dataFrame_to_insert.join(inserted_raw_dataFrame, on=['Name', 'StationDate'])
    dataFrame_to_insert['original_id'] = dataFrame_to_insert['pk_id'].apply(
        lambda x: 'Tgpx_' + str(x))

    insertData(session, dataFrame_to_insert, data[0]['FieldWorkers'])

    if existing_dataFrame is not None:
        existingStationName = list(existing_dataFrame['Name'])
    else:
        existingStationName = None
    response = {'existing': len(data) - dataFrame_to_insert.shape[0],
                'new': dataFrame_to_insert.shape[0],
                'existing_name': existingStationName
                }
    return response


def formatData(data, request):

    dateNow = datetime.now()
    GPXdata = []
    format_dt = '%d/%m/%Y %H:%M'

    for row in data:
        newRow = {}
        newRow['LAT'] = row.get('latitude', None)
        newRow['LON'] = row.get('longitude', None)
        newRow['ELE'] = row.get('elevation', None)
        newRow['precision'] = row.get('precision', None)
        newRow['Place'] = row.get('Place', None)
        newRow['timeZone'] = row.get('timeZone', None)
        newRow['Name'] = row.get('name', None)
        newRow['fieldActivityId'] = row.get('fieldActivity', None)
        newRow['precision'] = 10
        newRow['creationDate'] = dateNow
        newRow['creator'] = request.authenticated_userid['iss']
        newRow['FK_StationType'] = 4
        newRow['id'] = row.get('id', None)
        newRow['NbFieldWorker'] = row.get('NbFieldWorker', None)
        newRow['StationDate'] = datetime.strptime(
            row.get('waypointTime', None), format_dt)
        newRow['fieldActivityId'] = row.get('fieldActivity', None)
        newRow['fileName'] = row.get('fileName', None)
        newRow['StationDateTZ'] = datetime.strptime(
            row.get('TZdate', None), format_dt)
        GPXdata.append(newRow)

    return GPXdata


def checkExisting(session, GPXdata):

    # Load date into pandas DataFrame then round LAT,LON into decimal(5)
    DF_to_check = pd.DataFrame(GPXdata)
    DF_to_check['LAT'] = DF_to_check['LAT'].round(5)
    DF_to_check['LON'] = DF_to_check['LON'].round(5)
    DF_to_check['fieldActivityId'] = DF_to_check['fieldActivityId'].astype(int)

    maxDate = DF_to_check['StationDateTZ'].max()
    minDate = DF_to_check['StationDateTZ'].min()
    maxLon = DF_to_check['LON'].max()
    minLon = DF_to_check['LON'].min()
    maxLat = DF_to_check['LAT'].max()
    minLat = DF_to_check['LAT'].min()

    # Retrieve potential duplicated stations from Database

    query = select([model]).where(
        and_(
            model.StationDate.between(minDate, maxDate),
            model.LAT.between(minLat, maxLat)
        )).where(model.LON.between(minLon, maxLon))

    result_to_check = pd.read_sql_query(query, session.get_bind())

    if result_to_check.shape[0] > 0:

        # IF potential duplicated stations, load them into pandas DataFrame
        result_to_check['LAT'] = result_to_check['LAT'].round(5)
        result_to_check['LON'] = result_to_check['LON'].round(5)

        merge_check = pd.merge(DF_to_check, result_to_check,
                               left_on=[
                                   'LAT', 'LON', 'StationDateTZ', 'fieldActivityId'],
                               right_on=[
                                   'LAT', 'LON', 'StationDate', 'fieldActivityId'])
        # Get only non existing data to insert
        DF_to_insert = DF_to_check[~DF_to_check['id'].isin(merge_check['id'])]
        DF_to_insert = DF_to_insert.drop(['id'], 1)

        existing_data = DF_to_check[DF_to_check['id'].isin(merge_check['id'])]
    else:
        DF_to_insert = DF_to_check
        existing_data = None

    return DF_to_insert, existing_data


def insertData(session, dataFrame_to_insert, fieldWorkers):
    data_to_insert = json.loads(dataFrame_to_insert.to_json(
        orient='records', date_format='iso'))
    staListID = []
    nbExc = 0
    bulk_station = []
    if len(data_to_insert) != 0:
        # TODO : improve performance
        Sta = model(FK_StationType=4)
        Sta.init_on_load()

        for sta in data_to_insert:
            curSta = model(FK_StationType=4)
            # curSta.init_on_load()
            curSta.allProp = Sta.allProp
            curDate = datetime.strptime(
                sta['StationDateTZ'], "%Y-%m-%dT%H:%M:%S.%fZ")
            curSta.updateFromJSON(sta)
            curSta.StationDate = curDate
            curSta.FieldWorkers = [{'FieldWorker': id_}
                                   for id_ in fieldWorkers]
            bulk_station.append(curSta)

        session.add_all(bulk_station)
        # session.bulk_save_objects(bulk_station, return_defaults=True)

        # if fieldWorkers:
        #     bulk_fieldworker_station = list(map(lambda b: list(map(lambda a: Station_FieldWorker(
        #         FK_Station=a.ID,
        #         FK_FieldWorker=b),
        #         bulk_station)),
        #         fieldWorkers))
        #     bulk_fieldworker_station = list(
        #         itertools.chain.from_iterable(bulk_fieldworker_station))
        #     session.bulk_save_objects(bulk_fieldworker_station)


def insertRawData(session, GPXdata, existing_dataFrame):
    request = threadlocal.get_current_request()
    user = request.authenticated_userid['iss']
    DF = pd.DataFrame(GPXdata)
    DF['FK_Import'] = None
    DF['imported'] = True
    fileList = DF.fileName.unique()
    dictFileObj = {}

    if existing_dataFrame is not None:
        DF.ix[DF['id'].isin(existing_dataFrame['id']), 'imported'] = False

    for fileName in fileList:
        curDF = DF[DF['fileName'] == fileName]
        maxDate = curDF['StationDate'].max()
        minDate = curDF['StationDate'].min()
        nbRows = curDF.shape[0]
        nbInserted = curDF[curDF['imported'] == True].shape[0]
        curImport = Import(FK_User=user, ImportType='GPX', ImportFileName=fileName,
                           nbRows=nbRows, maxDate=maxDate, minDate=minDate, nbInserted=nbInserted)
        session.add(curImport)
        session.flush()
        dictFileObj[fileName] = curImport.ID

    DF['FK_Import'] = DF['fileName'].replace(dictFileObj)
    rawData_to_insert = DF.drop(['id',
                                 'fileName',
                                 'fieldActivityId',
                                 'creationDate',
                                 'creator',
                                 'FK_StationType',
                                 'NbFieldWorker',
                                 'StationDateTZ'], 1)

    data_to_insert = json.loads(rawData_to_insert.to_json(
        orient='records', date_format='iso'))

    res = session.bulk_insert_mappings(
        GPX, data_to_insert, return_defaults=True)
    inserted_row_data = pd.DataFrame(data_to_insert)

    inserted_row_data = inserted_row_data.loc[:, [
        'StationDate', 'Name', 'pk_id']]
    inserted_row_data['StationDate'] = pd.to_datetime(
        inserted_row_data['StationDate'])
    return inserted_row_data
