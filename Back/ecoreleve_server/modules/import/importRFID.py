import re
import itertools
import pandas as pd
import time
import codecs
import shutil
import os
from datetime import datetime
from traceback import print_exc
from pyramid import threadlocal
from sqlalchemy import select, and_, join
from sqlalchemy.exc import IntegrityError

from ecoreleve_server.core import dbConfig
from ..sensors.sensor_data import Rfid
from ..sensors import Sensor
from .import_model import Import


def convertAntennaID(val):
    return 'DU-' + format(int(val), '03d')


def parse_date(str_date, str_time):

    # default datetime format
    format_dt = '%d/%m/%Y %H:%M:%S'
    dt = str_date + ' ' + re.sub('\s', '', str_time)

    # english format
    if re.search('PM|AM', str_time):
        format_dt = '%m/%d/%Y %I:%M:%S%p'
        format_dtBis = '%d/%m/%Y %I:%M:%S%p'
    try:
        dt = datetime.strptime(dt, format_dt)
    except Exception as e:
        dt = datetime.strptime(dt, format_dtBis)

    return dt


def getDataFrameFromFile(input_file, creator):

    # multiple header for RFID files
    fieldtype1 = {'NB': 'no', 'TYPE': 'type',
                  '"PUCE "': 'chip_code', 'DATE': 'no', 'TIME': 'no'}
    fieldtype2 = {'#': 'no', 'Transponder Type:': 'type',
                  'Transponder Code:': 'chip_code', 'Date:': 'no', 'Time:': 'no',
                  'Event:': 'Event', 'Unit #:': 'Unit', 'Antenna #:': 'Antenna',
                  'Memo:': 'Memo', 'Custom:': 'Custom', '': ''}
    fieldtype3 = {'Transponder Type:': 'type', 'Transponder Code:': 'chip_code',
                  'Date:': 'no', 'Time:': 'no',
                  'Event:': 'Event', 'Unit #:': 'Unit',
                  'Antenna #:': 'Antenna', 'Memo:': 'Memo',
                  'Custom:': 'Custom'}

    fieldDict = {'TYPE': 'type', 'Transponder Type:': 'type',
                 'Transponder Code:': 'chip_code', '"PUCE "': 'chip_code',
                 'Date:': 'Date', 'Time:': 'Time',
                 'DATE': 'Date', 'TIME': 'Time',
                 'Unit #:': 'Unit',
                 'Antenna #:': 'Antenna'
                 }

    # blob = request.POST['file']
    # input_file = blob.file

    try:
        df = pd.read_csv(input_file,
                         sep=';',
                         header=0,
                         )
        if len(df.columns) <= 1:
            df = pd.read_csv(input_file,
                             sep='\t',
                             header=0,
                             )
    except:
        # weird behaviour in files using tab separation, some hack below
        input_file.seek(0)
        temp_filename = 'temp_rfid' + str(int(time.time())) + '.txt'
        with open(temp_filename, 'wb') as output_file:
            shutil.copyfileobj(input_file, output_file)
        doc = codecs.open(temp_filename, 'rU', 'UTF-8')
        df = pd.read_csv(doc,
                         sep='\t',
                         encoding='utf8',
                         header=0,
                         )
        os.remove(temp_filename)
    df = df.rename(columns=fieldDict)
    df['date_'] = df.apply(
        lambda row: parse_date(row.Date, row.Time), axis=1)
    df['identifier'] = df['Unit'].apply(
        lambda row: convertAntennaID(row))

    return df


def getDataFrame(input_file, creator):
    import time
    import shutil
    data = []
    message = ""
    field_label = []
    isHead = False
    now = datetime.now()

    input_file.seek(0)
    temp_fielname = 'temp_rfid' + str(int(time.time())) + '.txt'
    with open(temp_fielname, 'wb') as output_file:
        shutil.copyfileobj(input_file, output_file)

    content = open(temp_fielname).read()

    # NEED a big Refact !!
    if re.compile('\r\n').search(content):
        data = content.split('\r\n')
    elif re.compile('\n').search(content):
        data = content.split('\n')
    elif re.compile('\r').search(content):
        data = content.split('\r')

    fieldtype1 = {'NB': 'no', 'TYPE': 'type',
                  '"PUCE "': 'code', 'DATE': 'no', 'TIME': 'no'}
    fieldtype2 = {'#': 'no', 'Transponder Type:': 'type',
                  'Transponder Code:': 'code', 'Date:': 'no', 'Time:': 'no',
                  'Event:': 'Event', 'Unit #:': 'Unit', 'Antenna #:': 'Antenna',
                  'Memo:': 'Memo', 'Custom:': 'Custom', '': ''}
    fieldtype3 = {'Transponder Type:': 'type', 'Transponder Code:': 'code',
                  'Date:': 'no', 'Time:': 'no',
                  'Event:': 'Event', 'Unit #:': 'Unit',
                  'Antenna #:': 'Antenna', 'Memo:': 'Memo',
                  'Custom:': 'Custom'}

    entete = data[0]

    if re.compile('\t').search(entete):
        separateur = '\t'

    elif re.compile(';').search(entete):
        separateur = ';'
    entete = entete.split(separateur)

    # file with head
    if (sorted(entete) == sorted(fieldtype1.keys())):
        field_label = ["no", "Type", "Code", "date", "time"]
        isHead = True

    elif (sorted(entete) == sorted(fieldtype2.keys())):
        field_label = ["no", "Type", "Code", "date",
                       "time", "no", "no", "no", "no", "no"]
        isHead = True

    elif (sorted(entete) == sorted(fieldtype3.keys())):
        field_label = ["Type", "Code", "date",
                       "time", "no", "no", "no", "no", "no"]
        isHead = True
    else:  # without head
        isHead = False
        if separateur == ';':
            field_label = ["no", "Type", "Code", "date",
                           "time", "no", "no", "no", "no", "no"]
        else:
            if len(entete) > 5:
                field_label = ["Type", "Code", "date",
                               "time", "no", "no", "no", "no", "no"]
            if entete[0] == 'Transponder Type:':
                isHead = True
            elif entete[1] == 'Transponder Type:':
                isHead = True
                field_label = ["no", "Type", "Code", "date", "time"]
            else:
                field_label = ["no", "Type", "Code", "date", "time"]

    j = 0
    code = ""
    date = ""
    dt = ""
    list_RFID = []

    if (isHead):
        j = 1
    # Parsing data
    allDate = []
    while j < len(data):
        i = 0
        if data[j] != "":
            line = data[j].replace('"', '').split(separateur)
            while i < len(field_label):
                if field_label[i] == 'Code':
                    code = line[i]
                if field_label[i] == 'Antenna':
                    identifier = convertAntennaID(line[i])
                if field_label[i] == 'date':
                    date = line[i]
                if field_label[i] == 'time':
                    time = re.sub('\s', '', line[i])
                    format_dt = '%d/%m/%Y %H:%M:%S'
                    if re.search('PM|AM', time):
                        format_dt = '%m/%d/%Y %I:%M:%S%p'
                        format_dtBis = '%d/%m/%Y %I:%M:%S%p'
                    dt = date + ' ' + time
                    try:
                        dt = datetime.strptime(dt, format_dt)
                    except Exception as e:
                        dt = datetime.strptime(dt, format_dtBis)
                    allDate.append(dt)
                i = i + 1

            row = {'id_': j,
                   #    'FK_Sensor': idModule,
                   'identifier': identifier,
                   'date_': dt,
                   'chip_code': code,
                   'creator': creator,
                   'creation_date': now,
                   'validated': 0,
                   'checked': 0}
            list_RFID.append(row)
        j = j + 1
    df = pd.DataFrame.from_records(
        list_RFID,
        columns=['id_', 'identifier', 'date_',
                 'chip_code', 'creator', 'creation_date',
                 'validated', 'checked'])
    return df


def findEquipmentSession(session, identifier, maxDate, minDate):
    table = Base.metadata.tables['SensorEquipment']
    joinTable = join(table, Sensor, table.c['FK_Sensor'] == Sensor.ID)

    query = select([table.c['StartDate'],
                    table.c['EndDate'],
                    Sensor.ID]
                   ).select_from(joinTable
                                 ).where(Sensor.UnicIdentifier == identifier
                                         ).where(table.c['StartDate'] <= minDate
                                                 ).where(table.c['EndDate'] >= maxDate
                                                         )
    equipSession = session.execute(query).fetchone()
    if equipSession:
        equipSession = dict(equipSession)
    return equipSession


def uploadFileRFID(request):
    session = request.dbsession
    data = []
    message = ""
    field_label = []
    isHead = False
    now = datetime.now()
    creator = int(request.authenticated_userid['iss'])
    # content = request.POST['data']
    # blob = request.POST['file']
    blob = request.POST['file']
    input_file = blob.file
    filename = blob.filename
    # filename = request.POST['fileName']

    idModule = int(request.POST['FK_Sensor'])
    startEquip = request.POST['StartDate']
    endEquip = request.POST['EndDate']

    try:
        data_to_check = getDataFrameFromFile(input_file, creator)
        sensorIdentifier = data_to_check.iloc[0].identifier

        sensor_from_request = session.query(Sensor).get(idModule)
   
        allDate = list(data_to_check['date_'])
        minDateEquip = datetime.strptime(startEquip, '%Y-%m-%d %H:%M:%S')
        try:
            maxDateEquip = datetime.strptime(endEquip, '%Y-%m-%d %H:%M:%S')
        except:
            maxDateEquip = None

        # print('date from file : ', min(allDate), max(allDate))
        # print('date Equipment : ', minDateEquip, maxDateEquip)

        # print('sensor Identifier (file|selected): ',sensorIdentifier, sensor_from_request.UnicIdentifier)
        # check if Date corresponds with pose remove module
        if (min(allDate) >= minDateEquip and
                (maxDateEquip is None or max(allDate) <= maxDateEquip) and
                sensorIdentifier == sensor_from_request.UnicIdentifier
            ):
            data_to_check.loc[:, ('FK_Sensor')] = list(
                itertools.repeat(idModule, len(data_to_check.index)))
            data_to_check.loc[:, ('id_')] = data_to_check.index

            data_to_insert = checkDuplicatedRFID(
                data_to_check, min(allDate), max(allDate), idModule)
            # data_to_insert = data_to_insert.drop(['id_'], 1)
            data_to_insert = data_to_insert.drop_duplicates()
            data_to_insert['validated'] = 0
            data_to_insert['checked'] = 0


            importObj = Import(ImportFileName=filename,
                               FK_User=creator, ImportDate=now)
            importObj.ImportType = 'RFID'
            importObj.maxDate = max(allDate)
            importObj.minDate = min(allDate)
            importObj.nbRows = data_to_check.shape[0]
            importObj.nbInserted = data_to_insert.shape[0]

            session.add(importObj)
            session.flush()

            data_to_insert.loc[:, ('FK_Import')] = list(
                itertools.repeat(importObj.ID, len(data_to_insert.index)))

            # if data_to_insert.shape[0] == 0:
            #     raise(IntegrityError)

            data_to_insert.to_sql(
                Rfid.__table__.name,
                session.get_bind(),
                if_exists='append',
                schema=dbConfig['sensor_schema'],
                index=False)

            message = 'inserted rows : ' + str(data_to_insert.shape[0])
            return message
        else:
            session.rollback()
            request.response.status_code = 409

            if sensorIdentifier != sensor_from_request.UnicIdentifier:
                message = 'Identifier in file ({identifierFile}) does not correspond with the selected module ({identifierSelect})'.format(identifierFile=sensorIdentifier, identifierSelect=sensor_from_request.UnicIdentifier)
            else: 
                message = 'File dates (first date : ' + str(allDate[0]) + ', last date : ' + str(
                allDate[-1]) + ') do not correspond with the deploy/remove dates of the selected module'
            return message

    except IntegrityError as e:
        print_exc()
        request.response.status_code = 409
        message = 'Data already exist.'
    except Exception as e:
        print_exc()
        request.response.status_code = 500
        message = 'Error'
    return message


def checkDuplicatedRFID(data_to_check, startEquip, endEquip, fk_sensor):
    session1 = threadlocal.get_current_registry().dbmaker()

    query = select([Rfid]
                   ).where(
        and_(Rfid.date_ >= startEquip, and_(
            Rfid.date_ <= endEquip, Rfid.FK_Sensor == fk_sensor))
    )
    # result = session1.execute(query).fetchall()

    existingData = pd.read_sql(query, session1.get_bind())
    existingData.rename(columns={'ID': '$ID', 'FK_Sensor': '$FK_Sensor',
                                 'date_': '$date_', 'chip_code': '$chip_code',
                                 'creator': '$creator', 'creation_date': '$creation_date',
                                 'validated': '$validated', 'checked': '$checked',
                                 'frequency': '$frequency'},
                        inplace=True)

    existingData['$date_'] = pd.to_datetime(existingData['$date_'])
    data_to_check['date_'] = pd.to_datetime(data_to_check['date_'])
    merge = data_to_check.merge(existingData, left_on=[
                                'FK_Sensor'], right_on=['$FK_Sensor'])

    DFToInsert = data_to_check[~data_to_check['id_'].isin(merge['id_'])]

    DFToInsert = DFToInsert[['FK_Sensor','date_', 'chip_code']]
    return DFToInsert
