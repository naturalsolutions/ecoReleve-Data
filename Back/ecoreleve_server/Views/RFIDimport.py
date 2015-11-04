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


# ------------------------------------------------------------------------------------------------------------------------- #
def uploadFileRFID(request):
    data = []
    message = ""
    field_label = []
    isHead = False
    now=datetime.now()
    print('call ajax import')
    try:
        creator = request.authenticated_userid
        content = request.POST['data']
        idModule = request.POST['FK_Sensor']
     
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

        j=0
        code = ""
        date = ""
        dt = ""
        Rfids, chip_codes = set(), set()
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
                Rfids.add((creator, idModule, code, dt))
                chip_codes.add(code)
            j=j+1
        ## check if Date corresponds with pose remove module ##
        # table = Base.metadata.tables['RFID_MonitoredSite']
        # q_check_date = select([func.count('*')]).where(
        #     and_(table.c['begin_date'] < allDate[0], or_(table.c['end_date'] >= allDate[-1],table.c['end_date'] == None))
        #     ).where(table.c['identifier'] == module)
        # check = DBSession.execute(q_check_date).scalar() 
        # if check == 0 :
        #     request.response.status_code = 510
        #     message = "Dates of this uploded file (first date : "+str(allDate[0])+" , last date : "+str(allDate[-1])+") don't correspond with the deploy/remove dates of the selected module"
        #     return message

        Rfids = [{Rfid.creator.name: crea, Rfid.FK_Sensor.name: idMod, Rfid.checked.name: '0',
                Rfid.chip_code.name: c, Rfid.date_.name: d, Rfid.creation_date.name: now} for crea, idMod, c, d  in Rfids]
        # Insert data.
        DBSession.execute(insert(Rfid), Rfids)
        message = {'inserted':len(Rfids)}
        return message
        # Check if there are unknown chip codes.
        # query = select([Individual.chip_code]).where(Individual.chip_code.in_(chip_codes))
        # known_chips = set([row[0] for row in DBSession.execute(query).fetchall()])
        # unknown_chips = chip_codes.difference(known_chips)
        # if len(unknown_chips) > 0:
        #     message += '\n\nWarning : chip codes ' + str(unknown_chips) + ' are unknown.'
    except IntegrityError as e:
        request.response.status_code = 500
        message = 'Data already exist.'
    except Exception as e:
        print(e)
        request.response.status_code = 520
        message = 'Error'
    return message
