from ecoreleve_server.modules.permissions import context_permissions
from pyramid.httpexceptions import HTTPBadRequest
from ecoreleve_server.traversal.core import MetaEndPointNotREST
from sqlalchemy import func, desc
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from vincenty import vincenty
from ecoreleve_server.database.main_db import (
    Sensor,
    Individual_Location
)
from ecoreleve_server.database.sensor_db import (
    Gsm,
    GsmEngineering,
    ArgosGps,
    ArgosEngineering
)
from ecoreleve_server.dependencies import dbConfig
from ecoreleve_server.database.meta import Main_Db_Base
import io
import uuid
import os
import shutil
import subprocess
from time import sleep
import win32gui
import win32con
from win32 import win32api
import psutil
import copy



class ImportWithFileLikeCSV(MetaEndPointNotREST):
    pass
#     __acl__ = context_permissions['formbuilder']

#     def create(self):
#         filePosted = self.getFile()
#         if filePosted is not None:
#             "we got a file "
#             print(filePosted)
#             csvpandas = self.parseFile()
#         else:
#             HTTPBadRequest()
#         "haaaaaaaaaa on veut poster du gsm"

#     def getFile(self):
#         if 'file' in self.request.POST:
#             return self.request.POST['file']
#         else:
#             return None

#     def parseFile(self):
#         print("you should implement you own")
#         return None


class GSMImport(ImportWithFileLikeCSV):

    __acl__ = context_permissions['formbuilder']

    def retrieve(self):
        return 'youhouuo GSMImport'

    def create(self):
        providers = {
            'MTIg': ['DateTime', 'Latitude_N', 'Longitude_E', 'Speed', 'Course', 'Altitude_m', 'HDOP', 'VDOP', 'SatelliteCount', 'ShowInKML'],
            'MTIe': ['DateTime','Temperature_C','BatteryVoltage_V','ActivityCount'],
            'Eobs': ['event-id','visible','timestamp','location-long','location-lat','bar:barometric-pressure','data-decoding-software','eobs:activity','eobs:activity-samples','eobs:battery-voltage','eobs:fix-battery-voltage','eobs:horizontal-accuracy-estimate','eobs:key-bin-checksum','eobs:speed-accuracy-estimate','eobs:start-timestamp','eobs:status','eobs:temperature','eobs:type-of-fix','eobs:used-time-to-get-fix','gps:dop','gps:satellite-count','ground-speed','heading','height-above-ellipsoid','import-marked-outlier','mag:magnetic-field-raw-x','mag:magnetic-field-raw-y','mag:magnetic-field-raw-z','quaternion-raw-w','quaternion-raw-x','quaternion-raw-y','quaternion-raw-z','sensor-type','individual-taxon-canonical-name','tag-local-identifier','individual-local-identifier','study-name'],
            'Ornitela':['event-id','visible','timestamp','location-long','location-lat','acceleration-raw-x','acceleration-raw-y','acceleration-raw-z','bar:barometric-height','battery-charge-percent','battery-charging-current','external-temperature','gps:hdop','gps:satellite-count','gps-time-to-fix','ground-speed','heading','height-above-msl','import-marked-outlier','gls:light-level','mag:magnetic-field-raw-x','mag:magnetic-field-raw-y','mag:magnetic-field-raw-z','orn:transmission-protocol','tag-voltage','sensor-type','individual-taxon-canonical-name','tag-local-identifier','individual-local-identifier','study-name']
        }

        variables = {
            'DateTime': ['DateTime','Date Time','Date/Time','Tx Date/Time','timestamp'],
            'Latitude_N': ['Latitude_N','Lat1(N)','Latitude(N)','location-lat'],
            'Longitude_E': ['Longitude_E','Lon1(E)','Longitude(E)','location-long'],
            'Speed': ['Speed','ground-speed'],
            'Course': ['Course'],
            'Altitude_m': ['Altitude_m','Altitude(m)','height-above-ellipsoid','height-above-msl'],
            'HDOP': ['HDOP','gps:hdop'],
            'VDOP': ['VDOP'],
            'SatelliteCount': ['SatelliteCount','Satellite Count','gps:satellite-count'],
            'ShowInKML': ['ShowInKML'],
            'Temperature_C': ['Temperature_C','eobs:temperature','external-temperature'],
            'BatteryVoltage_V': ['BatteryVoltage_V','eobs:battery-voltage','tag-voltage'],
            'ActivityCount': ['ActivityCount','eobs:activity'],
            'type': ['sensor-type'],
            'platform_': ['tag-local-identifier'],
            'individual_ID': ['individual-local-identifier']
        }
        first_time = datetime.now() # juste pour avoir temps d'exécution
        curSession = self.request.dbsession
        #filePosted = self.getFile()
        # if filePosted is not None:
        # name = filePosted.filename
        # path = filePosted.file
        #multifile self.__request__.POST['file']
        finalReport = []
        report = {
            'dataprovider':'',
            'file': '',
            'tagID':'',
            'SentDatafile': '',
            'SentDataPertag':'',
            'AlreadyImportedData': 0,
            'GeoOutliers': 0,
            'PastOutliers': 0,
            'Duplicates': 0,
            'DataInsertedInSensorDB': 0,
            'TestAnnotated': 0,
            'FutureAnnotated': 0,
        }
        reportWrongProvider = {
            'ChosenDataProvider': '',
            'SuggestedDataProvider': '',
            'file': ''
        }
        for item in self.request.POST._items:
            if item is not None:
                if item[0] == 'provider':
                    report['dataprovider'] = item[1]
                else:
                    print(item)
                    name = item[1].filename
                    report['file'] = name
                    path = item[1].file
                    # File type management
                    if type(item[1].file) is io.BytesIO:
                        data = repr( self.request.POST._items[0][1].file.getvalue().decode('latin1') )
                        data = data[1:-1]
                        rawData = pd.DataFrame( [ line.split('\\t') for line in data.split('\\r\\n') ])
                        headers = rawData.iloc[0]
                        rawData = rawData[1:-1]
                        rawData = rawData.rename(columns = headers)
                    else:
                        rawData = self.readData(report, path)
                    # Get tag identifier depending on provider
                    if report['dataprovider'] == 'MTI':
                        datefile = name[10:20]
                        identifier = name[0:8]
                        report['tagID'] = identifier[-3:]
                        sentData = len(rawData)
                        report['SentDatafile'] = sentData
                        report['SentDataPertag'] = sentData
                        # Get file data type - locations or engineering
                        if name[8] == 'g':
                            dataType = 'locations'
                            report['dataprovider'] = report['dataprovider'] + 'g'
                        elif name[8] == 'e':
                            dataType = 'engineering'
                            report['dataprovider'] = report['dataprovider'] + 'e'
                        # Get Standardized columns as the ones in database
                        rawData, SuggestedDataProvider = self.getStandardizedColumns(rawData,report, variables, providers, path)
                        # if len(columns) == 0:
                        if SuggestedDataProvider is not None:
                            reportWrongProvider['ChosenDataProvider'] = report['dataprovider']
                            reportWrongProvider['SuggestedDataProvider'] = SuggestedDataProvider
                            reportWrongProvider['file'] = report['file']
                            finalReport.append(copy.deepcopy(reportWrongProvider)) # Wrong provider
                            print(finalReport)
                            self.request.response.status_code = 409
                        else:
                            datefile = datetime.strptime(datefile,'%Y-%m-%d')
                            file_date = (datefile+timedelta(hours=23,minutes=59,seconds=59)).strftime('%Y-%m-%dT%H:%M:%S')
                            rawData.insert(len(rawData.columns),'file_date',file_date)
                            rawData.insert(len(rawData.columns),'platform_',identifier[-3:])
                            if dataType == 'engineering':
                                rawData = rawData.drop(['PK_id'],axis = 1)
                                finalReport = self.engineeringDataManagement(rawData,identifier, finalReport,report,curSession)
                                print(finalReport)
                                continue
                            if dataType == 'locations':
                                print(rawData)
                                rawData.insert(len(rawData.columns),'Quality_On_Speed','')
                                rawData.insert(len(rawData.columns),'Quality_On_Metadata','')
                                rawData.insert(len(rawData.columns),'Status','ok')
                                sensor = curSession.query(Sensor).filter(Sensor.UnicIdentifier == str(int(identifier))).first()
                                if sensor is None:
                                    rawData['Status'] = 'exotic'
                                    print('No matching sensor found in database')
                                    # on les insère quand même dans la base
                                    sensorCreationDate = None
                                else:
                                    sensorCreationDate = sensor.creationDate
                                newdataDf, report, dataForSpeed, deployementDate = self.newLocationsManagement(rawData, report, curSession, identifier, sensor, file_date)
                                if len(newdataDf) == 0:
                                    print('deso deja importées dans Sensor')
                                    report['AlreadyImportedData'] = sentData
                                    print(report)
                                    finalReport.append(copy.deepcopy(report))
                                    print(finalReport)
                                    continue
                                else:
                                    report['AlreadyImportedData'] = sentData - len(newdataDf)
                                    finalDataset, report = self.dataAnnotation(newdataDf, report, sensorCreationDate, deployementDate, dataForSpeed, finalReport)
                                    finalDataset.to_sql(Gsm.__tablename__, curSession.get_bind(Gsm), schema = dbConfig['sensor_schema'], if_exists='append', index=False)
                                    lasttime = datetime.now()
                                    diftime = lasttime - first_time
                                    print(diftime)
                                    print('diftime')
                                    print(report)
                                    finalReport.append(copy.deepcopy(report))
                                    print(finalReport)
                                    continue
                    if report['dataprovider'] == 'Eobs'or report['dataprovider'] == 'Ornitela':
                        # Get Standardized columns as the ones in database
                        rawData, SuggestedDataProvider = self.getStandardizedColumns(rawData,report, variables, providers, path)
                        # if len(columns) == 0:
                        if SuggestedDataProvider is not None:
                            reportWrongProvider['ChosenDataProvider'] = report['dataprovider']
                            reportWrongProvider['SuggestedDataProvider'] = SuggestedDataProvider
                            reportWrongProvider['file'] = report['file']
                            finalReport.append(copy.deepcopy(reportWrongProvider)) # Wrong provider
                            self.request.response.status_code = 409
                        else:
                            file_date = None
                            rawData.insert(len(rawData.columns),'file_date',file_date)
                            rawData.insert(len(rawData.columns),'Quality_On_Speed','')
                            rawData.insert(len(rawData.columns),'Quality_On_Metadata','')
                            rawData.insert(len(rawData.columns),'Status','ok')
                            identifiers = rawData.platform_.unique() # to get all identifiers of the file
                            print(identifiers)
                            idList = []
                            sentDatatagList = []
                            for iden in identifiers :
                                sentData = len(rawData)
                                report['SentDatafile'] = sentData
                                rawDatatag = rawData.loc[rawData['platform_'] == iden].copy()
                                sentDatatag = len(rawDatatag)
                                sentDatatagList.append(sentDatatag)
                                report['SentDataPertag'] = sentDatatagList
                                identifier = iden
                                idList.append(identifier)
                                report['tagID'] = idList
                                sensor = curSession.query(Sensor).filter(Sensor.UnicIdentifier == str(int(identifier))).first()
                                if sensor is None:
                                    rawDatatag['Status'] = 'Exotic'
                                    dataForQuality = rawDatatag.copy()
                                    sensorCreationDate = None
                                else:
                                    sensorCreationDate = sensor.creationDate
                                    newdataDf, report, dataForSpeed, deployementDate = self.newLocationsManagement(rawDatatag, report, curSession, identifier, sensor, file_date)
                                    if len(newdataDf) == 0:
                                        print('deso deja importées dans Sensor')
                                        report['AlreadyImportedData'] = report['AlreadyImportedData'] + sentDatatag
                                        print(report)
                                        # finalReport.append(copy.deepcopy(report))
                                        # print(finalReport)
                                        continue
                                    else:
                                        finalDataset, report = self.dataAnnotation(newdataDf, report, sensorCreationDate, deployementDate, dataForSpeed, finalReport)
                                        # engineering data management
                                        engineeringDf = finalDataset[['DateTime','Temperature_C','BatteryVoltage_V','ActivityCount','platform_','file_date']].copy()
                                        finalReport = self.engineeringDataManagement(engineeringDf ,identifier, finalReport, report, curSession)
                                        finalLocations = finalDataset[['DateTime','platform_','Latitude_N','Longitude_E','Speed','Course','Altitude_m','HDOP','VDOP','SatelliteCount','file_date','Status','Quality_On_Speed','Quality_On_Metadata']].copy()
                                        finalLocations.to_sql(Gsm.__tablename__, curSession.get_bind(Gsm), schema = dbConfig['sensor_schema'], if_exists='append', index=False)
                                        print(report)
                            finalReport.append(copy.deepcopy(report))
                            print(finalReport)
                            continue
        return finalReport

    def readData(self, report, path):
        if report['dataprovider'] == 'MTI':
            rawData = pd.read_csv(path, sep='\t', dtype=str)
        if report['dataprovider'] == 'Eobs' or report['dataprovider'] == 'Ornitela':
            rawData = pd.read_csv(path, sep=',', dtype=str)
            print('rawData')
        return rawData

    def findProvider(self,rawData, providers, path, report):
        providerCol = list(rawData)
        if len(providerCol) == 1:
            if report['dataprovider'] == 'MTI':
                providerCol = providerCol[0].split(',')
            if report['dataprovider'] == 'Eobs' or report['dataprovider'] == 'Ornitela':
                providerCol = providerCol[0].split('\t')
        SuggestedDataProvider = 'No registered provider is matching'
        for p in providers:
            if providers[p] == providerCol:
                SuggestedDataProvider = p
        return SuggestedDataProvider

    def getStandardizedColumns(self, rawData, report, variables, providers, path):
        columns = []
        columns = list(rawData.columns)
        if report['dataprovider'] in providers :
            if len(providers[report['dataprovider']]) == len(columns):
                if providers[report['dataprovider']] == columns:
                    for col in providers[report['dataprovider']]:
                        for item in variables:
                            if col in variables.get(item):
                                rawData.rename(columns={col:item}, inplace=True)
                                [item if x==col else x for x in columns]
                    rawData['DateTime'] = rawData['DateTime'].str.replace(" ","T")
                    rawData['DateTime'] = pd.to_datetime(rawData['DateTime']).dt.strftime('%Y-%m-%dT%H:%M:%S')
                    rawData = rawData.sort_values(by='DateTime',ascending=True)
                    rawData = rawData.replace({'':None})
                    rawData.insert(0, 'PK_id', range(0, 0 + len(rawData)))
                    if report['dataprovider'] == 'Eobs':
                        rawData.insert(len(rawData.columns),'HDOP',None)
                        rawData.insert(len(rawData.columns),'VDOP',None)
                        rawData.insert(len(rawData.columns),'Course',None)
                    if report['dataprovider'] == 'Ornitela':
                        rawData.insert(len(rawData.columns),'VDOP',None)
                        rawData.insert(len(rawData.columns),'Course',None)
                        rawData.insert(len(rawData.columns),'ActivityCount',None)
                    SuggestedDataProvider = None
                    return rawData, SuggestedDataProvider
                else :
                    SuggestedDataProvider = self.findProvider(rawData, providers, path, report)
                    print("wrong provider was selected")
                    return rawData, SuggestedDataProvider
            else :
                SuggestedDataProvider = self.findProvider(rawData, providers, path, report)
                print("wrong provider was selected")
                return rawData, SuggestedDataProvider
        else:
            SuggestedDataProvider = self.findProvider(rawData, providers, path, report)
            print("wrong provider was selected")
            return rawData, SuggestedDataProvider

    def engineeringDataManagement(self, engineeringData, identifier, finalReport, report, curSession):
        if report['dataprovider'] == 'MTIe':
            dataSensorQuery = curSession.query(GsmEngineering).filter(GsmEngineering.platform_==int(identifier)).order_by(desc(GsmEngineering.date))
            dataSensor = dataSensorQuery.statement.compile( compile_kwargs={"literal_binds" : True} )
            dataSensorDf = pd.read_sql_query(dataSensor,curSession.get_bind(GsmEngineering))
            engineeringData['DateTime'] = pd.to_datetime(engineeringData['DateTime']).dt.strftime('%Y-%m-%dT%H:%M:%S')
            engineeringData = engineeringData.sort_values(by='DateTime',ascending=True)
            if len(dataSensorDf) > 0:
                lastData =  dataSensorDf.loc[0]
                lastDate = lastData['DateTime'].isoformat()
                newDatatmpID = []
                for i in engineeringData.index:
                    fileDate = engineeringData.loc[i,'DateTime']
                    if fileDate > lastDate:
                        newDatatmpID.append(i)
                newData = engineeringData[engineeringData.index.isin(newDatatmpID)]
            else:
                newData = engineeringData.copy()
            report['AlreadyImportedData'] = len(engineeringData) - len(newData)
            report['DataInsertedInSensorDB'] = len(newData)
            finalReport.append(copy.deepcopy(report))
            print(finalReport)
        if report['dataprovider'] == 'Eobs' or report['dataprovider'] == 'Ornitela':
            newData = engineeringData.copy()
        # newData['BatteryVoltage_V'] = newData['BatteryVoltage_V'].astype(float)
        newData['BatteryVoltage_V'] = newData['BatteryVoltage_V'].apply(pd.to_numeric)/1000
        newData.to_sql(GsmEngineering.__tablename__, curSession.get_bind(GsmEngineering), schema = dbConfig['sensor_schema'], if_exists='append', index=False)
        return finalReport

    def futureAnnotation(self, rawData, timeDifference, file_date, report):
        ## Annotate dates in the future
        # date import
        # Date in filename at 23:59:59
        # datefile = (datefile+timedelta(hours=23,minutes=59,seconds=59)).strftime('%Y-%m-%dT%H:%M:%S')
        if report['dataprovider'] == 'MTIg':
            datefile = file_date
        if report['dataprovider'] == 'Eobs' or report['dataprovider'] == 'Ornitela':
            datefile = (datetime.now()+timedelta(hours=timeDifference)).strftime('%Y-%m-%dT%H:%M:%S')
        countFuture = 0
        for i in rawData.index:
            if rawData.loc[i,'DateTime'] > datefile:
                rawData.loc[i,'Status']='Future'
        ## get FK_individual and deployment date
        for idx in reversed(rawData.index):
            if rawData.loc[idx,'Status']=='Future':
                countFuture = countFuture + 1
                pass
            else :
                maxDateData = rawData.loc[idx,'DateTime']
                break
        return maxDateData, rawData, countFuture

    def IndividualID_deployementDate(self, sensor, curSession, maxDateData, futureAnnotated):
        equipmentView = Main_Db_Base.metadata.tables['IndividualEquipment']
        Sessions = []
        if sensor.ID:
            equipment = curSession.query(equipmentView).filter(equipmentView.columns.FK_Sensor == sensor.ID).all()
            # if no equipment
            if equipment is None:
                futureAnnotated['Status'] = 'No information'
                deploymentDateobj = None
            else:
                for session in equipment:
                    Sessions.append({
                        'individualID': session.FK_Individual,
                        'startDate': session.StartDate,
                        'endDate': session.EndDate
                    })
                for item in Sessions:
                    item['startDate'] = item['startDate'].isoformat()
                    if item['endDate'] is not None :
                        item['endDate'] = item['endDate'].isoformat()
                        if item['startDate'] < maxDateData < item['endDate']:
                            individualID = item['individualID']
                            deploymentDateobj = item['startDate']
                        if maxDateData > item['endDate']:
                            deploymentDateobj = None
                    else:
                        if item['startDate'] < maxDateData:
                            individualID = item['individualID']
                            deploymentDateobj = item['startDate']
                            print(deploymentDateobj)
        else:
            raise Exception("No sensor :( ")
        return deploymentDateobj, futureAnnotated

    def findNewData(self,futurAnnotated, curSession, identifier):
        # result gives all
        # dataSensorNotImported = curSession.query(Gsm).filter(Gsm.platform_==int(identifier), Gsm.imported == 0).order_by(desc(Gsm.date)).all()
        countImported = 0
        dataSensorNotImportedQuery1 = curSession.query(Gsm).filter(Gsm.platform_==int(identifier), Gsm.imported == 1).order_by(desc(Gsm.date))
        dataSensorNotImportedRes1 = dataSensorNotImportedQuery1.statement.compile( compile_kwargs={"literal_binds" : True} )
        dataSensorNotImportedDf1 = pd.read_sql_query(dataSensorNotImportedRes1,curSession.get_bind(Gsm))
        dataSensorNotImportedExoticDf = pd.DataFrame(columns = dataSensorNotImportedDf1.columns)
        if len(dataSensorNotImportedDf1) > 0:
            lastValidData =  dataSensorNotImportedDf1.loc[0] #to have dataframe output and not series
            lastValidDate = lastValidData['DateTime'].isoformat()
            dataSensorNotImportedQuery = curSession.query(Gsm).filter(Gsm.platform_==int(identifier), Gsm.imported == 0, Gsm.date > lastValidDate, Gsm.Status == 'ok').order_by(desc(Gsm.date))
            dataFutureAnnotatedQuery = curSession.query(Gsm).filter(Gsm.platform_==int(identifier), Gsm.imported == 0, Gsm.date > lastValidDate, Gsm.Status == 'Future').order_by(desc(Gsm.date))
        else:
            dataSensorNotImportedExoticQuery = curSession.query(Gsm).filter(Gsm.platform_==int(identifier), Gsm.imported == 0, Gsm.Status == 'exotic').order_by(desc(Gsm.date))
            dataSensorNotImportedExoticRes = dataSensorNotImportedExoticQuery.statement.compile( compile_kwargs={"literal_binds" : True} )
            dataSensorNotImportedExoticDf = pd.read_sql_query(dataSensorNotImportedExoticRes,curSession.get_bind(Gsm))
            dataSensorNotImportedQuery = curSession.query(Gsm).filter(Gsm.platform_==int(identifier), Gsm.imported == 0, Gsm.Status == 'ok').order_by(desc(Gsm.date))
            dataFutureAnnotatedQuery = curSession.query(Gsm).filter(Gsm.platform_==int(identifier), Gsm.imported == 0, Gsm.Status == 'Future').order_by(desc(Gsm.date))
        if len(dataSensorNotImportedExoticDf) > 0:
            dataSensorNotImportedDf = dataSensorNotImportedExoticDf.copy()
        else:
            dataSensorNotImportedRes = dataSensorNotImportedQuery.statement.compile( compile_kwargs={"literal_binds" : True} )
            dataSensorNotImportedDf = pd.read_sql_query(dataSensorNotImportedRes,curSession.get_bind(Gsm))
        dataFutureAnnotatedRes = dataFutureAnnotatedQuery.statement.compile( compile_kwargs={"literal_binds" : True} )
        dataFutureAnnotatedDf = pd.read_sql_query(dataFutureAnnotatedRes,curSession.get_bind(Gsm))
        dataFutureAnnotatedDf['DateTime'] = pd.to_datetime(dataFutureAnnotatedDf['DateTime']).dt.strftime('%Y-%m-%dT%H:%M:%S')
        # à modifier
        # individualLocation = curSession.query(Individual_Location).filter(Individual_Location.FK_Individual == int(individualID),Individual_Location.FK_Sensor == sensor.ID).order_by(desc(Individual_Location.Date)).first()
        listOldID = []
        # list from file
        listForSpeedtmpID = []
        newDatatmpID = []
        if len(dataSensorNotImportedDf) > 0:
            lastDataNotImported = dataSensorNotImportedDf.loc[0]
            lastDataNotImportedDate = lastDataNotImported['DateTime'].isoformat()
            # firstDataNotImportedDate = dataSensorNotImportedDf.loc[len(dataSensorNotImportedDf)-1,'DateTime'].isoformat()
            if len(dataSensorNotImportedDf1) > 0:
                # lastDataImported = individualLocation[0] # à modifier
                # lastDataImportedDate = lastDataImported.Date.isoformat()
                # Case : some data have already been imported in EcoReleveData but not all
                for i in futurAnnotated.index:
                    fileDate = futurAnnotated.loc[i,'DateTime']
                    # To find data already validated and so that doesn't need to be imported
                    if fileDate < lastValidDate :
                        listOldID.append(i)
                    # To select data (from file) that haven't been validated by being imported in EcoReleveData
                    elif fileDate > lastDataNotImportedDate:
                        newDatatmpID.append(i)
                    else:
                        countImported = countImported + 1
                newData = futurAnnotated[futurAnnotated.index.isin(newDatatmpID)]
                    # to select newdata that are neither in EcoReleveData nor in Sensor + to get not imported data from sensor database if they weren't in file
                # Means that none of not imported data are in the current file
                dataForSpeed = dataSensorNotImportedDf.loc[~dataSensorNotImportedDf['checked']==1].copy()
                dataForSpeed = dataForSpeed.drop(['checked','imported','validated','FK_Import','Data_Quality','Fk_individual_location'],axis = 1)
                dataForSpeed['DateTime'] = pd.to_datetime(dataForSpeed['DateTime']).dt.strftime('%Y-%m-%dT%H:%M:%S')
                dataForSpeed = dataForSpeed.sort_values(by='DateTime',ascending=True) # Attention, peut-être vérifier que la dernière donnée (qui correspond à la première dans le temps) soit bien valide et corresponde au release
            else:
                # Case : No data has been imported in EcoReleveData but some are in sensor database
                for i in futurAnnotated.index:
                    fileDate = futurAnnotated.loc[i,'DateTime']
                    if fileDate > lastDataNotImportedDate:
                        newDatatmpID.append(i)
                newData = futurAnnotated[futurAnnotated.index.isin(newDatatmpID)]
                dataForSpeed = dataSensorNotImportedDf.loc[~dataSensorNotImportedDf['checked']==1].copy()
                dataForSpeed = dataForSpeed.drop(['checked','imported','validated','FK_Import','Data_Quality','Fk_individual_location'],axis = 1)
                dataForSpeed['DateTime'] = pd.to_datetime(dataForSpeed['DateTime']).dt.strftime('%Y-%m-%dT%H:%M:%S')
                dataForSpeed = dataForSpeed.sort_values(by='DateTime',ascending=True) # Attention, peut-être vérifier que la dernière donnée (qui correspond à la première dans le temps) soit bien valide et corresponde au release
        else:
            # Case: All data in sensor have been imported in EcoReleveData
            if len(dataSensorNotImportedDf1) > 0:
                # lastDataImported = individualLocation[0]
                # lastDataImportedDate = lastDataImported.Date.isoformat()
                for i in futurAnnotated.index:
                    fileDate = futurAnnotated.loc[i,'DateTime']
                    # To find data already validated and so that doesn't need to be imported
                    if fileDate < lastValidDate:
                        listOldID.append(i)
                    elif fileDate > lastValidDate:
                    #     listForSpeed = listForSpeed.append(futurAnnotated.loc[i])
                    # else:
                        newDatatmpID.append(i)
                newData = futurAnnotated[futurAnnotated.index.isin(newDatatmpID)]
                dataForSpeed = lastValidData.drop(['checked','imported','validated','FK_Import','Data_Quality','Fk_individual_location'],axis = 0)
                dataForSpeed = dataForSpeed.to_frame()
                dataForSpeed = dataForSpeed.T
                dataForSpeed['DateTime'] = pd.to_datetime(dataForSpeed['DateTime']).dt.strftime('%Y-%m-%dT%H:%M:%S')
                # dataForSpeed = dataForSpeed.sort_values(by='DateTime',ascending=True) # Attention, peut-être vérifier que la dernière donnée (qui correspond à la première dans le temps) soit bien valide et corresponde au release
            else :
                dataForSpeed = pd.DataFrame(columns = ['DateTime', 'Latitude_N', 'Longitude_E', 'Speed', 'Course', 'Altitude_m', 'HDOP', 'VDOP', 'SatelliteCount', 'ShowInKML'])
                newData = futurAnnotated.copy()
        futureDuplicates = []
        if len(dataFutureAnnotatedDf) > 0:
            newData, futureDuplicates = self.findFutureDuplicates(newData, dataFutureAnnotatedDf)
        oldData = len(listOldID) + countImported + len(futureDuplicates)
        print('newData')
        print(newData)
        return dataForSpeed, newData, oldData

    def findFutureDuplicates(self, newData, dataFutureAnnotatedDf):
        # To remove data that was annotated Future at previous import
        newData['Latitude_N'] = newData['Latitude_N'].apply(pd.to_numeric)
        newData['Longitude_E'] = newData['Longitude_E'].apply(pd.to_numeric)
        newData = newData.round({'Latitude_N':5,'Longitude_E':5})
        toConcat = [newData, dataFutureAnnotatedDf]
        newAndFutureData = pd.concat(toConcat, sort=False)
        print('newAndFutureData')
        print(newAndFutureData)
        futureDuplicates = newAndFutureData[newAndFutureData.duplicated(['DateTime','Latitude_N','Longitude_E'],keep='last')].copy()
        print('futureDuplicates')
        print(futureDuplicates)
        newData = newData.loc[(~newData['PK_id'].isin(futureDuplicates.PK_id))].copy()
        return newData, futureDuplicates

    def newLocationsManagement(self,rawData, report, curSession, identifier, sensor, datefile):
        timeDifference = 12 # parameter to verify if data in future = date > import date + time difference (depends where is the server)
        maxDateData, futurAnnotated, countFuture = self.futureAnnotation(rawData, timeDifference, datefile, report)
        report['FutureAnnotated'] = countFuture
        if sensor is not None:
            deployementDate, futurAnnotated = self.IndividualID_deployementDate(sensor, curSession, maxDateData, futurAnnotated)
        else:
            deployementDate = None
        # #Function that permits to get new data comparing with what is already in database
        dataForSpeed, newData, oldData = self.findNewData(futurAnnotated, curSession, identifier)
        report['AlreadyImportedData'] = oldData

        return newData, report, dataForSpeed, deployementDate

    def findWrongStringValues(self,value):
        try:
            test = float(value)
            return True
        except ValueError as e:
            return False


    def findGeoOutliers(self, newData):
        geoOutliers = newData.loc[((newData['Latitude_N'].isnull())|(newData['Longitude_E'].isnull()))|((abs(pd.to_numeric(newData['Latitude_N']))>90)|(abs(pd.to_numeric(newData['Longitude_E']))>180))].copy()
        geoOutliers['Status'] = 'geoimpossible'
        geoDataClean = newData.loc[(~newData['PK_id'].isin(geoOutliers.PK_id))].copy()
        # geoDataClean.astype({'Altitude_m':'int32'}, errors='ignore')
        # geoDataClean.loc[:,'Altitude_m']=geoDataClean['Altitude_m'].apply(pd.to_numeric, errors = 'ignore')
        wrongValues = geoDataClean['Altitude_m'].apply(self.findWrongStringValues) #returns True if not str
        wrongValues = wrongValues.loc[wrongValues == False].copy()
        wrongValues = wrongValues.to_frame()
        geoDataClean = geoDataClean[~geoDataClean.index.isin(wrongValues.index)].copy()
        toConcat = [geoOutliers,wrongValues]
        geoOutliers2 = pd.concat(toConcat, sort=False)
        return geoOutliers2, geoDataClean

    def findTimeOutliers(self,geoDataClean,sensorCreationDate,deploymentDateobj):
        if sensorCreationDate is None:
            pastOutliers = pd.DataFrame(columns = geoDataClean.columns)
            timeDataClean = geoDataClean.copy()
        else:
            sensorCreationDateobj = sensorCreationDate.isoformat()
            # # Recherche de potentielles dates avant la céation du sensor
            pastOutliers = geoDataClean.loc[geoDataClean['DateTime'] < sensorCreationDateobj].copy()
            pastOutliers ['Status'] = 'Past outlier'
            timeDataClean = geoDataClean.loc[(~geoDataClean['PK_id'].isin(pastOutliers.PK_id))].copy()
        countTest = 0
        # # Recherche de potentielles dates avant le déploiement
        if deploymentDateobj is not None:
            if timeDataClean['DateTime'].iloc[0] < deploymentDateobj:
                for i in timeDataClean.index:
                    if timeDataClean.loc[i,'DateTime'] >= deploymentDateobj:
                        break
                    else:
                        timeDataClean.loc[i,'Status']='test'
                        countTest = countTest + 1
        else :
            if sensorCreationDate is not None:
                timeDataClean['Status'] = 'No information'
        return timeDataClean, pastOutliers, countTest

    def findTimeDuplicates(self, timeDataClean):
        # Dataframe with duplicates with same date
        allDuplicatesDf = timeDataClean[timeDataClean.duplicated(['DateTime'],keep=False)].copy()
        allDuplicatesDf['Status']='duplicate'
        duplicateCleanData = timeDataClean.loc[(~timeDataClean['PK_id'].isin(allDuplicatesDf.PK_id))].copy()
        return allDuplicatesDf, duplicateCleanData

    def dfToListDict(self, dataframe):
        toret = []
        dataframe = dataframe.replace({np.NAN:None})
        rows = dataframe.to_dict('Index').values()
        for row in rows:
            toret.append(row)
        return  toret

    def Speed_algo(self, prefilteredData,MaxSpeed, iterationNb):
        # ici prefilteredData contient bien toutes les données jusqu'à la dernière validée (donc dans ERD) s'il y en a une
        eliminatedSpeed =[]
        pointsfiltered = []
        prefilteredData[0]['Distance'] = 0
        prefilteredData[0]['Calculated_Speed'] = 0
        i=0
        L = len(prefilteredData)
        # Recherche des points valides sur la vitesse
        while i < L-1:
            for j in range (1,L-i):
                # Calcul de la distance
                prefilteredData[i+j]['Distance'] = vincenty((float(prefilteredData[i]['Latitude_N']),float(prefilteredData[i]['Longitude_E'])),(float(prefilteredData[i+j]['Latitude_N']),float(prefilteredData[i+j]['Longitude_E'])))
                # Calcul de la durée
                diftimeS=datetime.strptime(prefilteredData[i+j]['DateTime'],'%Y-%m-%dT%H:%M:%S') - datetime.strptime(prefilteredData[i]['DateTime'],'%Y-%m-%dT%H:%M:%S')
                diftimeH=diftimeS.total_seconds()/3600
                # Calcul de la vitesse
                speed=prefilteredData[i+j]['Distance']/float(diftimeH)
                prefilteredData[i+j]['Calculated_Speed'] = speed
                # prefilteredData[i+j]['speed'] = speed
                # Comparaison à la vitesse maximale entrée en paramètre,
                # Si la vitesse est considérée aberrante on ajoute le point aux données éliminées et on l'annote dans les données brutes
                if iterationNb == 1:
                    if speed > MaxSpeed:
                        eliminatedSpeed.append(prefilteredData[i+j])
                        prefilteredData[i+j]['Quality_On_Speed']= 2
                    else:
                        prefilteredData[i+j]['Quality_On_Speed']= 1
                        i=i+j
                        break
                if iterationNb == 2:
                    if speed > MaxSpeed:
                        eliminatedSpeed.append(prefilteredData[i+j])
                        prefilteredData[i+j]['Quality_On_Speed']=prefilteredData[i+j]['Quality_On_Speed'] + 1
                    else:
                        i=i+j
                        break
        # Elimination des points dont la vitesse a été jugée aberrante
        pointsfiltered = [x for x in prefilteredData if x not in eliminatedSpeed]
        return prefilteredData, eliminatedSpeed, pointsfiltered

    def setQuality(self, speedQualityNewData,report):
        for i in speedQualityNewData.index:
            if float(speedQualityNewData.loc[i,'SatelliteCount']) >= 5:
                speedQualityNewData.loc[i,'Quality_On_Metadata']= 1
            if float(speedQualityNewData.loc[i,'SatelliteCount']) < 5 and float(speedQualityNewData.loc[i,'SatelliteCount']) >= 3:
                if report['dataprovider'] != 'Eobs':
                    if float(speedQualityNewData.loc[i,'HDOP']) <= 2:
                        speedQualityNewData.loc[i,'Quality_On_Metadata'] = 1
                    if float(speedQualityNewData.loc[i,'HDOP']) > 2:
                        speedQualityNewData.loc[i,'Quality_On_Metadata'] = 2
                else:
                    speedQualityNewData.loc[i,'Quality_On_Metadata'] = 2
            if float(speedQualityNewData.loc[i,'SatelliteCount']) < 3:
                speedQualityNewData.loc[i,'Quality_On_Metadata']= 3
            if report['dataprovider'] != 'Eobs':
                if float(speedQualityNewData.loc[i,'HDOP']) == 0:
                        speedQualityNewData.loc[i,'Quality_On_Metadata'] = 0
        return speedQualityNewData

    def convertDataset(self, qualityAnnotated,dataForAfterQuality,report):
        # Final dataset = dataset with 'quality' + 'test' and future data
        frames = [qualityAnnotated, dataForAfterQuality]
        finalDataset = pd.concat(frames)
        # finalDataset = finalDataset.drop(['distance'],axis = 1)
        if report['dataprovider'] == 'eobs':
            finalDataset = finalDataset.drop(['event-id'],axis = 1)
            finalDataset = finalDataset.drop(['visible'],axis = 1)
            finalDataset = finalDataset.drop(['bar:barometric-pressure'],axis = 1)
            finalDataset = finalDataset.drop(['data-decoding-software'],axis = 1)
            finalDataset = finalDataset.drop(['eobs:activity-samples'],axis = 1)
            finalDataset = finalDataset.drop(['eobs:activity'],axis = 1)
            finalDataset = finalDataset.drop(['eobs:battery-voltage'],axis = 1)
            finalDataset = finalDataset.drop(['eobs:fix-battery-voltage'],axis = 1)
            finalDataset = finalDataset.drop(['eobs:horizontal-accuracy-estimate'],axis = 1)
            finalDataset = finalDataset.drop(['eobs:key-bin-checksum'],axis = 1)
            finalDataset = finalDataset.drop(['eobs:speed-accuracy-estimate'],axis = 1)
            finalDataset = finalDataset.drop(['eobs:start-timestamp'],axis = 1)
            finalDataset = finalDataset.drop(['eobs:status'],axis = 1)
            finalDataset = finalDataset.drop(['eobs:temperature'],axis = 1)
            finalDataset = finalDataset.drop(['eobs:type-of-fix'],axis = 1)
            finalDataset = finalDataset.drop(['eobs:used-time-to-get-fix'],axis = 1)
            finalDataset = finalDataset.drop(['gps:dop'],axis = 1)
            finalDataset = finalDataset.drop(['import-marked-outlier'],axis = 1)
            finalDataset = finalDataset.drop(['mag:magnetic-field-raw-x'],axis = 1)
            finalDataset = finalDataset.drop(['mag:magnetic-field-raw-y'],axis = 1)
            finalDataset = finalDataset.drop(['mag:magnetic-field-raw-z'],axis = 1)
            finalDataset = finalDataset.drop(['quaternion-raw-w'],axis = 1)
            finalDataset = finalDataset.drop(['quaternion-raw-x'],axis = 1)
            finalDataset = finalDataset.drop(['quaternion-raw-y'],axis = 1)
            finalDataset = finalDataset.drop(['quaternion-raw-z'],axis = 1)
            finalDataset = finalDataset.drop(['individual-taxon-canonical-name'],axis = 1)
            finalDataset = finalDataset.drop(['study-name'],axis = 1)
            finalDataset = finalDataset.drop(['individual-local-identifier'],axis = 1)
            finalDataset = finalDataset.drop(['sensor-type'],axis = 1)
        if report['dataprovider'] == 'Ornitela':
            finalDataset = finalDataset.drop(['event-id'],axis = 1)
            finalDataset = finalDataset.drop(['visible'],axis = 1)
            finalDataset = finalDataset.drop(['acceleration-raw-x'],axis = 1)
            finalDataset = finalDataset.drop(['acceleration-raw-y'],axis = 1)
            finalDataset = finalDataset.drop(['acceleration-raw-z'],axis = 1)
            finalDataset = finalDataset.drop(['bar:barometric-height'],axis = 1)
            finalDataset = finalDataset.drop(['battery-charge-percent'],axis = 1)
            finalDataset = finalDataset.drop(['battery-charging-current'],axis = 1)
            finalDataset = finalDataset.drop(['gps-time-to-fix'],axis = 1)
            finalDataset = finalDataset.drop(['heading'],axis = 1)
            finalDataset = finalDataset.drop(['import-marked-outlier'],axis = 1)
            finalDataset = finalDataset.drop(['gls:light-level'],axis = 1)
            finalDataset = finalDataset.drop(['mag:magnetic-field-raw-x'],axis = 1)
            finalDataset = finalDataset.drop(['mag:magnetic-field-raw-y'],axis = 1)
        finalDataset = finalDataset.drop(['PK_id'],axis = 1)
        date = 'DateTime'
        finalDataset = finalDataset.sort_values(by=date,ascending=True)
        return finalDataset

    def dataAnnotation(self, newData, report, sensorCreationDate, deployementDate, dataForSpeed, finalReport):
        # #Function to remove impossible coordinates (null or abs(lat)> 90 or abs(lon)>180)
        geoOutliers, geoDataClean = self.findGeoOutliers(newData)
        report['GeoOutliers'] = len(geoOutliers)
        if len(geoOutliers)==len(newData):
            return report
        else:
            # #Function to remove and annotate data depending on date possibility : past before sensor creation, test before deployment
            timeDataClean, pastOutliers, countTest = self.findTimeOutliers(geoDataClean, sensorCreationDate, deployementDate)
            report['PastOutliers'] = len(pastOutliers)
            report['TestAnnotated'] = report['TestAnnotated'] + countTest
            # #Function that finds duplicates = data with at least exactly same timestamp
            duplicatesToDelete,duplicateCleanData = self.findTimeDuplicates(timeDataClean)
            report['Duplicates'] = report['Duplicates'] + len(duplicatesToDelete)
            # to have only ok status data for quality annotation
            dataForAfterQuality = duplicateCleanData.loc[duplicateCleanData['Status'].isin(['test','Future'])].copy()
            dataForQuality = duplicateCleanData.loc[~duplicateCleanData['Status'].isin(['test','Future'])].copy()
            if len(dataForSpeed) > 0:
                forSpeed = [dataForSpeed, dataForQuality]
                dataForSpeedComplete = pd.concat(forSpeed, sort=False)
                dataForSpeedComplete = dataForSpeedComplete.sort_values(by='DateTime',ascending=True)
                # dataForSpeed.update(self, dataForQuality, join='left', overwrite=True, filter_func=None, errors='ignore')
                # to transform dataframe into List of dict
                dataForSpeedComplete.reset_index(drop=True, inplace=True)
            else :
                dataForSpeedComplete = dataForQuality.copy()
                dataForSpeedComplete.reset_index(drop=True, inplace=True)
            prefilteredData = dataForSpeedComplete.to_dict('Index')
            # prefilteredData = self.dfToListDict(dataForSpeedComplete)
            maxSpeed1 = 15 #paramètre
            iterationNb = 1
            print('prefilteredData')
            print(prefilteredData)
            prefilteredDataAnnotated1, eliminatedSpeed1, points_filtered1=self.Speed_algo(prefilteredData,maxSpeed1,iterationNb)
            maxSpeed2 = 5
            iterationNb = 2
            prefilteredDataAnnotated2, eliminatedSpeed2, points_filtered2=self.Speed_algo(prefilteredDataAnnotated1,maxSpeed2,iterationNb)
            # Convert in good dataframe
            speedQualityAnnotatedDF = pd.DataFrame(prefilteredDataAnnotated2)
            speedQualityAnnotatedDF = speedQualityAnnotatedDF.T
            if len(dataForSpeed) > 0:
                # Remove dataForSpeed to have only newData
                speedQualityNewData = speedQualityAnnotatedDF.loc[(~speedQualityAnnotatedDF['PK_id'].isin(dataForSpeed.PK_id))].copy()
            else :
                speedQualityNewData = speedQualityAnnotatedDF.copy()
            # Condition sur le fournisseur pour la note de qualité
            qualityAnnotated = self.setQuality(speedQualityNewData, report)
            finalDataset = self.convertDataset(qualityAnnotated, dataForAfterQuality,report)
            print(finalDataset)
            report['DataInsertedInSensorDB'] = report['DataInsertedInSensorDB'] + len(finalDataset)
            print(report)
        return finalDataset, report

class ARGOSImport(ImportWithFileLikeCSV):

    __acl__ = context_permissions['formbuilder']

    def retrieve(self):
        return 'youhouuo ARGOSImport'

    def storeDIAGandDSFiles(self):
        workDir = os.path.dirname(os.path.abspath(ecoreleve_server.__package__))
        tempDir = os.path.join(workDir,
                                "ecoReleve_import",
                                "Argos",
                                "NightJob")
        if not os.path.exists(tempDir):
            os.makedirs(tempDir)

        listFile = []
        for item in self.request.POST._items:
            name = item[1].filename
            if name.lower() == 'DIAG.TXT'.lower() or name.lower() == 'DS.TXT'.lower():
                suffix  = str(uuid.uuid4())
                fileExt = name.split('.')
                pathToStore = os.path.join(tempDir,str(fileExt[0]) + str(suffix) + str('.')+str(fileExt[1]) )

                try:
                    with open(pathToStore,'wb') as curFile:
                        shutil.copyfileobj(item[1].file, curFile)
                    listFile.append(pathToStore)
                except Exception as e:
                    raise(e)
        return  listFile


    def callMTIParser(self,listFile):
        workDir = os.path.dirname(os.path.abspath(ecoreleve_server.__package__))

        con_file = os.path.join(workDir, 'init.txt')
        MTI_path = os.path.join(workDir, 'MTIwinGPS.exe')
        out_path = os.path.join(workDir,
                                "ecoReleve_import",
                                "Argos")

        if not os.path.exists(out_path):
            os.makedirs(out_path)
        try:
            os.remove(con_file)
        except:
            pass

        with open(con_file, 'w') as f:
            f.write("-eng\n")
            f.write("-argos\n")
            f.write("-title\n")
            f.write("-out\n")
            f.write(""+out_path+"\n")
            f.write("\n".join(listFile))

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
        parent = psutil.Process(pid)
        try:
            # or parent.children() for recursive=False
            for child in parent.children(recursive=True):
                child.kill()
            parent.kill()
        except:
            pass


    def create(self):
        providers = {
            'MTI_ARGOS_a': ['Date Time','Fix','Lat1(N)','Long1(E)','Lat2(N)','Long2(E)','MsgCount','Frequency','Average TI','Satellite','Max Str','Swapped'],
            'MTI_ARGOS_g':['Date/Time','Latitude(N)','Longitude(E)','Speed','Course','Altitude(m)'],
            'MTI_ARGOS_e':['Tx Date/Time','Int Date/Time','Satellite ID','Activity','Tx Count','Temperature (°C)','Battery Voltage (V)','GPS fix time','Satellite Count','Hours Since Reset','Hours since GPS fix','Season','Shunt','Mortality GT','Season GT','Latest Latitude(N)','Latest Longitude(E)']
        }

        variables = {
            'date': ['DateTime','Date Time','Date/Time'],
            'lc': ['Fix'],
            'lat': ['Latitude_N','Lat1(N)','Latitude(N)'],
            'lon': ['Longitude_E','Long1(E)','Longitude(E)'],
            'nbMsg': ['MsgCount'],
            'freq': ['Frequency'],
            'speed': ['Speed'],
            'course': ['Course'],
            'ele': ['Altitude_m','Altitude(m)'],
            'hdop': ['HDOP'],
            'iq': [],
            'nbMsg120': [],
            'bestLevel': [],
            'passDuration': [],
            'txDate': ['Tx Date/Time'],
            'pttDate': ['Int Date/Time'],
            'satId': ['Satellite ID'],
            'activity': ['Activity'],
            'txCount': ['Tx Count'],
            'temp': ['Temperature (°C)'],
            'batt': ['Battery Voltage (V)'],
            'fixTime': ['GPS fix time'],
            'satCount': ['Satellite Count'],
            'resetHours': ['Hours Since Reset'],
            'fixDays':[],
            'season': ['Season'],
            'shunt': ['Shunt'],
            'mortalityGT': ['Mortality GT'],
            'seasonalGT': ['Season GT'],
            'latestLat': ['Latest Latitude(N)'],
            'latestLon': ['Latest Longitude(E)'],
            'creationDate':[],
            'Cycle':[]
        }

        first_time = datetime.now() # juste pour avoir temps d'exécution
        curSession = self.request.dbsession
        finalReport = []
        ## on est pour l'instant supposé ne recevoir que des fichiers DIAG ou DS pour l'import SAT
        flagOK = False
        for item in self.request.POST._items:
            name = item[1].filename
            if name.lower() == 'DIAG.txt'.lower() or name.lower() == 'DS.txt'.lower():
                flagOK = True
                # self.callMTIParser()
                break

        if flagOK:
            listFile = self.storeDIAGandDSFiles()
            self.callMTIParser(listFile=listFile)


        workDir = os.path.dirname(os.path.abspath(ecoreleve_server.__package__))
        out_path = os.path.join(workDir,
                                "ecoReleve_import",
                                "Argos")

        def listFilesFromDirectory(pathDirectory):
            fileList = []
            print(f"from HERE WE LIST {pathDirectory}")
            for (dirpath, dirnames, filenames) in os.walk(pathDirectory):
                curListFiles = []
                print(f"dirpath {dirpath} pathdirectectory {pathDirectory}")
                if dirpath == pathDirectory:
                    for files in filenames:
                        if files[-5:].lower() in ['a.txt','e.txt','g.txt'] :
                            curListFiles.append(files)
                    fileList.extend(curListFiles)
            return fileList

        listFiles = listFilesFromDirectory(pathDirectory=out_path)

        print(f"{listFiles}")
        for item in listFiles:
        #     print(f"{item}")

        # return 'ok'
        # for item in self.__request__.POST._items:
            if item is not None:
                print(item)
                # if name == 'DIAG.TXT':
                #     f = open('DIAG.TXT','r')
                #     content = f.read()
                #     # renvoie dictionnaire de config "diagInfo"
                # diagInfo = {
                #     'Program':'03416'
                # }
                name = item
                path = os.path.join(out_path, name)
                # File that contains very few data is considered as BytesIO file instead of temporary file. BytesIO needs a particular decoding step

                #TODO a deplacer quand on reçoit le fichier
                # if type(item[1].file) is io.BytesIO:
                #     data = repr( self.__request__.POST._items[0][1].file.getvalue().decode('latin1') )
                #     data = data[1:-1]
                #     rawData = pd.DataFrame( [ line.split('\\t') for line in data.split('\\r\\n') ])
                #     headers = rawData.iloc[0]
                #     rawData = rawData[1:-1]
                #     rawData = rawData.rename(columns = headers)
                # else:
                rawData = pd.read_csv(path, sep='\t', dtype=str, encoding = "ISO-8859-1")
                identifier = name[0:5]
                sentData = len(rawData)
                report = {
                    'file': name,
                    'SentData': sentData,
                    'AlreadyImportedData': 0,
                    'GeoOutliers': 0,
                    'Duplicates': 0,
                    'DataInsertedInSensorDB': 0,
                    'TestAnnotated': 0,
                    'FutureAnnotated': 0,
                }
                columns = []
                if name[5] == 'g':
                    dataType = 'GPS'
                if name[5] == 'e':
                    dataType = 'engineering'
                if name[5] == 'a':
                    dataType = 'Argos'
                for col in rawData.columns:
                    columns.append(col)
                # Faire comparaison avec liste de colonnes possibles pour trouver le fournisseur
                for p in providers:
                    if providers[p] == columns:
                        dataProvider = p
                if dataProvider is not None:
                    for col in providers[dataProvider]:
                        for item in variables:
                            if col in variables.get(item):
                                rawData.rename(columns={col:item}, inplace=True)
                                [item if x==col else x for x in columns]
                    columns = rawData.columns
                else :
                    return "ce fournisseur n'est pas connu ou a changé le nom de ses colonnes"
                if dataType == 'engineering':
                    dataSensorQuery = curSession.query(ArgosEngineering).filter(ArgosEngineering.fk_ptt==int(identifier)).order_by(desc(ArgosEngineering.txDate))
                    dataSensor = dataSensorQuery.statement.compile( compile_kwargs={"literal_binds" : True} )
                    dataSensorDf = pd.read_sql_query(dataSensor,curSession.get_bind(ArgosEngineering))
                    rawData['txDate'] = pd.to_datetime(rawData['txDate']).dt.strftime('%Y-%m-%dT%H:%M:%S')
                    rawData['pttDate'] = pd.to_datetime(rawData['pttDate']).dt.strftime('%Y-%m-%dT%H:%M:%S')
                    rawData = rawData.sort_values(by='txDate',ascending=True)
                    if len(dataSensorDf) > 0:
                        lastData =  dataSensorDf.loc[0]
                        lastDate = lastData['txDate'].isoformat()
                        newDatatmpID = []
                        for i in rawData.index:
                            fileDate = rawData.loc[i,'txDate']
                            if fileDate > lastDate:
                                newDatatmpID.append(i)
                        newData = rawData[rawData.index.isin(newDatatmpID)]
                    else:
                        newData = rawData.copy()
                    newData.insert(len(newData.columns),'FK_ptt',identifier)
                    newData = newData.drop(['Hours since GPS fix'],axis = 1)
                    newData.to_sql(ArgosEngineering.__tablename__, curSession.get_bind(ArgosEngineering), schema = dbConfig['sensor_schema'], if_exists='append', index=False)
                else:
                    # #Gets database info about sensor
                    sensor = curSession.query(Sensor).filter(Sensor.UnicIdentifier == str(int(identifier))).first()
                    if sensor is None:
                        rawData.insert(len(rawData.columns),'Status','')
                        rawData['Status'] = 'exotic'
                        return 'No matching sensor found in database'
                    else:
                        sensorCreationDate = sensor.creationDate

                        # if dataType == 'GPS':
                        #     if dataProvider == 'MTI_ARGOS_g':
                        #         date = 'Date/Time'
                        # if dataType == 'Argos':
                        #     if dataProvider == 'MTI_ARGOS_a':
                        # #Dates management
                        rawData['date'] = rawData['date'].str.replace(" ","T")
                        rawData['date'] = pd.to_datetime(rawData['date']).dt.strftime('%Y-%m-%dT%H:%M:%S')
                        rawData = rawData.sort_values(by='date',ascending=True)
                        # #Dataset management
                        rawData = rawData.replace({'':np.NAN})
                        rawData.insert(0, 'PK_id', range(0, 0 + len(rawData)))
                        rawData.insert(len(rawData.columns),'type',dataType)
                        rawData.insert(len(rawData.columns),'FK_ptt',identifier)
                        rawData.insert(len(rawData.columns),'Status','ok')
                        rawData.insert(len(rawData.columns),'Quality_On_Speed','')
                        rawData.insert(len(rawData.columns),'Quality_On_Metadata','')
                        print(rawData)
                        timeDifference = 12 # parameter to verify if data in future = date > import date + time difference (depends where is the server)
                        maxDateData, futurAnnotated, countFuture = self.futureAnnotation(rawData, timeDifference)
                        report['FutureAnnotated'] = countFuture
                        individualID, deployementDate = self.IndividualID_deployementDate(sensor, curSession, maxDateData)
                        # #Function that permits to get new data comparing with what is already in database
                        dataForSpeed, newData, oldData = self.findNewData(futurAnnotated, curSession, identifier, columns, dataType)
                        report['AlreadyImportedData'] = oldData
                        if len(newData) == 0:
                            print('deso deja importées dans Sensor')
                            report['AlreadyImportedData'] = sentData
                            print(report)
                            finalReport.append(report)
                            print(finalReport)
                            continue
                        else:
                            # #Function to remove impossible coordinates (null or abs(lat)> 90 or abs(lon)>180)
                            geoOutliers, geoDataClean = self.findGeoOutliers(newData, dataType)
                            report['GeoOutliers'] = len(geoOutliers)
                            # #Function to remove and annotate data depending on date possibility : past before sensor creation, test before deployment
                            timeDataClean, pastOutliers, countTest = self.findTimeOutliers(geoDataClean, sensorCreationDate, deployementDate)
                            report['TestAnnotated'] = countTest
                            # #Function that finds duplicates = data with at least exactly same timestamp
                            duplicatesToDelete,duplicateCleanData = self.findTimeDuplicates(timeDataClean)
                            report['Duplicates'] = len(duplicatesToDelete)
                            # to have only ok status data for quality annotation
                            dataForAfterQuality = duplicateCleanData.loc[duplicateCleanData['Status'].isin(['test','Future'])].copy()
                            dataForQuality = duplicateCleanData.loc[~duplicateCleanData['Status'].isin(['test','Future'])].copy()
                            if len(dataForSpeed) > 0:
                                forSpeed = [dataForSpeed, dataForQuality]
                                dataForSpeedComplete = pd.concat(forSpeed, sort=False)
                                dataForSpeedComplete = dataForSpeedComplete.sort_values(by='date',ascending=True)
                                # dataForSpeed.update(self, dataForQuality, join='left', overwrite=True, filter_func=None, errors='ignore')
                                # to transform dataframe into List of dict
                                dataForSpeedComplete.reset_index(drop=True, inplace=True)
                            else :
                                dataForSpeedComplete = dataForQuality.copy()
                                dataForSpeedComplete.reset_index(drop=True, inplace=True)
                            prefilteredData = dataForSpeedComplete.to_dict('Index')
                            # prefilteredData = self.dfToListDict(dataForSpeedComplete)
                            maxSpeed1 = 15 #paramètre
                            iterationNb = 1
                            prefilteredDataAnnotated1, eliminatedSpeed1, points_filtered1=self.Speed_algo(prefilteredData,maxSpeed1,iterationNb)
                            maxSpeed2 = 5
                            iterationNb = 2
                            prefilteredDataAnnotated2, eliminatedSpeed2, points_filtered2=self.Speed_algo(prefilteredDataAnnotated1,maxSpeed2,iterationNb)
                            # Convert in good dataframe
                            speedQualityAnnotatedDF = pd.DataFrame(prefilteredDataAnnotated2)
                            speedQualityAnnotatedDF = speedQualityAnnotatedDF.T
                            if len(dataForSpeed) > 0:
                                # Remove dataForSpeed to have only newData
                                speedQualityNewData = speedQualityAnnotatedDF.loc[(~speedQualityAnnotatedDF['PK_id'].isin(dataForSpeed.PK_id))].copy()
                            else :
                                speedQualityNewData = speedQualityAnnotatedDF.copy()
                            # Condition sur le fournisseur pour la note de qualité
                            qualityAnnotated = self.setQuality(speedQualityNewData)
                            finalDataset = self.convertDataset(qualityAnnotated, dataForAfterQuality,identifier,individualID,dataProvider)
                            lasttime = datetime.now()
                            diftime = lasttime - first_time
                            print(finalDataset)
                            report['DataInsertedInSensorDB'] = len(finalDataset)
                            print(report)
                            finalReport.append(report)
                            print(finalReport)
                            print(diftime)
                            print('diftime')
                            finalDataset.to_sql(ArgosGps.__tablename__, curSession.get_bind(ArgosGps), schema = dbConfig['sensor_schema'], if_exists='append', index=False)
        return finalReport

    def futureAnnotation(self, rawData, timeDifference):
        ## Annotate dates in the future
        # date import
        currentDate = (datetime.now()+timedelta(hours=timeDifference)).strftime('%Y-%m-%dT%H:%M:%S')
        # Date in filename at 23:59:59
        # datefile = datetime.strptime(datefile,'%Y-%m-%d')
        # datefile = (datefile+timedelta(hours=23,minutes=59,seconds=59)).strftime('%Y-%m-%dT%H:%M:%S')
        countFuture = 0
        for i in rawData.index:
            if rawData.loc[i,'date'] > currentDate:
                rawData.loc[i,'Status']='Future'
        ## get FK_individual and deployment date
        for idx in reversed(rawData.index):
            if rawData.loc[idx,'Status']=='Future':
                countFuture = countFuture + 1
                pass
            else :
                maxDateData = rawData.loc[idx,'date']
                break
        return maxDateData, rawData, countFuture

    def IndividualID_deployementDate(self, sensor, curSession, maxDateData):
        equipmentView = Main_Db_Base.metadata.tables['IndividualEquipment']
        Sessions = []
        if sensor.ID:
            equipment = curSession.query(equipmentView).filter(equipmentView.columns.FK_Sensor == sensor.ID).all()
            for session in equipment:
                Sessions.append({
                    'individualID': session.FK_Individual,
                    'startDate': session.StartDate,
                    'endDate': session.EndDate
                })
            for item in Sessions:
                item['startDate'] = item['startDate'].isoformat()
                if item['endDate'] is not None :
                    item['endDate'] = item['endDate'].isoformat()
                    if item['startDate'] < maxDateData < item['endDate']:
                        individualID = item['individualID']
                        deploymentDateobj = item['startDate']
                else:
                    if item['startDate'] < maxDateData:
                        individualID = item['individualID']
                        deploymentDateobj = item['startDate']
        else:
            raise Exception("No sensor :( ")
        return individualID, deploymentDateobj

    def findNewData(self,futurAnnotated, curSession, identifier, columns, dataType):
        oldData = 0
        countImported = 0
        # result gives all
        # dataSensorNotImported = curSession.query(Gsm).filter(Gsm.platform_==int(identifier), Gsm.imported == 0).order_by(desc(Gsm.date)).all()
        dataSensorNotImportedQuery1 = curSession.query(ArgosGps).filter(ArgosGps.ptt==int(identifier), ArgosGps.imported == 1).order_by(desc(ArgosGps.date))
        dataSensorNotImportedRes1 = dataSensorNotImportedQuery1.statement.compile( compile_kwargs={"literal_binds" : True} )
        dataSensorNotImportedDf1 = pd.read_sql_query(dataSensorNotImportedRes1,curSession.get_bind(ArgosGps))
        if len(dataSensorNotImportedDf1) > 0:
            lastValidData =  dataSensorNotImportedDf1.loc[0] #to have dataframe output and not series
            lastValidDate = lastValidData['date'].isoformat()
            dataSensorNotImportedQuery = curSession.query(ArgosGps).filter(ArgosGps.ptt==int(identifier), ArgosGps.imported == 0, ArgosGps.checked == 0, ArgosGps.date > lastValidDate, ArgosGps.Status == 'ok').order_by(desc(ArgosGps.date))
            dataTypeSensorNotImportedQuery = curSession.query(ArgosGps).filter(ArgosGps.ptt==int(identifier), ArgosGps.imported == 0, ArgosGps.checked == 0, ArgosGps.date > lastValidDate, ArgosGps.Status == 'ok',ArgosGps.type_==dataType).order_by(desc(ArgosGps.date))
            dataFutureAnnotatedQuery = curSession.query(ArgosGps).filter(ArgosGps.ptt==int(identifier), ArgosGps.imported == 0, ArgosGps.date > lastValidDate, ArgosGps.Status == 'Future').order_by(desc(ArgosGps.date))
        else:
            dataSensorNotImportedQuery = curSession.query(ArgosGps).filter(ArgosGps.ptt==int(identifier), ArgosGps.imported == 0, ArgosGps.checked == 0, ArgosGps.Status == 'ok').order_by(desc(ArgosGps.date))
            dataTypeSensorNotImportedQuery = curSession.query(ArgosGps).filter(ArgosGps.ptt==int(identifier), ArgosGps.imported == 0, ArgosGps.checked == 0, ArgosGps.Status == 'ok',ArgosGps.type_==dataType).order_by(desc(ArgosGps.date))
            dataFutureAnnotatedQuery = curSession.query(ArgosGps).filter(ArgosGps.ptt==int(identifier), ArgosGps.imported == 0, ArgosGps.Status == 'Future').order_by(desc(ArgosGps.date))
        dataSensorNotImportedRes = dataSensorNotImportedQuery.statement.compile( compile_kwargs={"literal_binds" : True} )
        dataSensorNotImportedDf = pd.read_sql_query(dataSensorNotImportedRes,curSession.get_bind(ArgosGps))
        dataTypeSensorNotImportedRes = dataTypeSensorNotImportedQuery.statement.compile( compile_kwargs={"literal_binds" : True} )
        dataTypeSensorNotImportedDf = pd.read_sql_query(dataTypeSensorNotImportedRes,curSession.get_bind(ArgosGps))
        dataFutureAnnotatedRes = dataFutureAnnotatedQuery.statement.compile( compile_kwargs={"literal_binds" : True} )
        dataFutureAnnotatedDf = pd.read_sql_query(dataFutureAnnotatedRes,curSession.get_bind(ArgosGps))
        dataFutureAnnotatedDf['date'] = pd.to_datetime(dataFutureAnnotatedDf['date']).dt.strftime('%Y-%m-%dT%H:%M:%S')
        # à modifier
        # individualLocation = curSession.query(Individual_Location).filter(Individual_Location.FK_Individual == int(individualID),Individual_Location.FK_Sensor == sensor.ID).order_by(desc(Individual_Location.Date)).first()
        listOldID = []
        # list from file
        listForSpeedtmpID = []
        # list from database
        getDataForSpeed = []
        newDatatmpID = []
        if len(dataTypeSensorNotImportedDf) > 0:
            lastDataNotImported = dataTypeSensorNotImportedDf.loc[0]
            lastDataNotImportedDate = lastDataNotImported['date'].isoformat()
            # firstDataNotImportedDate = dataSensorNotImportedDf.loc[len(dataSensorNotImportedDf)-1,'DateTime'].isoformat()
            if len(dataSensorNotImportedDf1) > 0:
                # lastDataImported = individualLocation[0] # à modifier
                # lastDataImportedDate = lastDataImported.Date.isoformat()
                # Case : some data have already been imported in EcoReleveData but not all
                for i in futurAnnotated.index:
                    fileDate = futurAnnotated.loc[i,'date']
                    # To find data already validated and so that doesn't need to be imported
                    if fileDate < lastValidDate :
                        listOldID.append(i)
                    # To select data (from file) that haven't been validated by being imported in EcoReleveData
                    elif fileDate > lastDataNotImportedDate:
                        newDatatmpID.append(i)
                    else:
                        countImported = countImported + 1
                newData = futurAnnotated[futurAnnotated.index.isin(newDatatmpID)]
                    # to select newdata that are neither in EcoReleveData nor in Sensor + to get not imported data from sensor database if they weren't in file
                # Means that none of not imported data are in the current file
                dataForSpeed = dataSensorNotImportedDf.drop(['checked','imported','FK_Import','Data_Quality','Fk_individual_location'],axis = 1)
                dataForSpeed['date'] = pd.to_datetime(dataForSpeed['date']).dt.strftime('%Y-%m-%dT%H:%M:%S')
                dataForSpeed = dataForSpeed.sort_values(by='date',ascending=True) # Attention, peut-être vérifier que la dernière donnée (qui correspond à la première dans le temps) soit bien valide et corresponde au release
            else:
                # Case : No data has been imported in EcoReleveData but some are in sensor database
                for i in futurAnnotated.index:
                    fileDate = futurAnnotated.loc[i,'date']
                    if fileDate > lastDataNotImportedDate:
                        newDatatmpID.append(i)
                newData = futurAnnotated[futurAnnotated.index.isin(newDatatmpID)]
                dataForSpeed = dataSensorNotImportedDf.drop(['checked','imported','FK_Import','Data_Quality','Fk_individual_location'],axis = 1)
                dataForSpeed['date'] = pd.to_datetime(dataForSpeed['date']).dt.strftime('%Y-%m-%dT%H:%M:%S')
                dataForSpeed = dataForSpeed.sort_values(by='date',ascending=True) # Attention, peut-être vérifier que la dernière donnée (qui correspond à la première dans le temps) soit bien valide et corresponde au release
        else:
            # Case: All data in sensor have been imported in EcoReleveData
            if len(dataSensorNotImportedDf1) > 0:
                # lastDataImported = individualLocation[0]
                # lastDataImportedDate = lastDataImported.Date.isoformat()
                for i in futurAnnotated.index:
                    fileDate = futurAnnotated.loc[i,'date']
                    # To find data already validated and so that doesn't need to be imported
                    if fileDate < lastValidDate:
                        listOldID.append(i)
                    elif fileDate > lastValidDate:
                    #     listForSpeed = listForSpeed.append(futurAnnotated.loc[i])
                    # else:
                        newDatatmpID.append(i)
                newData = futurAnnotated[futurAnnotated.index.isin(newDatatmpID)]
                dataForSpeed = lastValidData.drop(['checked','imported','FK_Import','Data_Quality','Fk_individual_location'],axis = 0)
                dataForSpeed = dataForSpeed.to_frame()
                dataForSpeed = dataForSpeed.T
                dataForSpeed['date'] = pd.to_datetime(dataForSpeed['date']).dt.strftime('%Y-%m-%dT%H:%M:%S')
                # dataForSpeed = dataForSpeed.sort_values(by='DateTime',ascending=True) # Attention, peut-être vérifier que la dernière donnée (qui correspond à la première dans le temps) soit bien valide et corresponde au release
            else :
                dataForSpeed = pd.DataFrame(columns = columns)
                newData = futurAnnotated.copy()
        newData,futureDuplicates = self.findFutureDuplicates(newData, dataFutureAnnotatedDf)
        oldData = len(listOldID) + countImported + len(futureDuplicates)
        return dataForSpeed, newData, oldData

    def findFutureDuplicates(self, newData, dataFutureAnnotatedDf):
        # To remove data that was annotated Future at previous import
        newData['lat'] = newData['lat'].apply(pd.to_numeric)
        newData['lon'] = newData['lon'].apply(pd.to_numeric)
        newData = newData.round({'Latitude_N':5,'Longitude_E':5})
        toConcat = [newData, dataFutureAnnotatedDf]
        newAndFutureData = pd.concat(toConcat, sort=False)
        futureDuplicates = newAndFutureData[newAndFutureData.duplicated(['date','lat','lon'],keep='last')].copy()
        print(futureDuplicates)
        newData = newData.loc[(~newData['PK_id'].isin(futureDuplicates.PK_id))].copy()
        return newData, futureDuplicates

    def findWrongStringValues(self,value):
        try:
            test = int(value)
            return True
        except ValueError as e:
            return False

    def findGeoOutliers(self, NewData, dataType):
        geoOutliers = NewData.loc[((NewData['lat'].isnull())|(NewData['lon'].isnull()))|((abs(pd.to_numeric(NewData['lat']))>90)|(abs(pd.to_numeric(NewData['lon']))>180))].copy()
        geoOutliers['Status'] = 'geoimpossible'
        geoDataClean = NewData.loc[(~NewData['PK_id'].isin(geoOutliers.PK_id))].copy()
        # geoDataClean.astype({'Altitude_m':'int32'}, errors='ignore')
        # geoDataClean.loc[:,'Altitude_m']=geoDataClean['Altitude_m'].apply(pd.to_numeric, errors = 'ignore')
        if dataType == 'GPS':
            wrongValues = geoDataClean['ele'].apply(self.findWrongStringValues) #returns True if not str
            wrongValues = wrongValues.loc[wrongValues == False].copy()
            wrongValues = wrongValues.to_frame()
            geoDataClean = geoDataClean[~geoDataClean.index.isin(wrongValues.index)].copy()
        return geoOutliers, geoDataClean

    def findTimeOutliers(self,geoDataClean,sensorCreationDate,deploymentDateobj):
        sensorCreationDateobj = sensorCreationDate.isoformat()
        # # Recherche de potentielles dates avant la céation du sensor
        pastOutliers = geoDataClean.loc[geoDataClean['date'] < sensorCreationDateobj].copy()
        pastOutliers ['Status'] = 'Past outlier'
        timeDataClean = geoDataClean.loc[(~geoDataClean['PK_id'].isin(pastOutliers.PK_id))].copy()
        countTest = 0
        # # Recherche de potentielles dates avant le déploiement
        if timeDataClean['date'].iloc[0] < deploymentDateobj:
            for i in timeDataClean.index:
                if timeDataClean.loc[i,'date'] >= deploymentDateobj:
                    break
                else:
                    timeDataClean.loc[i,'Status']='test'
                    countTest = countTest + 1
        return timeDataClean, pastOutliers, countTest

    def findTimeDuplicates(self, timeDataClean):
        # Dataframe with duplicates with same date
        allDuplicatesDf = timeDataClean[timeDataClean.duplicated(['date'],keep=False)].copy()
        allDuplicatesDf['Status']='duplicate'
        duplicateCleanData = timeDataClean.loc[(~timeDataClean['PK_id'].isin(allDuplicatesDf.PK_id))].copy()
        return allDuplicatesDf, duplicateCleanData

    def Speed_algo(self, prefilteredData,MaxSpeed, iterationNb):
        # ici prefilteredData contient bien toutes les données jusqu'à la dernière validée (donc dans ERD) s'il y en a une
        eliminatedSpeed =[]
        pointsfiltered = []
        prefilteredData[0]['distance'] = 0
        prefilteredData[0]['Calculated_Speed'] = 0
        i=0
        L = len(prefilteredData)
        # Recherche des points valides sur la vitesse
        while i < L-1:
            for j in range (1,L-i):
                # Calcul de la distance
                prefilteredData[i+j]['distance'] = vincenty((float(prefilteredData[i]['lat']),float(prefilteredData[i]['lon'])),(float(prefilteredData[i+j]['lat']),float(prefilteredData[i+j]['lon'])))
                # Calcul de la durée
                diftimeS=datetime.strptime(prefilteredData[i+j]['date'],'%Y-%m-%dT%H:%M:%S') - datetime.strptime(prefilteredData[i]['date'],'%Y-%m-%dT%H:%M:%S')
                diftimeH=diftimeS.total_seconds()/3600
                # Calcul de la vitesse
                speed=prefilteredData[i+j]['distance']/float(diftimeH)
                prefilteredData[i+j]['Calculated_Speed'] = speed
                # prefilteredData[i+j]['speed'] = speed
                # Comparaison à la vitesse maximale entrée en paramètre,
                # Si la vitesse est considérée aberrante on ajoute le point aux données éliminées et on l'annote dans les données brutes
                if iterationNb == 1:
                    if speed > MaxSpeed:
                        eliminatedSpeed.append(prefilteredData[i+j])
                        prefilteredData[i+j]['Quality_On_Speed']= 2
                    else:
                        prefilteredData[i+j]['Quality_On_Speed']= 1
                        i=i+j
                        break
                if iterationNb == 2:
                    if speed > MaxSpeed:
                        eliminatedSpeed.append(prefilteredData[i+j])
                        prefilteredData[i+j]['Quality_On_Speed']=prefilteredData[i+j]['Quality_On_Speed'] + 1
                    else:
                        i=i+j
                        break
        # Elimination des points dont la vitesse a été jugée aberrante
        pointsfiltered = [x for x in prefilteredData if x not in eliminatedSpeed]
        return prefilteredData, eliminatedSpeed, pointsfiltered


    def setQuality(self, speedQualityNewData):
        for i in speedQualityNewData.index:
            # there is no quality indication in MTI_ARGOS_g, Reneco decided quality on metadata would be 1 by default in that case
            if speedQualityNewData.loc[i,'type']=='GPS':
                speedQualityNewData.loc[i,'Quality_On_Metadata'] = 1
            else:
                if speedQualityNewData.loc[i,'lc'] == '2' or speedQualityNewData.loc[i,'lc'] == '3':
                    speedQualityNewData.loc[i,'Quality_On_Metadata'] = 1
                elif speedQualityNewData.loc[i,'lc'] == '1':
                    speedQualityNewData.loc[i,'Quality_On_Metadata'] = 2
                else:
                    speedQualityNewData.loc[i,'Quality_On_Metadata'] = 3
        return speedQualityNewData

    def convertDataset(self, qualityAnnotated,dataForAfterQuality,identifier,individualID,dataProvider):
        # Final dataset = dataset with 'quality' + 'test' and future data
        frames = [qualityAnnotated, dataForAfterQuality]
        finalDataset = pd.concat(frames)
        finalDataset = finalDataset.drop(['distance'],axis = 1)
        finalDataset = finalDataset.drop(['PK_id'],axis = 1)
        if dataProvider == 'MTI_ARGOS_a':
            finalDataset = finalDataset.drop(['Swapped'],axis = 1)
            finalDataset = finalDataset.drop(['Average TI'],axis = 1)
            finalDataset = finalDataset.drop(['Lat2(N)'],axis = 1)
            finalDataset = finalDataset.drop(['Long2(E)'],axis = 1)
            finalDataset = finalDataset.drop(['Max Str'],axis = 1)
            finalDataset = finalDataset.drop(['Satellite'],axis = 1)
        finalDataset = finalDataset.sort_values(by='date',ascending=True)
        return finalDataset

    def parseFile(self):
        print("on est dans le parsing des fichers ARGOS")




# for item in self.__request__.POST._items:
#     if item is not None:
#         if item[0] == 'provider':
#             report['dataprovider'] = item[1]
#         else:
#             print(item)
#             name = item[1].filename
#             report['file'] = name
#             path = item[1].file
#             # read files depending on file type
#             if type(item[1].file) is io.BytesIO:
#                 data = repr( self.__request__.POST._items[0][1].file.getvalue().decode('latin1') )
#                 data = data[1:-1]
#                 rawData = pd.DataFrame( [ line.split('\\t') for line in data.split('\\r\\n') ])
#                 headers = rawData.iloc[0]
#                 rawData = rawData[1:-1]
#                 rawData = rawData.rename(columns = headers)
#             else:
#                 rawData = self.readData(report, path)
#             # Get tag identifier depending on provider
#             if report['dataprovider'] == 'MTI':
#                 datefile = name[10:20]
#                 identifier = name[0:8]
#             if report['dataprovider'] == 'Eobs':
#                 identifier = rawData['tag-local-identifier'][1]
#                 print(identifier)
#             sentData = len(rawData)
#             report['SentData'] = sentData
#             # #Gets database info about sensor
#             sensor = curSession.query(Sensor).filter(Sensor.UnicIdentifier == str(int(identifier))).first()
#             if sensor is None:
#                 rawData.insert(len(rawData.columns),'Status','')
#                 rawData['Status'] = 'exotic'
#                 print('No matching sensor found in database')
#                 return 'No matching sensor found in database'
#             else:
#                 sensorCreationDate = sensor.creationDate
#                 # Get file data type - locations or engineering - when separated files
#                 datatype = ''
#                 if name[8] == 'g':
#                     dataType = 'locations'
#                     report['dataprovider'] = report['dataprovider'] + 'g'
#                 if name[8] == 'e':
#                     dataType = 'engineering'
#                     report['dataprovider'] = report['dataprovider'] + 'e'
#                 columns = []
#                 # Get Standardized columns as the ones in database
#                 for col in rawData.columns:
#                     columns.append(col)
#                 if providers[report['dataprovider']] == columns:
#                     if report['dataprovider'] is not None:
#                         for col in providers[report['dataprovider']]:
#                             for item in variables:
#                                 if col in variables.get(item):
#                                     rawData.rename(columns={col:item}, inplace=True)
#                                     [item if x==col else x for x in columns]
#                         columns = rawData.columns
#                 else :
#                     print("wrong provider was selected")
#                     return False
#                 # #Dates management
#                 rawData['DateTime'] = rawData['DateTime'].str.replace(" ","T")
#                 rawData['DateTime'] = pd.to_datetime(rawData['DateTime']).dt.strftime('%Y-%m-%dT%H:%M:%S')
#                 rawData = rawData.sort_values(by='DateTime',ascending=True)
#                 rawData = rawData.replace({'':np.NAN})

#                 # columns to add in both engineering and locations
#                 if report['dataprovider'] == 'MTI':
#                     rawData.insert(len(rawData.columns),'platform_',identifier)
#                 # If locations and engineering in same file : split of dataframes
#                 if report['dataprovider'] == 'Eobs':
#                     engineeringDf = rawData[['DateTime','Temperature_C','BatteryVoltage_V','ActivityCount','platform_']].copy()
#                     engineeringDf.insert(len(engineeringDf.columns),'file_date',None)
#                     finalReport = self.engineeringDataManagement(engineeringDf,identifier, finalReport,report, curSession)
#                 if dataType == 'engineering':
#                     finalReport = self.engineeringDataManagement(rawData,identifier, finalReport,report,curSession)
#                     continue
#                 if dataType == 'locations' or report['dataprovider'] == 'Eobs':
#                     # #Dataset management
#                     rawData.insert(0, 'PK_id', range(0, 0 + len(rawData)))
#                     datefile = datetime.strptime(datefile,'%Y-%m-%d')
#                     file_date = (datefile+timedelta(hours=0,minutes=00,seconds=00)).strftime('%Y-%m-%dT%H:%M:%S')
#                     rawData.insert(len(rawData.columns),'file_date',file_date)
#                     rawData.insert(len(rawData.columns),'Status','ok')
#                     rawData.insert(len(rawData.columns),'Quality_On_Speed','')
#                     rawData.insert(len(rawData.columns),'Quality_On_Metadata','')
#                     print(rawData)
#                     timeDifference = 12 # parameter to verify if data in future = date > import date + time difference (depends where is the server)
#                     maxDateData, futurAnnotated, countFuture = self.futureAnnotation(rawData, timeDifference, datefile)
#                     report['FutureAnnotated'] = countFuture
#                     individualID, deployementDate, futurAnnotated = self.IndividualID_deployementDate(sensor, curSession, maxDateData)
#                     # #Function that permits to get new data comparing with what is already in database
#                     dataForSpeed, newData, oldData = self.findNewData(futurAnnotated, individualID, curSession, identifier, columns,sensor)
#                     report['AlreadyImportedData'] = oldData
#                     if len(newData) == 0:
#                         print('deso deja importées dans Sensor')
#                         report['AlreadyImportedData'] = sentData
#                         print(report)
#                         finalReport.append(report)
#                         print(finalReport)
#                         continue
#                     else:
#                         # #Function to remove impossible coordinates (null or abs(lat)> 90 or abs(lon)>180)
#                         geoOutliers, geoDataClean = self.findGeoOutliers(newData)
#                         report['GeoOutliers'] = len(geoOutliers)
#                         if len(geoOutliers)==len(newData):
#                             finalReport.append(report)
#                             print(finalReport)
#                         else:
#                             # #Function to remove and annotate data depending on date possibility : past before sensor creation, test before deployment
#                             timeDataClean, pastOutliers, countTest = self.findTimeOutliers(geoDataClean, sensorCreationDate, deployementDate)
#                             report['TestAnnotated'] = countTest
#                             # #Function that finds duplicates = data with at least exactly same timestamp
#                             duplicatesToDelete,duplicateCleanData = self.findTimeDuplicates(timeDataClean)
#                             report['Duplicates'] = len(duplicatesToDelete)
#                             # to have only ok status data for quality annotation
#                             dataForAfterQuality = duplicateCleanData.loc[duplicateCleanData['Status'].isin(['test','Future'])].copy()
#                             dataForQuality = duplicateCleanData.loc[~duplicateCleanData['Status'].isin(['test','Future'])].copy()
#                             if len(dataForSpeed) > 0:
#                                 forSpeed = [dataForSpeed, dataForQuality]
#                                 dataForSpeedComplete = pd.concat(forSpeed, sort=False)
#                                 dataForSpeedComplete = dataForSpeedComplete.sort_values(by='DateTime',ascending=True)
#                                 # dataForSpeed.update(self, dataForQuality, join='left', overwrite=True, filter_func=None, errors='ignore')
#                                 # to transform dataframe into List of dict
#                                 dataForSpeedComplete.reset_index(drop=True, inplace=True)
#                             else :
#                                 dataForSpeedComplete = dataForQuality.copy()
#                                 dataForSpeedComplete.reset_index(drop=True, inplace=True)
#                             prefilteredData = dataForSpeedComplete.to_dict('Index')
#                             # prefilteredData = self.dfToListDict(dataForSpeedComplete)
#                             maxSpeed1 = 15 #paramètre
#                             iterationNb = 1
#                             prefilteredDataAnnotated1, eliminatedSpeed1, points_filtered1=self.Speed_algo(prefilteredData,maxSpeed1,iterationNb)
#                             maxSpeed2 = 5
#                             iterationNb = 2
#                             prefilteredDataAnnotated2, eliminatedSpeed2, points_filtered2=self.Speed_algo(prefilteredDataAnnotated1,maxSpeed2,iterationNb)
#                             # Convert in good dataframe
#                             speedQualityAnnotatedDF = pd.DataFrame(prefilteredDataAnnotated2)
#                             speedQualityAnnotatedDF = speedQualityAnnotatedDF.T
#                             if len(dataForSpeed) > 0:
#                                 # Remove dataForSpeed to have only newData
#                                 speedQualityNewData = speedQualityAnnotatedDF.loc[(~speedQualityAnnotatedDF['PK_id'].isin(dataForSpeed.PK_id))].copy()
#                             else :
#                                 speedQualityNewData = speedQualityAnnotatedDF.copy()
#                             # Condition sur le fournisseur pour la note de qualité
#                             qualityAnnotated = self.setQuality(speedQualityNewData)
#                             finalDataset = self.convertDataset(qualityAnnotated, dataForAfterQuality,report)
#                             lasttime = datetime.now()
#                             diftime = lasttime - first_time
#                             print(finalDataset)
#                             report['DataInsertedInSensorDB'] = len(finalDataset)
#                             print(report)
#                             finalReport.append(report)
#                             print(finalReport)
#                             print(diftime)
#                             print('diftime')
#                             finalDataset.to_sql(Gsm.__tablename__, curSession.get_bind(Gsm), schema = dbConfig['sensor_schema'], if_exists='append', index=False)
#                             # csvpandas = self.parseFile(item)
# else:
#     HTTPBadRequest()
# "haaaaaaaaaa on veut poster du gsm"