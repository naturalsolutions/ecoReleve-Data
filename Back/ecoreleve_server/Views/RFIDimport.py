import re, operator, transaction
from datetime import datetime
from pyramid.view import view_config
from sqlalchemy import select, insert, text, desc, bindparam, or_, outerjoin, func, and_
from sqlalchemy.exc import IntegrityError
import json
from ..Models import (
    DBSession,
    Rfid,
    Sensor,
    dbConfig
)
from collections import OrderedDict
from traceback import print_exc
from ..utils.datetime import parse
import pandas as pd
import numpy as np 
from pyramid import threadlocal


# ------------------------------------------------------------------------------------------------------------------------- #
def uploadFileRFID(request):
    session = request.dbsession
    data = []
    message = ""
    field_label = []
    isHead = False
    now=datetime.now()
    try:
        creator = int(request.authenticated_userid['iss'])
        content = request.POST['data']
        idModule = int(request.POST['FK_Sensor'])
        startEquip = request.POST['StartDate']
        endEquip = request.POST['EndDate']
     
        if re.compile('\r\n').search(content):
            data = content.split('\r\n')
        elif re.compile('\n').search(content):
            data = content.split('\n')
        elif re.compile('\r').search(content):
            data = content.split('\r')

        fieldtype1 = {'NB':'no','TYPE':'type','"PUCE "':'code','DATE':'no','TIME':'no'}
        fieldtype2 = {'#':'no','Transponder Type:':'type','Transponder Code:':'code','Date:':'no','Time:':'no','Event:':'Event','Unit #:':'Unit','Antenna #:':'Antenna','Memo:':'Memo','Custom:':'Custom','':''}
        fieldtype3 = {'Transponder Type:':'type','Transponder Code:':'code','Date:':'no','Time:':'no','Event:':'Event','Unit #:':'Unit','Antenna #:':'Antenna','Memo:':'Memo','Custom:':'Custom'}

        entete = data[0]
        
        if re.compile('\t').search(entete):
            separateur = '\t'

        elif re.compile(';').search(entete):
            separateur = ';'
        entete = entete.split(separateur)

        #file with head
        if (sorted(entete) == sorted(fieldtype1.keys())):
            field_label = ["no","Type","Code","date","time"]
            isHead = True

        elif (sorted(entete) == sorted(fieldtype2.keys())):
            field_label = ["no","Type","Code","date","time","no","no","no","no","no"]
            isHead = True

        elif (sorted(entete) == sorted(fieldtype3.keys())):
            field_label = ["Type","Code","date","time","no","no","no","no","no"]
            isHead = True
        else:# without head
            isHead = False
            if separateur == ';':
                field_label = ["no","Type","Code","date","time","no","no","no","no","no"]
            else:
                if len(entete) > 5:
                    field_label = ["Type","Code","date","time","no","no","no","no","no"]
                if entete[0] == 'Transponder Type:':
                    isHead = True
                elif entete[1] == 'Transponder Type:':
                    isHead = True
                    field_label = ["no","Type","Code","date","time"]
                else:
                    field_label = ["no","Type","Code","date","time"]

        # datas = pd.DataFrame(columns = ['FK_Sensor','date_','chip_code','creator','creation_date','validated','checked'])
        j=0
        code = ""
        date = ""
        dt = ""
        Rfids, chip_codes = set(), set()
        list_RFID = []

        if (isHead):
            j=1
        ########## Parsing data
        allDate = []
        while j < len(data):
            i = 0
            if data[j] != "" :
                line = data[j].replace('"','').split(separateur)
                while i < len(field_label):
                    if field_label[i] == 'Code':
                        code = line[i]
                    if field_label[i] == 'date':
                        date = line[i]
                    if field_label[i] == 'time':
                        time = re.sub('\s','',line[i])
                        format_dt = '%d/%m/%Y %H:%M:%S'
                        if re.search('PM|AM',time):
                            format_dt = '%m/%d/%Y %I:%M:%S%p'
                            format_dtBis='%d/%m/%Y %I:%M:%S%p'
                        dt = date+' '+time
                        try :
                            dt = datetime.strptime(dt, format_dt)
                        except Exception as e:
                            dt = datetime.strptime(dt, format_dtBis)
                        allDate.append(dt)
                    i=i+1
                # Rfids.add((creator, idModule, code, dt))
                # chip_codes.add(code)
                row = {'id_':j,'FK_Sensor':idModule,'date_':dt,'chip_code':code,'creator':creator,'creation_date':now,'validated':0,'checked':0}
                list_RFID.append(row)
            j=j+1
        data_to_check = pd.DataFrame.from_records(list_RFID,columns = ['id_','FK_Sensor','date_','chip_code','creator','creation_date','validated','checked'])

        minDateEquip = datetime.fromtimestamp(int(startEquip))
        try :
            maxDateEquip = datetime.fromtimestamp(int(endEquip))
        except:
            maxDateEquip = None

        ## check if Date corresponds with pose remove module ##
        if min(allDate)>= minDateEquip and (maxDateEquip is None or max(allDate)<= maxDateEquip):
            
            data_to_insert = checkDuplicatedRFID(data_to_check,min(allDate),max(allDate),idModule)
            Rfids = [{Rfid.creator.name: crea, Rfid.FK_Sensor.name: idMod, Rfid.checked.name: '0',
            Rfid.chip_code.name: c, Rfid.date_.name: d, Rfid.creation_date.name: now} for crea, idMod, c, d  in Rfids]
            # # Insert data.
            # session.execute(insert(Rfid), Rfids)
            data_to_insert = data_to_insert.drop(['id_'],1)
            data_to_insert = data_to_insert.drop_duplicates()

            if data_to_insert.shape[0] == 0:
                raise(IntegrityError)
                
            data_to_insert.to_sql(Rfid.__table__.name, session.get_bind(), if_exists='append', schema = dbConfig['sensor_schema'], index=False)

            message = 'inserted rows : '+str(len(Rfids))
            return message
        else :
            request.response.status_code = 510
            message = "File dates (first date : "+str(allDate[0])+" , last date : "+str(allDate[-1])+") don't correspond with the deploy/remove dates of the selected module"
            return message
        # Check if there are unknown chip codes.
        # query = select([Individual.chip_code]).where(Individual.chip_code.in_(chip_codes))
        # known_chips = set([row[0] for row in DBSession.execute(query).fetchall()])
        # unknown_chips = chip_codes.difference(known_chips)
        # if len(unknown_chips) > 0:
        #     message += '\n\nWarning : chip codes ' + str(unknown_chips) + ' are unknown.'
    except IntegrityError as e:
        print_exc()
        request.response.status_code = 520
        message = 'Data already exist.'
    except Exception as e:
        print_exc()
        request.response.status_code = 500
        message = 'Error'
    return message

def checkDuplicatedRFID(data_to_check,startEquip,endEquip,fk_sensor):
    session1 = threadlocal.get_current_registry().dbmaker()
    query = select([Rfid]
        ).where(
        and_(Rfid.date_ >= startEquip
            ,and_(Rfid.date_<=endEquip,Rfid.FK_Sensor == fk_sensor))
        )
    result = session1.execute(query).fetchall()

    existingData = pd.DataFrame.from_records(result,
     columns = ['ID','FK_Sensor','date_','chip_code','creator','creation_date','validated','checked','frequency'])
    existingData.rename(columns={'ID':'$ID','FK_Sensor':'$FK_Sensor','date_':'$date_','chip_code':'$chip_code','creator':'$creator','creation_date':'$creation_date','validated':'$validated','checked':'$checked','frequency':'$frequency'}, inplace=True)
    # existingData['$FK_Sensor'] = existingData['$FK_Sensor'].astype(int)
    # data_to_check['FK_Sensor'] = data_to_check['FK_Sensor'].astype(int)

    # existingData['chip_code'] = existingData['chip_code'].astype(str)
    # data_to_check['chip_code'] = data_to_check['chip_code'].astype(str)

    existingData['$date_'] =  pd.to_datetime(existingData['$date_'])
    data_to_check['date_'] =  pd.to_datetime(data_to_check['date_'])
    merge = data_to_check.merge(existingData, left_on = ['FK_Sensor'], right_on = ['$FK_Sensor'])

    DFToInsert = data_to_check[~data_to_check['id_'].isin(merge['id_'])]
    # session1.close()
    print(DFToInsert)
    return DFToInsert

