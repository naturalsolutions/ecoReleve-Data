from array import array

from pyramid.view import view_config
from pyramid.response import Response
from sqlalchemy import func, desc, select, union, union_all, and_, bindparam, update, or_, literal_column, join, text, update
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


# ------------------------------------------------------------------------------------------------------------------------- #
def uploadFileArgos(request) :
    import getpass
    username =  getpass.getuser()
    print ('*********************** UPLOAD ARGOS **************************')
    import getpass
    username =  getpass.getuser()
    workDir = os.path.dirname(os.path.dirname(os.path.abspath(ecoreleve_server.__file__)))
    tmp_path = os.path.join(workDir, "ecoReleve_import")
    # tmp_path = os.path.join(os.path.expanduser('~%s' % username), "AppData", "Local", "Temp")
    import_path = os.path.join(tmp_path, "uploaded_file")
    # if not os.path.exists(import_path):
    #     os.makedirs(import_path)
    # DS_path = os.path.join(tmp_path, "Argos")
    # if not os.path.exists(DS_path):
    #     os.makedirs(DS_path)
    file_obj = request.POST['file']
    filename = request.POST['file'].filename
    input_file = request.POST['file'].file

    unic_time = int(time.time())
    full_filename = os.path.join(import_path, filename)

    if os.path.exists(full_filename) :
        os.remove(full_filename)

    temp_file_path = full_filename + '~'

    if os.path.exists(temp_file_path) :
        os.remove(temp_file_path)

    input_file.seek(0)
    with open(temp_file_path, 'wb') as output_file :
        shutil.copyfileobj(input_file, output_file)

    os.rename(temp_file_path, full_filename)

    if 'DIAG' in filename :
        return parseDIAGFileAndInsert(full_filename)
    elif 'DS' in filename :
        return parseDSFileAndInsert(full_filename)

# ------------------------------------------------------------------------------------------------------------------------- #
def parseDSFileAndInsert(full_filename):
    import getpass
    username =  getpass.getuser()
    workDir = os.path.dirname(os.path.dirname(os.path.abspath(ecoreleve_server.__file__)))
    con_file = os.path.join(workDir,'init.txt')
    MTI_path = os.path.join(workDir,'MTIwinGPS.exe')
    out_path = os.path.join(workDir,"ecoReleve_import","Argos",os.path.splitext(os.path.basename(full_filename))[0])

    EngData = None
    GPSData = None 
    nb_gps_data = 0

    print (MTI_path)
    if not os.path.exists(out_path):
        os.makedirs(out_path)

    # if os.path.exists(con_file) :
    try:
        os.remove(con_file)
    except : 
        pass

    cc = {'full_filename':full_filename}
    cc['out'] = out_path
    cc['ini'] = con_file

    with open(con_file,'w') as f: 
        f.write("-eng\n")
        # f.write("-argos\n")
        f.write("-title\n")
        f.write("-out\n")
        f.write(out_path+"\n")
        f.write(full_filename)

    args = [MTI_path]
    # os.startfile(args[0])
    proc = subprocess.Popen([args[0]])
    hwnd = 0
    while hwnd == 0 :
        sleep(0.3)
        hwnd = win32gui.FindWindow(0, "MTI Argos-GPS Parser")
    btnHnd= win32gui.FindWindowEx(hwnd, 0 , "Button", "Run")
    win32api.SendMessage(btnHnd, win32con.BM_CLICK, 0, 0)
    filenames = [os.path.join(out_path,fn) for fn in next(os.walk(out_path))[2]]
    win32api.SendMessage(hwnd, win32con.WM_CLOSE, 0,0);

    pid = proc.pid
    cc['pid'] = pid
    parent = psutil.Process(pid)
    for child in parent.children(recursive=True):  # or parent.children() for recursive=False
        child.kill()
    parent.kill()

    for filename in filenames:
        fullname = os.path.splitext(os.path.basename(filename))[0]
        ptt = int(fullname[0:len(fullname)-1])

        if filename.endswith("g.txt"):
            tempG = pd.read_csv(filename,sep='\t',header=0 , parse_dates = [0], infer_datetime_format = True)
            tempG['ptt'] = ptt
            try:
                GPSData = GPSData.append(tempG)
            except :
                GPSData = tempG

        if filename.endswith("e.txt"):
            usecols= ['txDate','pttDate','satId','activity','txCount','temp','batt','fixTime','satCount','resetHours','fixDays','season','shunt','mortalityGT','seasonalGT']
            tempEng = pd.read_csv(filename,sep='\t',parse_dates=[0,1],header = None, skiprows = [0])
            if len(tempEng.columns )== 17:
                usecols.append('latestLat')
                usecols.append('latestLon')

            tempEng.columns = usecols
            tempEng['ptt'] = ptt
            try:
                EngData = EngData.append(tempEng)
            except :
                EngData = tempEng

    if EngData is not None : 
        EngToInsert = checkExistingEng(EngData)
        dataEng_to_insert = json.loads(EngToInsert.to_json(orient='records',date_format='iso'))
        # print (EngToInsert.to_records(index= False))
        # for i in range(len(dataEng_to_insert)) :
        #     print (type(dataEng_to_insert[i]['txDate']))
            
        #     try :
        #         dataEng_to_insert[i]['txDate'] = datetime.strptime(dataEng_to_insert[i]['txDate'],'%Y-%m-%d %H:%M:%S')
        #         dataEng_to_insert[i]['pttDate'] = datetime.strptime(dataEng_to_insert[i]['pttDate'],'%Y-%m-%d %H:%M:%S')
        #     except Exception as e : 
        #         print(e)
        #         print (dataEng_to_insert[i]['pttDate'])
        #         dataEng_to_insert[i]['txDate'] = datetime.strptime(dataEng_to_insert[i]['txDate'],'%Y-%d-%m %H:%M:%S')
        #         dataEng_to_insert[i]['pttDate'] = datetime.strptime(dataEng_to_insert[i]['pttDate'],'%Y-%d-%m %H:%M:%S')

        if len(dataEng_to_insert) != 0 :
            stmt = ArgosEngineering.__table__.insert()#.values(dataGPS_to_insert[0:2])
            res = DBSession.execute(stmt,dataEng_to_insert)

    if GPSData is not None :
        GPSData = GPSData.replace(["neg alt"],[-999])
        DFToInsert = checkExistingGPS(GPSData)
        dataGPS_to_insert = json.loads(DFToInsert.to_json(orient='records',date_format='iso'))

        if len(dataGPS_to_insert) != 0 :
            stmt = ArgosGps.__table__.insert()#.values(dataGPS_to_insert[0:2])
            res = DBSession.execute(stmt,dataGPS_to_insert)
            nb_gps_data = len(dataGPS_to_insert)

    os.remove(full_filename)
    shutil.rmtree(out_path)

    return nb_gps_data

# ------------------------------------------------------------------------------------------------------------------------- #
def checkExistingEng(EngData) :
    EngData['id'] = range(EngData.shape[0])
    # try : 
    #     maxDate =  datetime.strptime(EngData['pttDate'].max(axis=1),'%Y-%m-%d %H:%M:%S')
    #     minDate =  datetime.strptime(EngData['pttDate'].min(axis=1),'%Y-%m-%d %H:%M:%S')
    # except :
    #     maxDate =  datetime.strptime(EngData['pttDate'].max(axis=1),'%Y-%d-%m %H:%M:%S')
    #     minDate =  datetime.strptime(EngData['pttDate'].min(axis=1),'%Y-%d-%m %H:%M:%S')
    # EngData['pttDate'] = EngData.apply(lambda row: np.datetime64(row['pttDate']).astype(datetime), axis=1)

    maxDate =  EngData['pttDate'].max(axis=1)
    minDate =  EngData['pttDate'].min()

    queryEng = select([ArgosEngineering.fk_ptt, ArgosEngineering.pttDate, ArgosEngineering.txDate])
    queryEng = queryEng.where(and_(ArgosEngineering.pttDate >= minDate , ArgosEngineering.pttDate <= maxDate))
    data = DBSession.execute(queryEng).fetchall()

    EngRecords = pd.DataFrame.from_records(data
        ,columns=[ArgosEngineering.fk_ptt.name, ArgosEngineering.pttDate.name, ArgosEngineering.txDate.name])

    merge = pd.merge(EngData,EngRecords, left_on = ['pttDate','txDate','ptt'], right_on = ['pttDate','txDate','FK_ptt'])
    DFToInsert = EngData[~EngData['id'].isin(merge['id'])]
    DFToInsert['FK_ptt'] = DFToInsert['ptt']
    DFToInsert = DFToInsert.drop(['id','ptt'],1)

    return DFToInsert

# ------------------------------------------------------------------------------------------------------------------------- #
def checkExistingGPS (GPSData) :
    GPSData['datetime'] = GPSData.apply(lambda row: np.datetime64(row['Date/Time']).astype(datetime), axis=1)
    GPSData['id'] = range(GPSData.shape[0])
    maxDateGPS = GPSData['datetime'].max(axis=1)
    minDateGPS = GPSData['datetime'].min(axis=1)
    GPSData['Latitude(N)'] = np.round(GPSData['Latitude(N)'],decimals = 5)
    GPSData['Longitude(E)'] = np.round(GPSData['Longitude(E)'],decimals = 5)

    queryGPS = select([ArgosGps.pk_id, ArgosGps.date, ArgosGps.lat, ArgosGps.lon, ArgosGps.ptt]).where(ArgosGps.type_ == 'gps')
    queryGPS = queryGPS.where(and_(ArgosGps.date >= minDateGPS , ArgosGps.date <= maxDateGPS))
    data = DBSession.execute(queryGPS).fetchall()

    GPSrecords = pd.DataFrame.from_records(data
        ,columns=[ArgosGps.pk_id.name, ArgosGps.date.name, ArgosGps.lat.name, ArgosGps.lon.name, ArgosGps.ptt.name]
        , coerce_float=True )
    GPSrecords['lat'] = GPSrecords['lat'].astype(float)
    GPSrecords['lon'] = GPSrecords['lon'].astype(float)

    merge = pd.merge(GPSData,GPSrecords, left_on = ['datetime','Latitude(N)','Longitude(E)','ptt'], right_on = ['date','lat','lon','FK_ptt'])
    DFToInsert = GPSData[~GPSData['id'].isin(merge['id'])]

    DFToInsert = DFToInsert.drop(['id','datetime'],1)
    DFToInsert.columns = ['date','lat','lon','speed','course','ele','FK_ptt']

    DFToInsert = DFToInsert.replace('2D fix',np.nan )
    DFToInsert = DFToInsert.replace('low alt',np.nan )
    DFToInsert['type']='gps'

    return DFToInsert

# ------------------------------------------------------------------------------------------------------------------------- #
def parseDIAGFileAndInsert(full_filename):
    with open(full_filename,'r') as f:
        content = f.read()
        content = re.sub('\s+Prog+\s\d{5}',"",content)
        content2 = re.sub('[\n\r]\s{10,14}[0-9\s]+[\n\r]',"\n",content)
        content2 = re.sub('[\n\r]\s{10,14}[0-9\s]+$',"\n",content2)
        content2 = re.sub('^[\n\r\s]+',"",content2)
        content2 = re.sub('[\n\r\s]+$',"",content2)
        splitBlock = 'm[\n\r]'
        blockPosition = re.split(splitBlock,content2)

    colsInBlock = ['FK_ptt','date','lc','iq','lat1'
        ,'lon1','lat2','lon2','nbMsg','nbMsg120'
        ,'bestLevel','passDuration','nopc', 'freq','ele']
    ListOfdictParams = []
    j = 0
    for block in blockPosition :
        block = re.sub('[\n\r]+',"",block)
        block = re.sub('[a-zA-Z]\s+Lat'," Lat",block)
        block = re.sub('[a-zA-Z]\s+Lon'," Lon",block)
        block = re.sub('[a-zA-Z]\s+Nb'," Nb",block)
        block = re.sub('[a-zA-Z]\s+NOPC'," NOPC",block)
        block = re.sub('IQ',"#IQ",block)
        block = re.sub('[a-zA-Z]\s[a-zA-Z]',"O",block)

        split = '\#?[a-zA-Z0-9\-\>]+\s:\s'
        splitParameters = re.split(split,block)
        curDict = {}

        for i in range(len(splitParameters)) :
            if re.search('[?]+([a-zA-Z]+)?',splitParameters[i]) :
                splitParameters[i] = re.sub('[?]+([a-zA-Z]{1,2})?',"NaN",splitParameters[i])

            if re.search('[0-9]',splitParameters[i]):
                splitParameters[i] = re.sub('[a-zA-Z\s]'," ",splitParameters[i])

            if colsInBlock[i] == 'date' :
                curDict[colsInBlock[i]] = datetime.strptime(splitParameters[i],'%d.%m.%y %H:%M:%S ')
            else:
                try :
                    curDict[colsInBlock[i]] = int(splitParameters[i])   
                except :
                    try :
                        splitParameters[i] = re.sub('[\s]',"",splitParameters[i])
                        curDict[colsInBlock[i]] = float(splitParameters[i])
                    except :
                        curDict[colsInBlock[i]] = splitParameters[i]
        ListOfdictParams.append(curDict)

    df = pd.DataFrame.from_dict(ListOfdictParams)

    df = df.dropna(subset=['lat1', 'lon1','lat2', 'lon2','date'])
    DFToInsert = checkExistingArgos(df)
    DFToInsert['type']='arg'
    DFToInsert = DFToInsert.drop(['id','lat1','lat2','lon1','lon2'],1)

    data_to_insert = json.loads(DFToInsert.to_json(orient='records',date_format='iso'))

    if len(data_to_insert) != 0 :
        stmt = ArgosGps.__table__.insert()#.values(data_to_insert[0:2])
        res = DBSession.execute(stmt,data_to_insert)
    os.remove(full_filename)
    return len(data_to_insert)

# ------------------------------------------------------------------------------------------------------------------------- #
def checkExistingArgos (dfToCheck) :
    dfToCheck['id'] = range(dfToCheck.shape[0])
    dfToCheck['lat'] = dfToCheck['lat1'].astype(float)
    dfToCheck['lon'] = dfToCheck['lon1'].astype(float)
    maxDate = dfToCheck['date'].max(axis=1)
    minDate = dfToCheck['date'].min(axis=1)

    queryArgos = select([ArgosGps.pk_id, ArgosGps.date, ArgosGps.lat, ArgosGps.lon, ArgosGps.ptt]).where(ArgosGps.type_ == 'arg')
    queryArgos = queryArgos.where(and_(ArgosGps.date >= minDate , ArgosGps.date <= maxDate))
    data = DBSession.execute(queryArgos).fetchall()

    ArgosRecords = pd.DataFrame.from_records(data
        ,columns=[ArgosGps.pk_id.name, ArgosGps.date.name, ArgosGps.lat.name, ArgosGps.lon.name, ArgosGps.ptt.name]
        , coerce_float=True )
    merge = pd.merge(dfToCheck,ArgosRecords, left_on = ['date','lat','lon','FK_ptt'], right_on = ['date','lat','lon','FK_ptt'])
    DFToInsert = dfToCheck[~dfToCheck['id'].isin(merge['id'])]

    return DFToInsert