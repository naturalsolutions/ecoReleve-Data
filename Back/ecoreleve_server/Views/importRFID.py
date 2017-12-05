import re
from datetime import datetime
from sqlalchemy import select, and_
from sqlalchemy.exc import IntegrityError
from ..Models import (
    Rfid,
    dbConfig,
    Import
)
from traceback import print_exc
import pandas as pd
from pyramid import threadlocal
import itertools


def uploadFileRFID(request):
    session = request.dbsession
    data = []
    message = ""
    field_label = []
    isHead = False
    try:
        creator = int(request.authenticated_userid['iss'])
        content = request.POST['data']
        idModule = int(request.POST['FK_Sensor'])
        startEquip = request.POST['StartDate']
        endEquip = request.POST['EndDate']
        filename = request.POST['fileName']
        now = datetime.now()

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
                       'FK_Sensor': idModule,
                       'date_': dt,
                       'chip_code': code,
                       'creator': creator,
                       'creation_date': now,
                       'validated': 0,
                       'checked': 0}
                list_RFID.append(row)
            j = j + 1
        data_to_check = pd.DataFrame.from_records(
            list_RFID,
            columns=['id_', 'FK_Sensor', 'date_',
                     'chip_code', 'creator', 'creation_date',
                     'validated', 'checked'])
        minDateEquip = datetime.strptime(startEquip, '%Y-%m-%d %H:%M:%S')
        try:
            maxDateEquip = datetime.strptime(endEquip, '%Y-%m-%d %H:%M:%S')
        except:
            maxDateEquip = None

        # check if Date corresponds with pose remove module
        if (min(allDate) >= minDateEquip and
                (maxDateEquip is None or max(allDate) <= maxDateEquip)):

            data_to_insert = checkDuplicatedRFID(
                data_to_check, min(allDate), max(allDate), idModule)
            data_to_insert = data_to_insert.drop(['id_'], 1)
            data_to_insert = data_to_insert.drop_duplicates()

            importObj = Import(ImportFileName=filename, FK_User=creator, ImportDate=now)
            importObj.ImportType = 'RFID'
            importObj.maxDate = max(allDate)
            importObj.minDate = min(allDate)
            importObj.nbRows = data_to_check.shape[0]
            importObj.nbInserted = data_to_insert.shape[0]

            session.add(importObj)
            session.flush()

            data_to_insert.loc[:, ('FK_Import')] = list(itertools.repeat(importObj.ID, len(data_to_insert.index)))
            if data_to_insert.shape[0] == 0:
                raise(IntegrityError)

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
            request.response.status_code = 510
            message = 'File dates (first date : ' + str(allDate[0])+ ', last date : ' + str(allDate[-1])+ ') do not correspond with the deploy/remove dates of the selected module'
            return message

    except IntegrityError as e:
        print_exc()
        request.response.status_code = 520
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
    result = session1.execute(query).fetchall()

    existingData = pd.DataFrame.from_records(
        result,
        columns=['ID', 'FK_Sensor', 'date_',
                 'chip_code', 'creator', 'creation_date',
                 'validated', 'checked', 'frequency'])
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

    return DFToInsert
