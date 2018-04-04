import os
import time
import datetime
import numpy as np
import json
import pandas as pd
from traceback import print_exc
from exiftool import fsencode
from sqlalchemy import func, select, bindparam, text, Table, join, or_, and_, update, asc
from sqlalchemy.orm import joinedload

from ecoreleve_server.core.base_resource import CustomResource
from ecoreleve_server.core import RootCore, Base, dbConfig
from ecoreleve_server.utils.distance import haversine
from ecoreleve_server.utils.data_toXML import data_to_XML
from ecoreleve_server.utils.ocr_detect import OCR_parser
from ecoreleve_server.utils.parseValue import parser

from ecoreleve_server.modules.permissions import context_permissions
from ecoreleve_server.modules.import_module.importArgos import uploadFileArgos
from ecoreleve_server.modules.import_module.importGSM import uploadFilesGSM
from ecoreleve_server.modules.import_module.importRFID import uploadFileRFID
from ecoreleve_server.modules.import_module.importCameraTrap import *
from ecoreleve_server.modules.statistics import graphDataDate
from ecoreleve_server.modules.monitored_sites import MonitoredSite
from ecoreleve_server.modules.observations import Equipment
from ecoreleve_server.modules.users import User

from . import CamTrap, ArgosGps, Gsm, Rfid, MetaData
# from ecoreleve_server.__init__ import mySubExif

import exiftool
mySubExif = None

if dbConfig.get('init_exiftool', 'True') == 'True':
    mySubExif = exiftool.ExifTool()
    mySubExif.start()


ArgosDatasWithIndiv = Table(
    'VArgosData_With_EquipIndiv', Base.metadata, autoload=True)
GsmDatasWithIndiv = Table('VGSMData_With_EquipIndiv',
                          Base.metadata, autoload=True)
DataRfidWithSite = Table('VRfidData_With_equipSite',
                         Base.metadata, autoload=True)
DataRfidasFile = Table('V_dataRFID_as_file',
                       Base.metadata, autoload=True)
DataCamTrapFile = Table('V_dataCamTrap_With_equipSite',
                        Base.metadata, autoload=True)
viewDict = {'gsm': GsmDatasWithIndiv,
            'argos': ArgosDatasWithIndiv,
            'rfid': DataRfidasFile,
            'camtrap': DataCamTrapFile
            }


class SensorDatasBySessionItem(CustomResource):

    item = None
    models = {'gsm': Gsm,
              'argos': ArgosGps,
              'rfid': Rfid,
              'camtrap': CamTrap}

    def __init__(self, ref, parent):
        CustomResource.__init__(self, ref, parent)
        self.type_ = parent.type_
        self.itemID = ref
        self.viewTable = parent.viewTable

        self.item = self.session.query(self.models.get(self.type_)).get(ref)

    def retrieve(self):
        if not self.item:
            self.request.response.status_code = 404
            return self.request.response
        else:
            return self.item.__json__()

    def patch(self):
        data = self.request.json_body #potentially new props
        cmdTags = ''
        # '-XMP-Photoshop:Headline=Picture of'+metaData['monitoredSite'].Category+''+metaData['monitoredSite'].Name+',Lon:'+metaData['monitoredSite'].Lon+',Lat:'+metaData['monitoredSite'].Lat+', on'+metaData.pictureCreationDate+'showing'+tagList
        for item in data:
            if(item not in ['pk_id', 'fk_sensor', 'path', 'name', 'extension', 'date_creation', 'date_uploaded']):
                tmp = data.get(item)
                if(item == 'tags' and tmp):
                    listTags = tmp.split(",")
                    XMLTags = "<TAGS>"
                    for tag in listTags:
                        XMLTags += "<TAG>" + str(tag) + "</TAG>"
                    XMLTags += "</TAGS>"
                    tmp = XMLTags
                setattr(self.item, item, tmp)
                #TODO INSERT TAG AS METADATA
        self.request.response.status_code = 204
        return self.request.response

    def XMLToStr(self, xmlStr):
        strForReplace = ''
        for strToRemove in ['<TAGS>','</TAGS>','</TAG>']:
            if strToRemove in xmlStr:
                xmlStr = xmlStr.replace(strToRemove , strForReplace)
        firstTagFind = 0
        for strToReplace in ['<TAG>']:
            if strToReplace in xmlStr :
                if not firstTagFind:
                    firstTagFind = 1
                else:
                    strForReplace = ','
                xmlStr = xmlStr.replace(strToRemove , strForReplace)
        return xmlStr
    
    def strToXML(self, strVal):
        listTags = strVal.split(",")
        XMLTags = None
        if len(listTags) > 0 :
            XMLTags = "<TAGS>"
            for tag in listTags :
                XMLTags += "<TAG>" + str(tag) + "</TAG>"
            XMLTags += "</TAGS>"
        return XMLTags


class SensorDatasBySession(CustomResource):

    item = SensorDatasBySessionItem
    children = [('argos', SensorDatasBySessionItem),
                ('gsm', SensorDatasBySessionItem),
                ('rfid', SensorDatasBySessionItem),
                ('camtrap', SensorDatasBySessionItem)
    ]

    def __init__(self, ref, parent):
        CustomResource.__init__(self, ref, parent)
        self.type_ = parent.type_
        self.sessionID = ref
        if ref == '0':
            self.sessionID = None
        self.viewTable = parent.viewTable
        # self.__acl__ = parent.__acl__

        # self.actions = {
        #     'datas': self.getDatas,
        #     'updateMany' : self.updateMany
        #     }

    def updateMany(self):
        if self.type_ == 'camtrap':
            seqIds = []
            datas = self.request.json_body #potentially new props
            for item in datas:
                idTmp = item['pk_id']
                if idTmp:
                    seqIds.append(idTmp)
            allItems = self.session.query(CamTrap).filter(CamTrap.pk_id.in_(seqIds)).all()

            for item in allItems:
                item.validated = 2

        self.request.response.status_code = 204
        return self.request.response

    def getDatas(self):
        if self.type_ == 'camtrap':
            if self.request.method == 'GET':
                joinTable = join(CamTrap, self.viewTable,
                                CamTrap.pk_id == self.viewTable.c['pk_id'])
                query = select([CamTrap]).select_from(joinTable)
                query = query.where(self.viewTable.c['sessionID'] == self.sessionID)
                query = query.where(or_(self.viewTable.c['checked'] == 0, self.viewTable.c['checked'] == None))
                query = query.order_by(asc(self.viewTable.c['date_creation']))

        else:
            query = select([self.viewTable]
                           ).where(self.viewTable.c['sessionID'] == self.sessionID
                                   ).where(or_(self.viewTable.c['checked'] == 0, self.viewTable.c['checked'] == None))
        query = self.handleQuery(query)
        data = self.session.execute(query).fetchall()
        return self.handleResult(data)

    def handleQuery(self, query):
        fk_sensor = self.request.params.mixed().get('FK_Sensor', None)
        if not self.sessionID and fk_sensor:
            newQuery = query.where(self.viewTable.c['FK_Sensor'] == fk_sensor)
        else:
            newQuery = query
        return newQuery

    def handleResult(self, data):
        if self.type_ in ['gsm', 'argos']:
            if 'geo' in self.request.params:
                geoJson = []
                for row in data:
                    geoJson.append({'type': 'Feature', 'id': row['PK_id'], 'properties': {
                                   'type': row['type'], 'date': row['date']}, 'geometry': {'type': 'Point', 'coordinates': [row['lat'], row['lon']]}})
                result = {'type': 'FeatureCollection', 'features': geoJson}

            else:
                df = pd.DataFrame.from_records(
                    data, columns=data[0].keys(), coerce_float=True)
                X1 = df.iloc[:-1][['lat', 'lon']].values
                X2 = df.iloc[1:][['lat', 'lon']].values
                df['dist'] = np.append(haversine(X1, X2), 0).round(3)
                # Compute the speed
                df['speed'] = (df['dist'] / ((df['date'] - df['date'].shift(-1)
                                              ).fillna(1) / np.timedelta64(1, 'h'))).round(3)
                df['date'] = df['date'].apply(
                    lambda row: np.datetime64(row).astype(datetime.datetime))
                # Fill NaN
                df.fillna(value={'ele': -999}, inplace=True)
                df.fillna(value={'speed': 0}, inplace=True)
                df.replace(to_replace={'speed': np.inf},
                           value={'speed': 9999}, inplace=True)
                df.fillna(value=0, inplace=True)
                # dataResult = [dict(row) for row in data]
                dataResult = df.to_dict('records')
                result = [{'total_entries': len(dataResult)}]
                result.append(dataResult)

        elif self.type_ == 'camtrap':
            result = []
            for row in data:
                tmp = dict(row.items())
                varchartmp = tmp['path'].split('\\')
                tmp['path'] = "/imgcamtrap/" + str(varchartmp[len(varchartmp) - 2]) + "/"
                tmp['name'] = tmp['name'].replace(" ", "%20")
                tmp['id'] = tmp['pk_id']
                tmp['date_creation'] = str(tmp['date_creation'])
                tmp['date_creation'] = tmp['date_creation']
                if(str(tmp['tags']) != 'None'):
                    strTags = tmp['tags'].replace("<TAGS>", "")
                    strTags = strTags.replace("<TAG>", "")
                    strTags = strTags.replace("</TAGS>", "")
                    strTags = strTags.replace("</TAG>", ",")
                    strTags = strTags[:len(strTags) - 1]  # del the last ","
                    if(strTags != 'None'):
                        tmp['tags'] = strTags
                    else:
                        tmp['tags'] = ""
                result.append(tmp)
            #result = data
        else:
            result = data
        return result

    def retrieve(self):
        queryStmt = select([Equipment]).where(
            Equipment.ID == self.sessionID)
        data = self.session.execute(queryStmt.limit(1)).fetchall()
        return dict(data[0])

    def patch(self):
        # here patch method
        pass

    def create(self):
        return self.manual_validate()

    def manual_validate(self):
        # global graphDataDate
        params = self.request.params.mixed()
        user = self.request.authenticated_userid['iss']

        data = json.loads(params['data'])

        procStockDict = {
            'argos': '[sp_validate_Argos_GPS]',
            'gsm': '[sp_validate_GSM]'
        }

        try:
            if self.sessionID:
                ptt = params['id_ptt']
                ind_id = params['id_indiv']
                xml_to_insert = data_to_XML(data)
                stmt = text(""" DECLARE @nb_insert int , @exist int, @error int;
                    exec """ + dbConfig['data_schema'] + """.""" + procStockDict[self.type_]
                            + """ :id_list, :ind_id , :user , :ptt, @nb_insert OUTPUT, @exist OUTPUT , @error OUTPUT;
                        SELECT @nb_insert, @exist, @error; """
                            ).bindparams(bindparam('id_list', xml_to_insert),
                                         bindparam('ind_id', ind_id),
                                         bindparam('ptt', ptt),
                                         bindparam('user', user))
                nb_insert, exist, error = self.session.execute(stmt).fetchone()
                self.session.commit()

                graphDataDate['pendingSensorData'] = None
                graphDataDate['indivLocationData'] = None
                return {'inserted': nb_insert, 'existing': exist, 'errors': error}
            else:
                return self.error_response(None)
        except Exception as err:
            print_exc()
            return self.error_response(err)

    def error_response(self, err):
        if err is not None:
            msg = err.args[0] if err.args else ""
            response = 'Problem occurs : ' + str(type(err)) + ' = ' + msg
        else:
            response = 'No induvidual equiped'
        self.request.response.status_code = 500
        return response


class SensorDatasByType(CustomResource):

    item = SensorDatasBySession
    children = [('{int}', SensorDatasBySession)]
    dictFuncImport = {
        'argos': uploadFileArgos,
        'gsm': uploadFilesGSM,
        'rfid': uploadFileRFID,
    }
    __acl__ = context_permissions['stations']

    def __init__(self, ref, parent):
        CustomResource.__init__(self, ref, parent)
        self.type_ = ref
        self.viewTable = viewDict[ref]

        self.queryType = {'gsm': self.queryWithIndiv,
                          'argos': self.queryWithIndiv,
                          'rfid': self.queryWithSite,
                          'camtrap': self.queryWithSite}

    def retrieve(self):
        criteria = self.request.params.get('criteria', None)

        queryStmt = self.queryType[self.type_]()
        queryStmt = self.handleCriteria(queryStmt, criteria)
        data = self.session.execute(queryStmt).fetchall()
        dataResult = [dict(row) for row in data]
        result = [{'total_entries': len(dataResult)}]
        result.append(dataResult)
        return result

    def handleCriteria(self, queryStmt, criteria=None):
        # apply other criteria
        if self.type_ in ['gsm', 'argos'] and not criteria:
            queryStmt = queryStmt.order_by(self.viewTable.c['FK_ptt'].asc())

        return queryStmt

    def queryWithSite(self):
        if(self.type_ in ['camtrap']):
            queryStmt = select([self.viewTable.c['sessionID'],
                                self.viewTable.c['UnicIdentifier'],
                                self.viewTable.c['fk_sensor'],
                                self.viewTable.c['site_name'],
                                self.viewTable.c['site_type'],
                                self.viewTable.c['StartDate'],
                                self.viewTable.c['EndDate'],
                                self.viewTable.c['FK_MonitoredSite'],
                                func.count(self.viewTable.c['sessionID']).label(
                                    'nb_photo'),
                                func.sum(self.viewTable.c['processed']).label('processed')
                                ]
                               )
            queryStmt = queryStmt.where(self.viewTable.c['checked'] == None)
            queryStmt = queryStmt.group_by(self.viewTable.c['sessionID'],
                                          self.viewTable.c['UnicIdentifier'],
                                          self.viewTable.c['fk_sensor'],
                                          self.viewTable.c['site_name'],
                                          self.viewTable.c['site_type'],
                                          self.viewTable.c['StartDate'],
                                          self.viewTable.c['EndDate'],
                                          self.viewTable.c['FK_MonitoredSite']
                                          )
        else:
            queryStmt = select(self.viewTable.c)

        return queryStmt

    def queryWithIndiv(self):
        selectStmt = select([self.viewTable.c['FK_Individual'],
                             self.viewTable.c['sessionID'],
                             self.viewTable.c['Survey_type'],
                             self.viewTable.c['FK_ptt'],
                             self.viewTable.c['FK_Sensor'],
                             self.viewTable.c['StartDate'],
                             self.viewTable.c['EndDate'],
                             func.count().label('nb'),
                             func.max(self.viewTable.c['date']).label(
                                 'max_date'),
                             func.min(self.viewTable.c['date']).label('min_date')])

        queryStmt = selectStmt.where(self.viewTable.c['checked'] == 0
                                     ).group_by(self.viewTable.c['FK_Individual'],
                                                self.viewTable.c['Survey_type'],
                                                self.viewTable.c['FK_ptt'],
                                                self.viewTable.c['StartDate'],
                                                self.viewTable.c['EndDate'],
                                                self.viewTable.c['FK_Sensor'],
                                                self.viewTable.c['sessionID'],
                                                )
        return queryStmt

    def create(self):
        return self.dictFuncImport[self.type_](self.request)


    def buildMetaDataInfoFromErdData(self):
        metaDataInfo = {}
        metaDataInfo['monitoredSite'] = {}
        metaDataInfo['image'] = {}
        metaDataInfo['user'] = {}
        metaDataInfo['session'] = {}
        metaDataInfo['misc'] = {}


        user = self.session.query(User).get(self.request.authenticated_userid['iss'])
        
        metaDataInfo['user']['TUse_FirstName'] = user.Firstname
        metaDataInfo['user']['TUse_LastName'] = user.Lastname
        # print(self.request)
        metaDataInfo['image']['photoId'] = 0
        metaDataInfo['image']['name'] = self.request.POST['resumableFilename']
        metaDataInfo['image']['fkSensor'] = int(self.request.POST['id'])
        metaDataInfo['image']['dateTimeOriginalPhoto'] = ''
        metaDataInfo['image']['dateInsertSQL'] = ''
        metaDataInfo['image']['lastTransformationDate'] = ''
        metaDataInfo['image']['dateTimeCreationPhoto'] = ''
        metaDataInfo['image']['lastDateWriteInPhoto'] = ''
        metaDataInfo['image']['shootId'] = -1
        
        metaDataInfo['session']['startDate'] = str(self.request.POST['startDate'])
        metaDataInfo['session']['endDate'] = str(self.request.POST['endDate'])

        metaDataInfo['misc']['regionAnPlaceMonitoredSite'] = ''
        metaDataInfo['misc']['projectName'] = ''

        monitoredSite = self.session.query(MonitoredSite).get(self.request.POST['monitoredSiteId'])

        sitePosition = monitoredSite.GetLastPositionWithDate(parser(str(self.request.POST['endDate'])))
        metaDataInfo['monitoredSite']['Name'] = monitoredSite.Name
        metaDataInfo['monitoredSite']['LAT'] = sitePosition['LAT']
        metaDataInfo['monitoredSite']['LON'] = sitePosition['LON']
        metaDataInfo['monitoredSite']['Precision'] = sitePosition['Precision']
        metaDataInfo['monitoredSite']['ELE'] = sitePosition['ELE']

        return metaDataInfo

    def uploadFileCamTrapResumable(self):
        # print("yolooooo")
        # print("ca tourne", mySubExif.running)
        # print("end")
        start = time.time()
        if not self.request.POST:
            return self.checkChunk()
        metaDataInfo = self.buildMetaDataInfoFromErdData()
        cmdMetaDataInfo = buildCmdMetaDatasAtImport(self,metaDataInfo)
        flagDate = False
        flagError = False
        pathPrefix = dbConfig['camTrap']['path']
        pathPost = str(self.request.POST['path'])
        jetLag = {}
        jetLag['operator'] = str( self.request.POST['jetLagOperator'] )
        jetLag['hours'] = str(self.request.POST['jetLagHours'])
        fk_sensor = int(self.request.POST['id'])
        messageDate = ""
        #TODO make all test on temporary file before store it (better way)

        uri = pathPrefix + '\\' + pathPost
        extType = self.request.POST['resumableFilename'].split('.')

        inputFile = self.request.POST['file'].file
        # print("before if :",time.time() - start )
        if(int(self.request.POST['resumableChunkNumber']) == 1 and int(self.request.POST['resumableCurrentChunkSize']) == int(self.request.POST['resumableTotalSize']) and str(extType[len(extType) - 1]) != ".zip"):
            if not os.path.isfile(pathPrefix + '\\' + pathPost + '\\' + str(self.request.POST['resumableFilename'])):
                # write in the file
                # print("before write file :",time.time() - start )
                with open(uri + '\\' + str(self.request.POST['resumableFilename']), 'wb') as output_file:
                    shutil.copyfileobj(inputFile, output_file)
                output_file.close()
                # print("after write file :",time.time() - start )
            # datePhoto = dateFromExif( uri + '\\' + str(self.request.POST['resumableFilename']))
            jetLagArray = jetLag['hours'].split(':')
            if jetLag['operator'] == '+':
                operator = 1
            if jetLag['operator'] == '-':
                operator = -1
            exifDate = dateFromExif(uri + '\\' + str(self.request.POST['resumableFilename']))
            dateOrigine = datetime.datetime.strptime(str(exifDate) , "%Y-%m-%d %H:%M:%S")
            dateDecall = dateOrigine + datetime.timedelta(hours = operator*int(jetLagArray[0]) , minutes = operator*int(jetLagArray[1]), seconds = operator*int(jetLagArray[2]) )
            datePhoto = dateDecall
            user = self.request.authenticated_userid['iss']
            if(checkDate(datePhoto,jetLag, str(self.request.POST['startDate']), str(self.request.POST['endDate']))):
                # print("brancher ocr et script histogramme ici")
                # import cv2
                # import numpy as np 
                # inputFile.seek(0)
                # im= cv2.imread(uri + '\\' + str(self.request.POST['resumableFilename']))
                # arr = np.fromfile(self.request.POST['file'].file, dtype=int)
                # print(arr)
                # print(self.request.POST['file'].file)
                # print(type(self.request.POST['file'].file))
                # i = cv2.imdecode(arr, cv2.IMREAD_COLOR)
                # with open(self.request.POST['file'].file,'rb') as testfile:
                #     print('type :',type(testfile))
                # print("before ocr :",time.time() - start )

                toto = OCR_parser(uri + '\\' + str(self.request.POST['resumableFilename']))

                # print("after ocr :",time.time() - start )

                    
                # print("ocr result",toto)
                try:
                    # print("before insert photo sql :",time.time() - start )
                    AddPhotoOnSQL(
                        fk_sensor, str(uri),
                        str(self.request.POST['resumableFilename']),
                        str(extType[len(extType) - 1]),
                        datePhoto,str(self.request.POST['startDate']),
                        str(self.request.POST['endDate']),
                        user,
                        cmdMetaDataInfo
                    )
                    # print("after insert photo sql :",time.time() - start )
                    # print("before insert call exif :",time.time() - start )
                    # callExiv2(
                    #     self = self,
                    #     cmd = cmdMetaDataInfo,
                    #     listFiles = [str(uri)+'\\'+str(self.request.POST['resumableFilename'])]
                    #     )
                    # resExif = mySubExif.get_metadata_batch(uri + '\\' + str(self.request.POST['resumableFilename']))
                    resExif = ''
                    exiftoolStart = time.time()
                   
                    try:
                        sourceFile = str(uri)+'\\'+str(self.request.POST['resumableFilename'])
                        # strParams = " ".join(cmdMetaDataInfo)
                        # test = ['-Title=CA MARCHE TOUJOURS', '-Rating=5']
                        # print('metadata',test)
                        # test.append(sourceFile)

                        cmdMetaDataInfo.append(sourceFile)
                        # pCmd = test
                        # print('cmd',pCmd)
                        # print('%s' %sour)


                        params = map(fsencode , cmdMetaDataInfo)
                        # params = map(fsencode, [ '-Title=CA MARCHE TOUJOURS', '-Rating=5',  '%s' % sourceFile])


                        # callExiv2(
                        # self = self,
                        # cmd = ['-Title=SUPER CA MARCHE '],
                        # listFiles = [str(uri)+'\\'+str(self.request.POST['resumableFilename'])]
                        # )

                        # print("path ", sourceFile)
                        # print('params' , params)
                        resExif = mySubExif.execute( *params )
                        # print("exif cost :", time.time() - exiftoolStart )

                        # resExif = mySubExif.get_metadata(sourceFile)
                    except Exception as e:
                        print_exc()
                        print("ERROR",e)
                        raise e

                    # print("res Exif for"+str(self.request.POST['resumableFilename'])+"",resExif)
                    # print("after call exif :",time.time() - start )
                    if os.path.exists(os.path.join(str(uri),str(self.request.POST['resumableFilename'])+'_original')):
                        os.remove(os.path.join(str(uri),str(self.request.POST['resumableFilename'])+'_original'))
                    resizePhoto(str(uri) + "\\" +
                                str(self.request.POST['resumableFilename']))
                    messageDate = "ok"
                except Exception as e:
                    flagError = True
                    os.remove(uri + '\\' + str(self.request.POST['resumableFilename']))
                    messageDate = 'something goes wrong when insert in database'
            else:
                os.remove(uri + '\\' + str(self.request.POST['resumableFilename']))
                flagDate = True
                # messageDate = 'Date not valid (' + str(datePhoto) + ') <BR>'
                messageDate = 'Date not valid'
        else:
            if not os.path.isfile(pathPrefix + '\\' + pathPost + '\\' + str(self.request.POST['resumableIdentifier'])):
                # calculate the position of cursor
                position = int(self.request.POST['resumableChunkNumber'])
                # write in the file
                with open(uri + '\\' + str(self.request.POST['resumableIdentifier']) + "_" + str(position), 'wb') as output_file:
                    shutil.copyfileobj(inputFile, output_file)
                output_file.close()

        if(flagDate or flagError):
            self.request.response.status_code = 415
            self.request.response.text = messageDate
        else:
            self.request.response.status_code = 200
            self.request.response.text = 'ok'
        
        stop = time.time() - start
        print('ellapsed time : ', stop)
        return self.request.response

    def concatChunk(self):
        flagSuppression = False
        res = {}
        message = ""
        timeConcat = ""
        messageConcat = ""
        messageUnzip = ""
        nbInZip = 0
        nbInserted = 0
        pathPrefix = dbConfig['camTrap']['path']
        self.request.response.status_code = 200
        self.request.response.text = 'ok'
        # create folder
        if(int(self.request.POST['action']) == 0):
            pathPost = str(self.request.POST['path'])
            if not os.path.exists(pathPrefix + '\\' + pathPost):
                os.makedirs(pathPrefix + '\\' + pathPost)
                self.request.response.status_code = 200
            if not os.path.exists(pathPrefix + '\\' + pathPost + '\\thumbnails\\'):
                os.makedirs(pathPrefix + '\\' + pathPost + '\\thumbnails\\')
                self.request.response.status_code = 200
        return self.request.response
        ''' no more zip file upload but i keep it in case of '''
        # else:
        #     # print(" il faut que la date de l'exif soit entre le " +
        #     #       str(request.POST['startDate']) + " et le " + str(request.POST['endDate']))
        #     pathPost = str(self.request.POST['path'])
        #     fk_sensor = int(self.request.POST['id'])
        #     name = str(self.request.POST['file'])
        #     debutTime = time.time()
        #     # print("name " + str(name))
        #     # print("on veut reconstruire le fichier" + str(name) + " qui se trouve dans " +
        #     #       str(request.POST['path']) + " en :" + str(request.POST['taille']) + " fichiers")

        #     txtConcat = str(name).split('.')
        #     # print("avant text")
        #     if not os.path.isfile(pathPrefix + '\\' + pathPost + '\\' + str(txtConcat[0]) + str('.txt')):
        #         with open(pathPrefix + '\\' + pathPost + '\\' + str(txtConcat[0]) + str('.txt'), 'a') as socketConcat:
        #             # print("fichier socket ok")
        #             # print("%s\n%s\n" % (str(request.POST['taille']), str('0')))
        #             socketConcat.write("%s\n%s\n" % (self.request.POST['taille'], 0))
        #             # si le fichier n'existe pas on va le reconstruire
        #             if not os.path.isfile(pathPrefix + '\\' + pathPost + '\\' + str(name)):
        #                 # on ouvre le fichier comme destination
        #                 with open(pathPrefix + '\\' + pathPost + '\\' + str(name), 'wb') as destination:
        #                     # on va parcourir l'ensemble des chunks
        #                     for i in range(1, int(self.request.POST['taille']) + 1):
        #                         # si le chunk est present
        #                         if os.path.isfile(pathPrefix + '\\' + pathPost + '\\' + str(self.request.POST['name']) + '_' + str(i)):
        #                             shutil.copyfileobj(open(pathPrefix + '\\' + pathPost + '\\' + str(
        #                                 self.request.POST['name']) + '_' + str(i), 'rb'), destination)  # on le concat dans desitnation
        #                             socketConcat.write("%s\n" % (i))
        #                             socketConcat.flush()
        #                             if (i == 30):
        #                                 with open(pathPrefix + '\\' + pathPost + '\\' + str(txtConcat[0]) + str('.txt'), 'r') as testConcat:
        #                                     first = testConcat.readline()
        #                                     for last in testConcat:
        #                                         avantDer = last
        #                                 testConcat.close()
        #                         else:  # si il n'est pas present
        #                             flagSuppression = True
        #                             self.request.response.status_code = 510
        #                             message = "Chunk file number : '" + \
        #                                 str(i) + "' missing try to reupload the file '" + \
        #                                 str(self.request.POST['file']) + "'"
        #                             break  # break the for
        #                 destination.close()
        #             else:
        #                 self.request.response.status_code = 510
        #                 message = "File : '" + \
        #                     str(name) + "' is already on the server <BR>"
        #             if (flagSuppression):
        #                 # supprime le fichier destination et on force la sortie
        #                 os.remove(pathPrefix + '\\' + pathPost + '\\' + str(name))
        #             else:
        #                 socketConcat.close()
        #                 os.remove(pathPrefix + '\\' + pathPost + '\\' +
        #                           str(txtConcat[0]) + str('.txt'))
        #                 # on va parcourir l'ensemble des chunks
        #                 for i in range(1, int(self.request.POST['taille']) + 1):
        #                     os.remove(pathPrefix + '\\' + pathPost + '\\' +
        #                               str(self.request.POST['name']) + '_' + str(i))
        #         socketConcat.close()

        #     # destination.close()
        #     finTime = time.time()
        #     timeConcat = str(finTime - debutTime)
        #     # print("durée :" + timeConcat)
        #     # file concat ok now unzip
        #     if(message == ""):
        #         if(self.request.POST['type'] == "application/x-zip-compressed"):
        #             debutTime = time.time()
        #             # print(" on commence la décompression ")
        #             messageUnzip, nbInZip, nbInserted = unzip(pathPrefix + '\\' + pathPost + '\\' + str(
        #                 name), pathPrefix + '\\' + pathPost + '\\', fk_sensor, str(self.request.POST['startDate']), str(self.request.POST['endDate']))
        #             # print(messageUnzip)
        #             if(messageUnzip != ""):
        #                 self.request.response.status_code = 510
        #             # print("fin decompression ")
        #             finTime = time.time()
        #             # print("durée :" + str(finTime - debutTime))
        #         else:
        #             extType = self.request.POST['file'].split('.')
        #             destfolder = pathPrefix + '\\' + pathPost + '\\'
        #             # datePhoto = dateFromExif(destfolder + str(name))
        #             exifDate = dateFromExif(destfolder + str(name))
        #             dateOrigine = datetime.datetime.strptime(str(exifDate) , "%Y-%m-%d %H:%M:%S")
        #             dateDecall = dateOrigine + datetime.timedelta(hours = operator*int(jetLagArray[0]) , minutes = operator*int(jetLagArray[1]), seconds = operator*int(jetLagArray[2]) )
        #             datePhoto = dateDecall.strftime("%Y-%m-%d %H:%M:%S")
        #             if(checkDate(datePhoto, jetLag, str(self.request.POST['startDate']), str(self.request.POST['endDate']))):
        #                 AddPhotoOnSQL(fk_sensor, destfolder, name, str(
        #                     extType[len(extType) - 1]), datePhoto)
        #                 resizePhoto(str(destfolder) + str(name))
        #             else:
        #                 os.remove(destfolder + str(name))
        #                 # flagDate = True
        #                 self.request.response.status_code = 510
        #                 messageConcat = 'Date not valid (' + \
        #                     str(datePhoto) + ') <BR>'

        #             #AddPhotoOnSQL(fk_sensor,destfolder,name, str(extType[len(extType)-1]) , dateFromExif (destfolder+str(name)))
        # # os.remove(pathPrefix+'\\'+pathPost+'\\'+str(txtConcat[0])+str('.txt')) #supprime le fichier destination et on force la sortie
        # # os.remove(pathPrefix+'\\'+pathPost+'\\'+str(name)) #supprime le fichier
        # # destination et on force la sortie
        # res = {
        #     'message': message,
        #     'messageConcat': messageConcat,
        #     'messageUnzip': messageUnzip,
        #     'timeConcat': timeConcat,
        #     'nbInZip': nbInZip,
        #     'nbInserted': nbInserted
        # }
        # return res

    def checkChunk(self):
        pathPrefix = dbConfig['camTrap']['path']
        self.request.params.get('criteria', None)
        # fileName = str(self.request.params.get('resumableIdentifier'))+"_"+str(self.request.params.get('resumableChunkNumber'))
        fileName = str(self.request.params.get('resumableFilename'))
        if not os.path.isfile(pathPrefix + '\\' + self.request.params.get('path') + '\\' + str(fileName)):
            self.request.response.status_code = 204
        else:
            '''TODO need to make hash func and store in DB for unicity '''
            self.request.response.status_code = 200
            self.request.response.text = 'exist'
            # # possible pb prog para ne pas uploader le meme fichier depuis 2 pc different
            # # vefif la taille du fichier et on supprime le chunk si elle différe
            # print("present but check size")
            # sizeOnServer = int(os.path.getsize(
            #     pathPrefix + '\\' + self.request.params.get('path') + '\\' + str(fileName)))
            # sizeExpected = int(self.request.params.get('resumableCurrentChunkSize'))
            # if sizeOnServer != sizeExpected:
            #     os.remove(pathPrefix + '\\' +
            #               self.request.params['path'] + '\\' + str(fileName))
            #     self.request.response.status_code = 204
            # else:
            #     self.request.response.status_code = 200
        return self.request.response

    def auto_validation(self):
        # global graphDataDate
        if self.type_ == 'camtrap':
            return self.validateCamTrap()

        param = self.request.params.mixed()
        freq = param['frequency']
        listToValidate = json.loads(param['toValidate'])
        user = self.request.authenticated_userid['iss']

        if freq == 'all':
            freq = 1

        Total_nb_insert = 0
        Total_exist = 0
        Total_error = 0

        if listToValidate == 'all':
            Total_nb_insert, Total_exist, Total_error = self.auto_validate_ALL_stored_procGSM_Argos(
                user, self.type_, freq)
        else:
            if self.type_ == 'rfid':
                for row in listToValidate:
                    equipID = row['equipID']
                    sensor = row['FK_Sensor']
                    if equipID == 'null' or equipID is None:
                        equipID = None
                    else:
                        equipID = int(equipID)
                    nb_insert, exist, error = self.auto_validate_proc_stocRfid(
                        equipID, sensor, freq, user)
                    self.session.commit()
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

                    nb_insert, exist, error = self.auto_validate_stored_procGSM_Argos(
                        ptt, ind_id, user, self.type_, freq)
                    self.session.commit()

                    Total_exist += exist
                    Total_nb_insert += nb_insert
                    Total_error += error

        # graphDataDate['pendingSensorData'] = None
        # graphDataDate['indivLocationData'] = None
        return {'inserted': Total_nb_insert, 'existing': Total_exist, 'errors': Total_error}

    def auto_validate_ALL_stored_procGSM_Argos(self, user, type_, freq):
        procStockDict = {
            'argos': '[sp_auto_validate_ALL_Argos_GPS]',
            'gsm': '[sp_auto_validate_ALL_GSM]',
            'rfid': '[sp_validate_ALL_rfid]'
        }

        stmt = text(""" DECLARE @nb_insert int , @exist int , @error int;
        exec """ + dbConfig['data_schema'] + """.""" + procStockDict[type_] + """ :user ,:freq , @nb_insert OUTPUT, @exist OUTPUT, @error OUTPUT;
        SELECT @nb_insert, @exist, @error; """
                    ).bindparams(bindparam('user', user), bindparam('freq', freq))
        nb_insert, exist, error = self.session.execute(stmt).fetchone()
        return nb_insert, exist, error

    def auto_validate_proc_stocRfid(self, equipID, sensor, freq, user):
        if equipID is None:
            stmt = update(DataRfidWithSite).where(and_(DataRfidWithSite.c[
                'FK_Sensor'] == sensor, DataRfidWithSite.c['equipID'] == equipID)).values(checked=1)
            self.session.execute(stmt)
            nb_insert = exist = error = 0
        else:
            stmt = text(""" DECLARE @nb_insert int , @exist int , @error int;
                exec """ + dbConfig['data_schema']
                        + """.[sp_validate_rfid]  :equipID,:freq, :user , @nb_insert OUTPUT, @exist OUTPUT, @error OUTPUT;
                SELECT @nb_insert, @exist, @error; """
                        ).bindparams(bindparam('equipID', equipID),
                                     bindparam('user', user),
                                     bindparam('freq', freq))
            nb_insert, exist, error = self.session.execute(stmt).fetchone()

        return nb_insert, exist, error

    def auto_validate_stored_procGSM_Argos(self, ptt, ind_id, user, type_, freq):
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
            self.session.execute(stmt)
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
            nb_insert, exist, error = self.session.execute(stmt).fetchone()

        return nb_insert, exist, error

    def deletePhotoOnSQL(self, fk_sensor):
        currentPhoto = self.session.query(CamTrap).get(fk_sensor)
        self.session.delete(currentPhoto)
        return True

    def validateCamTrap(self):
        # supression des photos rejete
        '''
        last step session is in last state so we build metadata 
        call stored procedure
        if ok 
        build metadata
        resize photos 
        remove photos
        '''
        data = self.request.params.mixed()
        fkMonitoredSite = data['fk_MonitoredSite']
        fkEquipmentId = data['fk_EquipmentId']
        fkSensor = data['fk_Sensor']

        query = text("""SET NOCOUNT ON; DECLARE @result int;
        EXEC [dbo].[pr_ValidateCameraTrapSession] :fkSensor, :fkMonitoredSite, :fkEquipmentId, @result OUTPUT;
        SET NOCOUNT OFF;
        """).bindparams(
            bindparam('fkSensor', value=fkSensor),
            bindparam('fkMonitoredSite', value=fkMonitoredSite),
            bindparam('fkEquipmentId', value=fkEquipmentId)
        )
        result = self.session.execute(query).fetchone()

        # self.session.commit()

        # if 'nbInserted' in result and result['nbInserted'] > 0result.rowcount > 0:
        #     query2 = text("""
        #     select path, name, validated from [ecoReleve_Sensor].[dbo].[TcameraTrap]
        #     where pk_id in (
        #     select pk_id
        #     from V_dataCamTrap_With_equipSite
        #     where
        #     fk_sensor = :fkSensor
        #     AND FK_MonitoredSite = :fkMonitoredSite
        #     AND equipID = :fkEquipmentId)""").bindparams(
        #         bindparam('fkSensor', value=fkSensor),
        #         bindparam('fkMonitoredSite', value=fkMonitoredSite),
        #         bindparam('fkEquipmentId', value=fkEquipmentId)
        #     )
        #     resultat = self.session.execute(query2).fetchall()

        # for row in result :
        #     print(row)
        # for index in data2:
        #    print (index)
        # for index in data:
        #     """if ( index['checked'] == None ):
        #         print( " la photo id :"+str(index['PK_id'])+" "+str(index['name'])+" est a check" )
        #         #changer status
        #         request.response.status_code = 510
        #         return {'message': ""+str(index['name'])+" not checked yet"}
        #     else :# photo check"""
        #     if (index['validated'] == 4):
        #         pathSplit = index['path'].split('/')
        #         destfolder = str(pathPrefix)+"\\"+str(pathSplit[1])+"\\"+str(index['name'])
        #         print (" la photo id :"+str(index['PK_id'])+" "+str(index['name'])+" est a supprimer")
        #         print("on va supprimer :" +str(destfolder))
        #         #if os.path.isfile(destfolder):
        #         #    os.remove(destfolder)
        #         #deletePhotoOnSQL(request,str(index['PK_id']))
        #     else:
        #         print (" la photo id :"+str(index['PK_id'])+" "+str(index['name'])+" est a sauvegarder")
        #             #inserer en base
        #     """for key in index:
        #         if ( str(key) =='checkedvalidated'   )
        #         print ( str(key)+":"+str(index[key]))"""
        return {'nbInserted' : result['nbInserted'] }
        # return resultat


class SensorDatas(CustomResource):

    item = SensorDatasByType
    children = [('argos', SensorDatasByType),
                ('gsm', SensorDatasByType),
                ('rfid', SensorDatasByType),
                ('camtrap', SensorDatasByType)
    ]


RootCore.children.append(('sensorDatas', SensorDatas))
