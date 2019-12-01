from ecoreleve_server.modules.permissions import context_permissions
from pyramid.httpexceptions import HTTPBadRequest
from ecoreleve_server.traversal.core import MetaEndPointNotREST
from sqlalchemy import func, desc
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from vincenty import vincenty
from  ecoreleve_server.modules.sensors.sensor_model import Sensor
from  ecoreleve_server.modules.sensors.sensor_data.sensor_data_model import Gsm
from ecoreleve_server.core import Base, dbConfig
from  ecoreleve_server.modules.individuals.individual_model import Individual_Location


providers = {
    'MTI': ['DateTime', 'Latitude_N', 'Longitude_E', 'Speed', 'Course', 'Altitude_m', 'HDOP', 'VDOP', 'SatelliteCount', 'ShowInKML']
}

class ImportWithFileLikeCSV(MetaEndPointNotREST):
    __acl__ = context_permissions['formbuilder']

    def create(self):
        filePosted = self.getFile()
        if filePosted is not None:
            "we got a file "
            print(filePosted)
            csvpandas = self.parseFile()
        else:
            HTTPBadRequest()
        "haaaaaaaaaa on veut poster du gsm"

    def getFile(self):
        if 'file' in self.__request__.POST:
            return self.__request__.POST['file']
        else:
            return None

    def parseFile(self):
        print("you should implement you own")
        return None


class GSMImport(ImportWithFileLikeCSV):

    __acl__ = context_permissions['formbuilder']
    
    def retrieve(self):
        return 'youhouuo GSMImport'

    def create(self):
        first_time = datetime.now() # juste pour avoir temps d'exécution
        curSession = self.__request__.dbsession
        #filePosted = self.getFile()
        # if filePosted is not None:
        # name = filePosted.filename
        # path = filePosted.file
        #multifile self.__request__.POST['file']
        for item in self.__request__.POST._items:
            if item is not None:
                print(item)
                name = item[1].filename
                path = item[1].file
                rawData = pd.read_csv(path, sep='\t', dtype=str)
                # format du nom change peut-être selon fournisseur !
                # for MTI 
                datefile = name[10:20]
                identifier = name[0:8]
                # #Gets database info about sensor 
                sensor = curSession.query(Sensor).filter(Sensor.UnicIdentifier == str(int(identifier))).first()
                if sensor is None:
                    rawData.insert(len(rawData.columns),'Status','')
                    rawData['Status'] = 'exotic'
                    return 'No matching sensor found in database'
                else:
                    sensorCreationDate = sensor.creationDate
                    if name[8] == 'g':
                        dataType = 'locations'
                    if name[8] == 'e':
                        dataType = 'engineering'
                    columns = []
                    for col in rawData.columns:
                        columns.append(col)
                    # Faire comparaison avec liste de colonnes possibles pour trouver le fournisseur
                    for p in providers:
                        if providers[p] == columns:
                            dataProvider = p
                    if dataType == 'locations':
                        if dataProvider == 'MTI':
                            date = 'DateTime'
                        # #Dates management
                        rawData[date] = rawData[date].str.replace(" ","T") 
                        rawData[date] = pd.to_datetime(rawData[date]).dt.strftime('%Y-%m-%dT%H:%M:%S')
                        rawData = rawData.sort_values(by=date,ascending=True)
                        # #Dataset management
                        rawData = rawData.replace({'':np.NAN})
                        rawData.insert(0, 'PK_id', range(0, 0 + len(rawData)))
                        rawData.insert(len(rawData.columns),'platform_',sensor.UnicIdentifier)
                        rawData.insert(len(rawData.columns),'Status','ok')
                        rawData.insert(len(rawData.columns),'Quality_On_Speed','')
                        rawData.insert(len(rawData.columns),'Quality_On_Metadata','')
                        print(rawData)
                        timeDifference = 12 # parameter to verify if data in future = date > import date + time difference (depends where is the server)
                        maxDateData, futurAnnotated = self.futureAnnotation(rawData, timeDifference, datefile)
                        individualID, deployementDate = self.IndividualID_deployementDate(sensor, curSession, maxDateData)
                        # #Function that permits to get new data comparing with what is already in database
                        dataForSpeed, newData = self.findNewData(futurAnnotated, individualID, curSession, identifier, columns,sensor)
                        if len(newData) == 0:
                            print('deso deja importées dans Sensor')
                            return 'Ces données ont déjà été importées'
                        else:  
                            # #Function to remove impossible coordinates (null or abs(lat)> 90 or abs(lon)>180)
                            geoOutliers, geoDataClean = self.findGeoOutliers(newData)
                            # #Function to remove and annotate data depending on date possibility : past before sensor creation, test before deployment
                            timeDataClean, pastOutliers = self.findTimeOutliers(geoDataClean, sensorCreationDate, deployementDate)
                            # #Function that finds duplicates = data with at least exactly same timestamp
                            duplicatesToDelete,duplicateCleanData = self.findDuplicates(timeDataClean)
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
                                dataForSpeedComplete = newData.copy()
                            prefilteredData = dataForSpeedComplete.to_dict('Index')
                            # prefilteredData = self.dfToListDict(dataForSpeedComplete)
                            maxSpeed1 = 15 #paramètre
                            iterationNb = 1
                            prefilteredDataAnnotated1, eliminatedSpeed1, points_filtered1=self.Speed_algo(prefilteredData,maxSpeed1,iterationNb)
                            maxSpeed2 = 5
                            iterationNb = 2
                            prefilteredDataAnnotated2, eliminatedSpeed2, points_filtered2=self.Speed_algo(prefilteredData,maxSpeed2,iterationNb)
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
                            finalDataset = self.convertDataset(qualityAnnotated, dataForAfterQuality,identifier,individualID)
                            lasttime = datetime.now()
                            diftime = lasttime - first_time
                            print(finalDataset)
                            print(diftime)
                            print('diftime')
                            finalDataset.to_sql(Gsm.__tablename__, curSession.get_bind(), schema = dbConfig['sensor_schema'], if_exists='append', index=False)
                            # csvpandas = self.parseFile(item)
                    else :
                        print("engineering")
        else:
            HTTPBadRequest()
        "haaaaaaaaaa on veut poster du gsm"
    
    def parseFile(self,filePosted):
        print("on est dans le parsing des fichers gsm")

    def futureAnnotation(self, rawData, timeDifference, datefile):
        ## Annotate dates in the future
        # date import 
        # currentDate = (datetime.now()+timedelta(hours=timeDifference)).strftime('%Y-%m-%dT%H:%M:%S')
        # Date in filename at 23:59:59 
        datefile = datetime.strptime(datefile,'%Y-%m-%d')
        datefile = (datefile+timedelta(hours=23,minutes=59,seconds=59)).strftime('%Y-%m-%dT%H:%M:%S')
        count = 0
        for i in rawData.index:
            if rawData.loc[i,'DateTime'] > datefile:
                rawData.loc[i,'Status']='Future'
        ## get FK_individual and deployment date
        for idx in reversed(rawData.index):
            if rawData.loc[idx,'Status']=='Future':
                pass
            else :
                maxDateData = rawData.loc[idx,'DateTime']
                break
        return maxDateData, rawData

    def IndividualID_deployementDate(self, sensor, curSession, maxDateData):
        equipmentView = Base.metadata.tables['IndividualEquipment']
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

    def findNewData(self,futurAnnotated, individualID, curSession, identifier, columns,sensor): 
        # result gives all 
        # dataSensorNotImported = curSession.query(Gsm).filter(Gsm.platform_==int(identifier), Gsm.imported == 0).order_by(desc(Gsm.date)).all()
        dataSensorNotImportedQuery1 = curSession.query(Gsm).filter(Gsm.platform_==int(identifier), Gsm.imported == 1).order_by(desc(Gsm.date))
        dataSensorNotImportedRes1 = dataSensorNotImportedQuery1.statement.compile( compile_kwargs={"literal_binds" : True} )
        dataSensorNotImportedDf1 = pd.read_sql_query(dataSensorNotImportedRes1,curSession.get_bind())
        if len(dataSensorNotImportedDf1) > 0:
            lastValidData =  dataSensorNotImportedDf1.loc[0] #to have dataframe output and not series
            lastValidDate = lastValidData['DateTime'].isoformat()
            dataSensorNotImportedQuery = curSession.query(Gsm).filter(Gsm.platform_==int(identifier), Gsm.imported == 0, Gsm.date > lastValidDate).order_by(desc(Gsm.date))
        else:
            dataSensorNotImportedQuery = curSession.query(Gsm).filter(Gsm.platform_==int(identifier), Gsm.imported == 0).order_by(desc(Gsm.date))
        dataSensorNotImportedRes = dataSensorNotImportedQuery.statement.compile( compile_kwargs={"literal_binds" : True} )
        dataSensorNotImportedDf = pd.read_sql_query(dataSensorNotImportedRes,curSession.get_bind())
        # à modifier
        # individualLocation = curSession.query(Individual_Location).filter(Individual_Location.FK_Individual == int(individualID),Individual_Location.FK_Sensor == sensor.ID).order_by(desc(Individual_Location.Date)).first()
        listOldID = []
        # list from file
        listForSpeedtmpID = []
        # list from database
        getDataForSpeed = []
        # listForSpeed = pd.DataFrame(columns=columns)
        newDatatmpID = []
        # newData = pd.DataFrame(columns=columns)
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
                newData = futurAnnotated[futurAnnotated.index.isin(newDatatmpID)]
                    # to select newdata that are neither in EcoReleveData nor in Sensor + to get not imported data from sensor database if they weren't in file 
                # Means that none of not imported data are in the current file 
                dataForSpeed = dataSensorNotImportedDf.drop(['checked','imported','validated','FK_Import','Data_Quality','Fk_individual_location'],axis = 1)
                dataForSpeed['DateTime'] = pd.to_datetime(dataForSpeed['DateTime']).dt.strftime('%Y-%m-%dT%H:%M:%S')
                dataForSpeed = dataForSpeed.sort_values(by='DateTime',ascending=True) # Attention, peut-être vérifier que la dernière donnée (qui correspond à la première dans le temps) soit bien valide et corresponde au release
                # if len(listForSpeed)==0: # à modifier
                #     for j in range (len(dataSensorNotImportedDf)):
                #         listForSpeed = listForSpeed.append(dataSensorNotImportedDf[j]) # à modifier
                # # Means only part of not imported data are in the file. 
                # elif listForSpeed['DateTime'][0] > firstDataNotImportedDate:
                #     # To find last date in the file to import missing data until last valid data for speed algo 
                #     for g in range (len(dataSensorNotImportedDf)):
                #         if dataSensorNotImportedDf.loc[g,'DateTime'].isoformat() < listForSpeed[0]:
                #             indiceToAddDate = i
                #             break
                #     # To add data until last valid one
                #     for h in range (indiceToAddDate, len(dataSensorNotImportedDf)):
                #         listForSpeed = listForSpeed.append(dataSensorNotImportedDf.loc[h])
                #     listForSpeed = listForSpeed.append(lastDataImported) # à modifier
            else:
                # Case : No data has been imported in EcoReleveData but some are in sensor database
                for i in futurAnnotated.index:
                    fileDate = futurAnnotated.loc[i,'DateTime']
                    if fileDate > lastDataNotImportedDate:
                        newDatatmpID.append(i)
                newData = futurAnnotated[futurAnnotated.index.isin(newDatatmpID)]
                dataForSpeed = dataSensorNotImportedDf.drop(['checked','imported','validated','FK_Import','Data_Quality','Fk_individual_location'],axis = 1)
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
        return dataForSpeed, newData


        # newDatalist = []
        # if lastDateSensor is not None:
        #     lastDateSensor = lastDataSensor.date.isoformat()
        # if individualLocation is not None :
        #     individualLastDate = individualLocation.Date.isoformat()
        # for i in futurAnnotated.index:
        #     if lastDateSensor : 
        #         if individualLastDate:
        #             if individualLastDate < lastDateSensor:
        #                 if futurAnnotated.loc[i,'DateTime'] <= individualLastDate:
        #                     listOldID.append(i)
        #             else :
        #                 if futurAnnotated.loc[i,'DateTime'] <= lastDateSensor:
        #                     listNotImported.append(i)
        #                 else : 
        #                     break
        #         else:
        #             if futurAnnotated.loc[i,'DateTime'] <= lastDateSensor:
        #                     listNotImported.append(i)
        #                 else : 
        #                     break
        #     else:
        #         newData = []
        #         return newData, futurAnnotated
        # if len(listOldID) != 0:
        #     newDataForSpeed = futurAnnotated.drop(listOldID)
        # elif len(listNotImported) !=0:
        #     newData = newDataForSpeed.drop(listNotImported)
        #     return newData, newDataForSpeed


    def findGeoOutliers(self, NewData):
        geoOutliers = NewData.loc[((NewData['Latitude_N'].isnull())|(NewData['Longitude_E'].isnull()))|((abs(pd.to_numeric(NewData['Latitude_N']))>90)|(abs(pd.to_numeric(NewData['Longitude_E']))>180))].copy()
        geoOutliers['Status'] = 'geoimpossible'
        geoDataClean = NewData.loc[(~NewData['PK_id'].isin(geoOutliers.PK_id))].copy()
        return geoOutliers, geoDataClean

    def findTimeOutliers(self,geoDataClean,sensorCreationDate,deploymentDateobj):
        sensorCreationDateobj = sensorCreationDate.isoformat()
        # # Recherche de potentielles dates avant la céation du sensor
        pastOutliers = geoDataClean.loc[geoDataClean['DateTime'] < sensorCreationDateobj].copy()
        pastOutliers ['Status'] = 'Past outlier'
        timeDataClean = geoDataClean.loc[(~geoDataClean['PK_id'].isin(pastOutliers.PK_id))].copy()
        # # Recherche de potentielles dates avant le déploiement
        if timeDataClean['DateTime'].iloc[0] < deploymentDateobj:
            for i in timeDataClean.index:
                if timeDataClean.loc[i,'DateTime'] >= deploymentDateobj:
                    break
                else:
                    timeDataClean.loc[i,'Status']='test'   
        return timeDataClean, pastOutliers

    def findDuplicates(self, timeDataClean):
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
        prefilteredData[0]['distance'] = 0
        prefilteredData[0]['Calculated_Speed'] = 0
        i=0
        L = len(prefilteredData)
        # Recherche des points valides sur la vitesse
        while i < L-1:
            for j in range (1,L-i):
                # Calcul de la distance
                prefilteredData[i+j]['distance'] = vincenty((float(prefilteredData[i]['Latitude_N']),float(prefilteredData[i]['Longitude_E'])),(float(prefilteredData[i+j]['Latitude_N']),float(prefilteredData[i+j]['Longitude_E'])))
                # Calcul de la durée
                diftimeS=datetime.strptime(prefilteredData[i+j]['DateTime'],'%Y-%m-%dT%H:%M:%S') - datetime.strptime(prefilteredData[i]['DateTime'],'%Y-%m-%dT%H:%M:%S')
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
            if float(speedQualityNewData.loc[i,'SatelliteCount']) >= 5:
                speedQualityNewData.loc[i,'Quality_On_Metadata']= 1
            if float(speedQualityNewData.loc[i,'SatelliteCount']) < 5 and float(speedQualityNewData.loc[i,'SatelliteCount']) >= 3:
                if float(speedQualityNewData.loc[i,'HDOP']) <= 2:
                    speedQualityNewData.loc[i,'Quality_On_Metadata'] = 1
                if float(speedQualityNewData.loc[i,'HDOP']) > 2:
                    speedQualityNewData.loc[i,'Quality_On_Metadata'] = 2
            if float(speedQualityNewData.loc[i,'SatelliteCount']) < 3:
                speedQualityNewData.loc[i,'Quality_On_Metadata']= 3
            if float(speedQualityNewData.loc[i,'HDOP']) == 0:
                    speedQualityNewData.loc[i,'Quality_On_Metadata'] = 0
        return speedQualityNewData            
        # for i in range(len(prefilteredDataAnnotated)):
        #     if float(prefilteredDataAnnotated[i]['SatelliteCount']) >= 5:
        #         prefilteredDataAnnotated[i]['Quality_On_Metadata'] = 1
        #     if float(prefilteredDataAnnotated[i]['SatelliteCount']) < 5 and float(prefilteredDataAnnotated[i]['SatelliteCount']) >= 3:
        #         if float(prefilteredDataAnnotated[i]['HDOP']) <= 2:
        #             prefilteredDataAnnotated[i]['Quality_On_Metadata'] = 1
        #         if float(prefilteredDataAnnotated[i]['HDOP']) > 2:
        #             prefilteredDataAnnotated[i]['Quality_On_Metadata'] = 2
        #     if float(prefilteredDataAnnotated[i]['SatelliteCount']) < 3:
        #         prefilteredDataAnnotated[i]['Quality_On_Metadata'] = 3
        #     if float(prefilteredDataAnnotated[i]['HDOP']) == 0:
        #         prefilteredDataAnnotated[i]['Quality_On_Metadata'] = 3
        # return prefilteredDataAnnotated

    def convertDataset(self, qualityAnnotated,dataForAfterQuality,identifier,individualID):
        # qualityAnnotateddf = pd.DataFrame(qualityAnnotated)
        # lastDateSensor = curSession.query(Gsm).filter(Gsm.platform_==int(identifier)).order_by(desc(Gsm.DateTime)).first() 
        # if lastDateSensor is not None :
        #     lastDateSensor = lastDateSensor.DateTime.isoformat()
        #     listOldID=[]
        #     for i in futurAnnotated.index:
        #         if futurAnnotated.loc[i,'DateTime'] <= lastDateSensor:
        #             listOldID.append(i)
        #         else :
        #             break
        #     if len(listOldID) != 0:
        #         dataForDB = futurAnnotated.drop(listOldID)
        # Final dataset = dataset with 'quality' + 'test' and future data
        frames = [qualityAnnotated, dataForAfterQuality]
        finalDataset = pd.concat(frames)
        finalDataset = finalDataset.drop(['distance'],axis = 1)
        finalDataset = finalDataset.drop(['PK_id'],axis = 1)
        finalDataset['Altitude_m']= finalDataset['Altitude_m'].replace('No Fix', '') 
        finalDataset['Altitude_m']= finalDataset['Altitude_m'].replace('2D Fix', '') 
        finalDataset['Altitude_m']= finalDataset['Altitude_m'].replace('Low Voltage', '') 
        date = 'DateTime'
        finalDataset = finalDataset.sort_values(by=date,ascending=True)
        return finalDataset

class ARGOSImport(ImportWithFileLikeCSV):
    __acl__ = context_permissions['formbuilder']

    def retrieve(self):
        return 'youhouuo ARGOSImport'

    def setQuality(self, prefilteredDataAnnotated):
        for i in range(len(prefilteredDataAnnotated)):
            if float(prefilteredDataAnnotated[i]['lc']) == 2 or float(prefilteredDataAnnotated[i]['lc']) == 3:
                prefilteredDataAnnotated[i]['Quality_On_Metadata'] = 1
            elif float(prefilteredDataAnnotated[i]['lc']) == 1:
                prefilteredDataAnnotated[i]['Quality_On_Metadata'] = 2
            else:
                prefilteredDataAnnotated[i]['Quality_On_Metadata'] = 3
        return prefilteredDataAnnotated

    def parseFile(self):
        print("on est dans le parsing des fichers ARGOS")