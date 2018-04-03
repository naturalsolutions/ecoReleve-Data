import pandas as pd
import numpy as np
import win32con
import win32gui
import os
import re
from win32 import win32api
import shutil
from time import sleep
import subprocess
import psutil
from datetime import datetime
import itertools
from traceback import print_exc
from sqlalchemy import select, and_

import ecoreleve_server
from ecoreleve_server.core import dbConfig
from ..sensors.sensor_data import ArgosGps, ArgosEngineering
from .import_model import Import


def uploadFileArgos(request):
    session = request.dbsession
    user = request.authenticated_userid['iss']
    workDir = os.path.dirname(os.path.abspath(ecoreleve_server.__package__))
    tmp_path = os.path.join(workDir, "ecoReleve_import")
    import_path = os.path.join(tmp_path, "uploaded_file")
    if not (os.path.exists(import_path)):
        os.makedirs(import_path)

    filename = request.POST['file'].filename.replace(' ', '_')
    input_file = request.POST['file'].file
    full_filename = os.path.join(import_path, filename)

    if os.path.exists(full_filename):
        os.remove(full_filename)

    temp_file_path = full_filename + '~'

    if os.path.exists(temp_file_path):
        os.remove(temp_file_path)

    # Save File
    input_file.seek(0)
    with open(temp_file_path, 'wb') as output_file:
        shutil.copyfileobj(input_file, output_file)

    os.rename(temp_file_path, full_filename)
    importObj = Import(ImportFileName=request.POST['file'].filename, FK_User=user)
    importObj.ImportType = 'Argos'

    session.add(importObj)
    session.flush()
    message = {}
    if 'DIAG' in filename.upper():
        message, nbRows, nbInserted, maxDate, minDate = parseDIAGFileAndInsert(full_filename, session, importObj.ID)
    elif 'DS' in filename.upper():
        message, nbRows, nbInserted, maxDate, minDate = parseDSFileAndInsert(full_filename, session, importObj.ID)

    if message:
        importObj.nbRows = nbRows
        importObj.nbInserted = nbInserted
        importObj.maxDate = maxDate
        importObj.minDate = minDate
    else:
        message = 'Argos File type name did not recognized'
    return message


def parseDSFileAndInsert(full_filename, session, importID):
    workDir = os.path.dirname(os.path.abspath(ecoreleve_server.__package__))

    con_file = os.path.join(workDir, 'init.txt')
    MTI_path = os.path.join(workDir, 'MTIwinGPS.exe')
    out_path = os.path.join(workDir,
                            "ecoReleve_import",
                            "Argos",
                            os.path.splitext(
                                os.path.basename(full_filename))[0])

    EngData = None
    GPSData = None
    EngDataBis = None
    nb_gps_data = None
    nb_existingGPS = None
    nb_eng = 0
    nb_existingEng = 0

    if not os.path.exists(out_path):
        os.makedirs(out_path)
    try:
        os.remove(con_file)
    except:
        pass

    # Config init.txt for MTI-PArser
    cc = {'full_filename': full_filename}
    cc['out'] = out_path
    cc['ini'] = con_file

    with open(con_file, 'w') as f:
        print('-eng\n-title\n-out\n' + out_path + '\n' + full_filename, file=f)

    # execute MTI-Parser
    args = [MTI_path]
    proc = subprocess.Popen([args[0]])
    hwnd = 0
    while hwnd == 0:
        sleep(0.3)
        hwnd = win32gui.FindWindow(0, "MTI Argos-GPS Parser")

    btnHnd = win32gui.FindWindowEx(hwnd, 0, "Button", "Run")
    win32api.SendMessage(btnHnd, win32con.BM_CLICK, 0, 0)
    filenames = [os.path.join(out_path, fn)
                 for fn in next(os.walk(out_path))[2]]
    win32api.SendMessage(hwnd, win32con.WM_CLOSE, 0, 0)

    # kill process Mti-Parser
    pid = proc.pid
    cc['pid'] = pid
    parent = psutil.Process(pid)
    try:
        # or parent.children() for recursive=False
        for child in parent.children(recursive=True):
            child.kill()
        parent.kill()
    except:
        pass

    # process output files
    for filename in filenames:
        fullname = os.path.splitext(os.path.basename(filename))[0]
        ptt = int(fullname[0:len(fullname) - 1])

        if filename.endswith("g.txt"):
            tempG = pd.read_csv(filename, sep='\t', header=0, parse_dates=[
                                0], infer_datetime_format=True)
            tempG['ptt'] = ptt
            try:
                GPSData = GPSData.append(tempG)
            except:
                GPSData = tempG

        if filename.endswith("e.txt"):
            usecols = ['txDate', 'pttDate', 'satId', 'activity', 'txCount',
                       'temp', 'batt', 'fixTime', 'satCount', 'resetHours',
                       'fixDays', 'season', 'shunt', 'mortalityGT', 'seasonalGT'
                       ]
            usecolsBis = ['txDate', 'resetHours', 'cycle', 'season']
            tempEng = pd.read_csv(filename, sep='\t', parse_dates=[
                                  0], header=None, skiprows=[0])

            trueCols = usecols
            if len(tempEng.columns) == 17:
                trueCols.append('latestLat')
                trueCols.append('latestLon')

            if len(tempEng.columns) < 5:
                trueCols = usecolsBis

            tempEng.columns = trueCols
            tempEng.loc[:, ('ptt')] = ptt
            try:
                EngData = EngData.append(tempEng)
            except:
                EngData = tempEng

        if filename.endswith("d.txt"):
            usecols = ['txDate', 'temp', 'batt', 'txCount', 'activity']
            tempEng = pd.read_csv(filename, sep='\t', parse_dates=[
                                  0], header=None, skiprows=[0])
            tempEng.columns = usecols
            tempEng['ptt'] = ptt
            tempEng['pttDate'] = tempEng['txDate']
            try:
                EngDataBis = EngDataBis.append(tempEng)
            except:
                EngDataBis = tempEng

    if EngData is not None:
        EngToInsert = checkExistingEng(EngData, session)
        nb_existingEng += EngData.shape[0]
        if EngToInsert.shape[0] != 0:
            # Insert non existing data into DB
            EngToInsert.loc[:, ('FK_Import')] = list(itertools.repeat(importID, len(EngToInsert.index)))
            nb_eng += EngToInsert.shape[0]
            EngToInsert.to_sql(ArgosEngineering.__table__.name,
                               session.get_bind(),
                               if_exists='append',
                               schema=dbConfig['sensor_schema'],
                               index=False)

    if EngDataBis is not None:
        EngBisToInsert = checkExistingEng(EngDataBis, session)
        nb_existingEng += EngDataBis.shape[0]
        if EngBisToInsert.shape[0] != 0:
            EngToInsert.loc[:, ('FK_Import')] = list(itertools.repeat(importID, len(EngToInsert.index)))
            nb_eng += EngBisToInsert.shape[0]
            # Insert non existing data into DB
            EngBisToInsert.to_sql(ArgosEngineering.__table__.name,
                                  session.get_bind(),
                                  if_exists='append',
                                  schema=dbConfig['sensor_schema'],
                                  index=False)

    if GPSData is not None:
        GPSData = GPSData.replace(["neg alt"], [-999])
        DFToInsert = checkExistingGPS(GPSData, session)
        DFToInsert.loc[:, ('FK_Import')] = list(itertools.repeat(importID, len(DFToInsert.index)))
        nb_gps_data = DFToInsert.shape[0]
        nb_existingGPS = GPSData.shape[0] - DFToInsert.shape[0]
        if DFToInsert.shape[0] != 0:
            # Insert non existing data into DB
            DFToInsert.to_sql(ArgosGps.__table__.name,
                              session.get_bind(),
                              if_exists='append',
                              schema=dbConfig['sensor_schema'],
                              index=False)

    os.remove(full_filename)
    shutil.rmtree(out_path)
    message = {'inserted gps': nb_gps_data,
            'existing gps': nb_existingGPS,
            'inserted Engineering': nb_eng,
            'existing Engineering': nb_existingEng - nb_eng,
            'inserted argos': 0,
            'existing argos': 0}
    
    nbRows = (nb_existingEng or 0)+ (nb_existingGPS or 0) + (nb_gps_data or 0)
    maxDateGPS = GPSData['datetime'].max()
    minDateGPS = GPSData['datetime'].min()
    nbInserted = nb_gps_data + nb_eng
    return message, nbRows, nbInserted, maxDateGPS, minDateGPS

def checkExistingEng(EngData, session):
    EngData['id'] = range(EngData.shape[0])
    EngData = EngData.dropna()
    try:
        if 'pttDate' in EngData.columns:
            EngData['pttDate'] = pd.to_datetime(EngData['pttDate'])

        EngData['txDate'] = EngData.apply(
            lambda row: np.datetime64(row['txDate']).astype(datetime), axis=1)
        maxDate = EngData['txDate'].max()
        minDate = EngData['txDate'].min()

        # Retrieve data from Database for test existing
        queryEng = select([ArgosEngineering.fk_ptt, ArgosEngineering.txDate])
        queryEng = queryEng.where(
            and_(ArgosEngineering.txDate >= minDate,
                 ArgosEngineering.txDate <= maxDate))
        data = session.execute(queryEng).fetchall()

        # Load DB data into a pandas DataFrame
        EngRecords = pd.DataFrame.from_records(
            data,
            columns=[ArgosEngineering.fk_ptt.name,
                     ArgosEngineering.txDate.name])

        # apply a merge/join beetween dataframes with data from Files and data
        # from DB
        merge = pd.merge(EngData, EngRecords, left_on=[
                         'txDate', 'ptt'], right_on=['txDate', 'FK_ptt'])

        # Extract non existing data
        DFToInsert = EngData[~EngData['id'].isin(merge['id'])]

        # rename column
        DFToInsert.loc[:, ('creationDate')] = list(
            itertools.repeat(datetime.now(), len(DFToInsert.index)))
        DFToInsert['FK_ptt'] = DFToInsert['ptt']
        DFToInsert = DFToInsert.drop(['id', 'ptt'], 1)
    except:
        print_exc()
        DFToInsert = pd.DataFrame()
    return DFToInsert


def checkExistingGPS(GPSData, session):
    GPSData['datetime'] = GPSData.apply(lambda row: np.datetime64(
        row['Date/Time']).astype(datetime), axis=1)
    GPSData['id'] = range(GPSData.shape[0])
    maxDateGPS = GPSData['datetime'].max()
    minDateGPS = GPSData['datetime'].min()

    # round lat/lon decimal 3 for data from Files
    GPSData['lat'] = GPSData['Latitude(N)'].round(3)
    GPSData['lon'] = GPSData['Longitude(E)'].round(3)

    # Retrieve exisintg data from DB
    queryGPS = select([ArgosGps.pk_id,
                      ArgosGps.date,
                      ArgosGps.lat,
                      ArgosGps.lon,
                      ArgosGps.ptt]
                      ).where(ArgosGps.type_ == 'GPS')
    queryGPS = queryGPS.where(
        and_(ArgosGps.date >= minDateGPS, ArgosGps.date <= maxDateGPS))
    data = session.execute(queryGPS).fetchall()

    # Load data from DB into dataframe
    GPSrecords = pd.DataFrame.from_records(
        data,
        columns=[ArgosGps.pk_id.name,
                 ArgosGps.date.name,
                 ArgosGps.lat.name,
                 ArgosGps.lon.name,
                 ArgosGps.ptt.name],
        coerce_float=True)

    # round_ lat/lon decimal 3 for data from DB
    GPSrecords['lat'] = GPSrecords['lat'].round(3)
    GPSrecords['lon'] = GPSrecords['lon'].round(3)

    # apply a merge/join beetween dataframes with data from Files and data
    # from DB
    merge = pd.merge(GPSData,
                     GPSrecords,
                     left_on=['datetime', 'lat', 'lon', 'ptt'],
                     right_on=['date', 'lat', 'lon', 'FK_ptt'])
    DFToInsert = GPSData[~GPSData['id'].isin(merge['id'])]

    DFToInsert = DFToInsert.drop(['id', 'datetime', 'lat', 'lon'], 1)
    DFToInsert.columns = ['date', 'lat', 'lon',
                          'speed', 'course', 'ele', 'FK_ptt']

    DFToInsert = DFToInsert.replace('2D fix', np.nan)
    DFToInsert = DFToInsert.replace('low alt', np.nan)
    DFToInsert.loc[:, ('type')] = list(
        itertools.repeat('GPS', len(DFToInsert.index)))
    DFToInsert.loc[:, ('checked')] = list(
        itertools.repeat(0, len(DFToInsert.index)))
    DFToInsert.loc[:, ('imported')] = list(
        itertools.repeat(0, len(DFToInsert.index)))
    DFToInsert.loc[:, ('creationDate')] = list(
        itertools.repeat(datetime.now(), len(DFToInsert.index)))

    return DFToInsert


def parseDIAGFileAndInsert(full_filename, session, importID):

    # PArse DIAG File with Regex
    with open(full_filename, 'r') as f:
        content = f.read()
        content = re.sub('\s+Prog+\s\d{5}', "", content)
        content2 = re.sub('[\n\r]\s{10,14}[0-9A-F\s]+[\n\r]', "\n", content)
        content2 = re.sub('[\n\r]\s{10,14}[0-9A-F\s]+$', "\n", content2)
        content2 = re.sub('^[\n\r\s]+', "", content2)
        content2 = re.sub('[\n\r\s]+$', "", content2)
        splitBlock = 'm[\n\r]'
        blockPosition = re.split(splitBlock, content2)

    colsInBlock = ['FK_ptt', 'date', 'lc', 'iq', 'lat1',
                   'lon1', 'lat2', 'lon2', 'nbMsg',
                   'nbMsg120', 'bestLevel', 'passDuration',
                   'nopc', 'freq', 'ele']
    ListOfdictParams = []

    for block in blockPosition:
        block = re.sub('[\n\r]+', "", block)
        # block = re.sub('[a-zA-VX-Z]\s+Lat'," Lat",block)
        # block = re.sub('[a-zA-DF-Z]\s+Lon'," Lon",block)
        block = re.sub('[a-zA-Z]\s+Nb', " Nb", block)
        block = re.sub('[a-zA-Z]\s+NOPC', " NOPC", block)
        block = re.sub('IQ', "#IQ", block)
        # block = re.sub('[a-zA-Z]\s[a-zA-Z]',"O",block)
        # print(block)
        split = '\#?[a-zA-Z0-9\-\>]+\s:\s'
        splitParameters = re.split(split, block)
        curDict = {}

        for i in range(len(splitParameters)):
            if re.search('[?]+([a-zA-Z]+)?', splitParameters[i]):
                splitParameters[i] = re.sub(
                    '[?]+([a-zA-Z]{1,2})?', "NaN", splitParameters[i])
            if re.search('[0-9]', splitParameters[i]):
                splitParameters[i] = re.sub(
                    '[a-zA-DF-MO-RT-VX-Z]', " ", splitParameters[i])
            if colsInBlock[i] == 'date':
                curDict[colsInBlock[i]] = datetime.strptime(
                    splitParameters[i], '%d.%m.%y %H:%M:%S ')
            else:
                try:
                    splitParameters[i] = re.sub(
                        '[\s]', " ", splitParameters[i])
                    a = 1
                    if colsInBlock[i] in ['lon1', 'lon2', 'lat1', 'lat2']:
                        if 'W' in splitParameters[i] or 'S' in splitParameters[i]:
                            a = -1
                        splitParameters[i] = re.sub(
                            '[a-zA-Z]', " ", splitParameters[i])
                    curDict[colsInBlock[i]] = a * float(splitParameters[i])
                except:
                    try:
                        splitParameters[i] = re.sub(
                            '[a-zA-Z]', " ", splitParameters[i])
                        curDict[colsInBlock[i]] = int(splitParameters[i])
                    except:
                        if re.search('\s{1,10}', splitParameters[i]):
                            splitParameters[i] = None
                        curDict[colsInBlock[i]] = splitParameters[i]
        ListOfdictParams.append(curDict)

    # Load parsed value into DataFrame
    df = pd.DataFrame.from_dict(ListOfdictParams)
    df = df.dropna(subset=['date'])
    DFToInsert = checkExistingArgos(df, session)
    DFToInsert.loc[:, ('type')] = list(
        itertools.repeat('Argos', len(DFToInsert.index)))
    DFToInsert.loc[:, ('checked')] = list(
        itertools.repeat(0, len(DFToInsert.index)))
    DFToInsert.loc[:, ('imported')] = list(
        itertools.repeat(0, len(DFToInsert.index)))
    DFToInsert.loc[:, ('creationDate')] = list(
        itertools.repeat(datetime.now(), len(DFToInsert.index)))
    DFToInsert = DFToInsert.drop(['id', 'lat1', 'lat2', 'lon1', 'lon2'], 1)
    DFToInsert.loc[:, ('FK_Import')] = list(itertools.repeat(importID, len(DFToInsert.index)))

    if DFToInsert.shape[0] != 0:
        DFToInsert.to_sql(ArgosGps.__table__.name, session.get_bind(
        ), if_exists='append', schema=dbConfig['sensor_schema'], index=False)
    os.remove(full_filename)

    message = {'inserted gps': 0,
            'existing gps': 0,
            'inserted Engineering': 0,
            'existing Engineering': 0,
            'inserted argos': DFToInsert.shape[0],
            'existing argos': df.shape[0] - DFToInsert.shape[0]}
    
    nbRows = df.shape[0]
    nbInserted = DFToInsert.shape[0]
    maxDate = df['date'].max()
    minDate = df['date'].min()
    return message, nbRows, nbInserted, maxDate, minDate


def checkExistingArgos(dfToCheck, session):
    dfToCheck['id'] = range(dfToCheck.shape[0])
    dfToCheck.loc[:, ('lat')] = dfToCheck['lat1'].astype(float)
    dfToCheck.loc[:, ('lon')] = dfToCheck['lon1'].astype(float)
    maxDate = dfToCheck['date'].max()
    minDate = dfToCheck['date'].min()

    dfToCheck['lat2'] = dfToCheck['lat'].round(3)
    dfToCheck['lon2'] = dfToCheck['lon'].round(3)
    # Retrieve data from DB
    queryArgos = select([ArgosGps.pk_id,
                         ArgosGps.date,
                         ArgosGps.lat,
                         ArgosGps.lon,
                         ArgosGps.ptt]
                        ).where(ArgosGps.type_ == 'Argos')
    queryArgos = queryArgos.where(
        and_(ArgosGps.date >= minDate, ArgosGps.date <= maxDate))
    data = session.execute(queryArgos).fetchall()

    # load data from Db into DF
    ArgosRecords = pd.DataFrame.from_records(
        data,
        columns=[ArgosGps.pk_id.name,
                 ArgosGps.date.name,
                 ArgosGps.lat.name,
                 ArgosGps.lon.name,
                 ArgosGps.ptt.name],
        coerce_float=True)

    ArgosRecords.loc[:, ('lat')] = ArgosRecords['lat'].round(3)
    ArgosRecords.loc[:, ('lon')] = ArgosRecords['lon'].round(3)

    merge = pd.merge(dfToCheck,
                     ArgosRecords,
                     left_on=['date', 'lat2', 'lon2', 'FK_ptt'],
                     right_on=['date', 'lat', 'lon', 'FK_ptt'])
    DFToInsert = dfToCheck[~dfToCheck['id'].isin(merge['id'])]

    return DFToInsert
