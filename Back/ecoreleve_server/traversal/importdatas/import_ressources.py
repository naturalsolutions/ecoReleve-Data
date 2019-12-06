from ecoreleve_server.modules.permissions import context_permissions
from pyramid.httpexceptions import HTTPBadRequest
from ecoreleve_server.traversal.core import MetaEndPointNotREST
from sqlalchemy import func, desc
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from vincenty import vincenty
from  ecoreleve_server.modules.sensors.sensor_model import Sensor
from  ecoreleve_server.modules.sensors.sensor_data.sensor_data_model import Gsm, GsmEngineering, ArgosGps, ArgosEngineering
from ecoreleve_server.core import Base, dbConfig
from  ecoreleve_server.modules.individuals.individual_model import Individual_Location
import io 


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
        providers = {
            'MTI_GSM_g': ['DateTime', 'Latitude_N', 'Longitude_E', 'Speed', 'Course', 'Altitude_m', 'HDOP', 'VDOP', 'SatelliteCount', 'ShowInKML'],
            'MTI_GSM_e': ['DateTime','Temperature_C','BatteryVoltage_V','ActivityCount']   
        }

        variables = {
            'DateTime': ['DateTime','Date Time','Date/Time','Tx Date/Time'],
            'Latitude_N': ['Latitude_N','Lat1(N)','Latitude(N)'],
            'Longitude_E': ['Longitude_E','Lon1(E)','Longitude(E)'],
            'Speed': ['Speed'],
            'Course': ['Course'],
            'Altitude_m': ['Altitude_m','Altitude(m)'],
            'HDOP': ['HDOP'],
            'VDOP': ['VDOP'],
            'SatelliteCount': ['SatelliteCount','Satellite Count'],
            'ShowInKML': ['ShowInKML'],
            'Temperature_C': ['Temperature_C'],
            'BatteryVoltage_V': ['BatteryVoltage_V'],
            'ActivityCount': ['ActivityCount']
        }
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
                if type(item[1].file) is io.BytesIO:
                    data = repr( self.__request__.POST._items[0][1].file.getvalue().decode('latin1') )
                    data = data[1:-1]
                    rawData = pd.DataFrame( [ line.split('\\t') for line in data.split('\\r\\n') ])
                    headers = rawData.iloc[0]
                    rawData = rawData[1:-1]
                    rawData = rawData.rename(columns = headers)
                else:
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
                    if dataProvider is not None:
                        for col in providers[dataProvider]:
                            for item in variables:
                                if col in variables.get(item):
                                    rawData.rename(columns={col:item}, inplace=True) 
                                    [item if x==col else x for x in columns]
                        columns = rawData.columns
                    else :
                        return "ce fournisseur n'est pas connu ou a changé le nom de ses colonnes"
                    # #Dates management
                    rawData['DateTime'] = rawData['DateTime'].str.replace(" ","T") 
                    rawData['DateTime'] = pd.to_datetime(rawData['DateTime']).dt.strftime('%Y-%m-%dT%H:%M:%S')
                    rawData = rawData.sort_values(by='DateTime',ascending=True)
                    rawData = rawData.replace({'':np.NAN})
                    # columns to add in both engineering and locations
                    rawData.insert(len(rawData.columns),'platform_',identifier)
                    if dataType == 'engineering':
                        dataSensorQuery = curSession.query(GsmEngineering).filter(GsmEngineering.platform_==int(identifier)).order_by(desc(GsmEngineering.date))
                        dataSensor = dataSensorQuery.statement.compile( compile_kwargs={"literal_binds" : True} )
                        dataSensorDf = pd.read_sql_query(dataSensor,curSession.get_bind())
                        rawData['DateTime'] = pd.to_datetime(rawData['DateTime']).dt.strftime('%Y-%m-%dT%H:%M:%S')
                        rawData = rawData.sort_values(by='DateTime',ascending=True)
                        if len(dataSensorDf) > 0:
                            lastData =  dataSensorDf.loc[0]       
                            lastDate = lastData['DateTime'].isoformat()                
                            newDatatmpID = []
                            for i in rawData.index:
                                fileDate = rawData.loc[i,'DateTime']
                                if fileDate > lastDate:
                                    newDatatmpID.append(i)
                            newData = rawData[rawData.index.isin(newDatatmpID)]
                        else:
                            newData = rawData.copy()
                        newData.to_sql(GsmEngineering.__tablename__, curSession.get_bind(), schema = dbConfig['sensor_schema'], if_exists='append', index=False)
                    if dataType == 'locations':
                        # #Dataset management
                        rawData.insert(0, 'PK_id', range(0, 0 + len(rawData)))
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
                            duplicatesToDelete,duplicateCleanData = self.findTimeDuplicates(timeDataClean)
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
                            finalDataset = self.convertDataset(qualityAnnotated, dataForAfterQuality,identifier,individualID)
                            lasttime = datetime.now()
                            diftime = lasttime - first_time
                            print(finalDataset)
                            print(diftime)
                            print('diftime')
                            finalDataset.to_sql(Gsm.__tablename__, curSession.get_bind(), schema = dbConfig['sensor_schema'], if_exists='append', index=False)
                            # csvpandas = self.parseFile(item)
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
            dataSensorNotImportedQuery = curSession.query(Gsm).filter(Gsm.platform_==int(identifier), Gsm.imported == 0, Gsm.date > lastValidDate, Gsm.Status == 'ok').order_by(desc(Gsm.date))
            dataFutureAnnotatedQuery = curSession.query(Gsm).filter(Gsm.platform_==int(identifier), Gsm.imported == 0, Gsm.date > lastValidDate, Gsm.Status == 'Future').order_by(desc(Gsm.date))     
        else:
            dataSensorNotImportedQuery = curSession.query(Gsm).filter(Gsm.platform_==int(identifier), Gsm.imported == 0, Gsm.Status == 'ok').order_by(desc(Gsm.date))
            dataFutureAnnotatedQuery = curSession.query(Gsm).filter(Gsm.platform_==int(identifier), Gsm.imported == 0, Gsm.Status == 'Future').order_by(desc(Gsm.date))
        dataSensorNotImportedRes = dataSensorNotImportedQuery.statement.compile( compile_kwargs={"literal_binds" : True} )
        dataSensorNotImportedDf = pd.read_sql_query(dataSensorNotImportedRes,curSession.get_bind())
        dataFutureAnnotatedRes = dataFutureAnnotatedQuery.statement.compile( compile_kwargs={"literal_binds" : True} )
        dataFutureAnnotatedDf = pd.read_sql_query(dataFutureAnnotatedRes,curSession.get_bind())
        dataFutureAnnotatedDf['DateTime'] = pd.to_datetime(dataFutureAnnotatedDf['DateTime']).dt.strftime('%Y-%m-%dT%H:%M:%S')
        # à modifier
        # individualLocation = curSession.query(Individual_Location).filter(Individual_Location.FK_Individual == int(individualID),Individual_Location.FK_Sensor == sensor.ID).order_by(desc(Individual_Location.Date)).first()
        listOldID = []
        # list from file
        listForSpeedtmpID = []
        # list from database
        getDataForSpeed = []
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
                newData = futurAnnotated[futurAnnotated.index.isin(newDatatmpID)]
                    # to select newdata that are neither in EcoReleveData nor in Sensor + to get not imported data from sensor database if they weren't in file 
                # Means that none of not imported data are in the current file 
                dataForSpeed = dataSensorNotImportedDf.drop(['checked','imported','validated','FK_Import','Data_Quality','Fk_individual_location'],axis = 1)
                dataForSpeed['DateTime'] = pd.to_datetime(dataForSpeed['DateTime']).dt.strftime('%Y-%m-%dT%H:%M:%S')
                dataForSpeed = dataForSpeed.sort_values(by='DateTime',ascending=True) # Attention, peut-être vérifier que la dernière donnée (qui correspond à la première dans le temps) soit bien valide et corresponde au release
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
        newData = self.findFutureDuplicates(newData, dataFutureAnnotatedDf)
        return dataForSpeed, newData

    def findFutureDuplicates(self, newData, dataFutureAnnotatedDf):
        # To remove data that was annotated Future at previous import
        print(newData)
        print(len(newData))
        newData['Latitude_N'] = newData['Latitude_N'].apply(pd.to_numeric)
        newData['Longitude_E'] = newData['Longitude_E'].apply(pd.to_numeric)
        toConcat = [newData, dataFutureAnnotatedDf]
        newAndFutureData = pd.concat(toConcat, sort=False)
        futureDuplicates = newAndFutureData[newAndFutureData.duplicated(['DateTime','Latitude_N','Longitude_E'],keep='last')].copy()
        print(futureDuplicates)
        newData = newData.loc[(~newData['PK_id'].isin(futureDuplicates.PK_id))].copy()
        print(newData)
        print(len(newData))
        return newData

    def findWrongStringValues(self,value):
        try:
            test = int(value)
            return True
        except ValueError as e:
            return False


    def findGeoOutliers(self, NewData):
        geoOutliers = NewData.loc[((NewData['Latitude_N'].isnull())|(NewData['Longitude_E'].isnull()))|((abs(pd.to_numeric(NewData['Latitude_N']))>90)|(abs(pd.to_numeric(NewData['Longitude_E']))>180))].copy()
        geoOutliers['Status'] = 'geoimpossible'
        geoDataClean = NewData.loc[(~NewData['PK_id'].isin(geoOutliers.PK_id))].copy()
        # geoDataClean.astype({'Altitude_m':'int32'}, errors='ignore')
        # geoDataClean.loc[:,'Altitude_m']=geoDataClean['Altitude_m'].apply(pd.to_numeric, errors = 'ignore')
        wrongValues = geoDataClean['Altitude_m'].apply(self.findWrongStringValues) #returns True if not str
        wrongValues = wrongValues.loc[wrongValues == False].copy()
        wrongValues = wrongValues.to_frame()
        geoDataClean = geoDataClean[~geoDataClean.index.isin(wrongValues.index)].copy()
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

    def convertDataset(self, qualityAnnotated,dataForAfterQuality,identifier,individualID):
        # Final dataset = dataset with 'quality' + 'test' and future data
        frames = [qualityAnnotated, dataForAfterQuality]
        finalDataset = pd.concat(frames)
        finalDataset = finalDataset.drop(['distance'],axis = 1)
        finalDataset = finalDataset.drop(['PK_id'],axis = 1)
        date = 'DateTime'
        finalDataset = finalDataset.sort_values(by=date,ascending=True)
        return finalDataset

class ARGOSImport(ImportWithFileLikeCSV):

    __acl__ = context_permissions['formbuilder']

    def retrieve(self):
        return 'youhouuo ARGOSImport'

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
        curSession = self.__request__.dbsession
        for item in self.__request__.POST._items:
            if item is not None:
                print(item)
                name = item[1].filename
                if name == 'DIAG.TXT':
                    f = open('DIAG.TXT','r')
                    content = f.read()
                    # renvoie dictionnaire de config "diagInfo"
                diagInfo = {
                    'Program':'03416'
                }
                path = item[1].file
                # File that contains very few data is considered as BytesIO file instead of temporary file. BytesIO needs a particular decoding step
                if type(item[1].file) is io.BytesIO:
                    data = repr( self.__request__.POST._items[0][1].file.getvalue().decode('latin1') )
                    data = data[1:-1]
                    rawData = pd.DataFrame( [ line.split('\\t') for line in data.split('\\r\\n') ])
                    headers = rawData.iloc[0]
                    rawData = rawData[1:-1]
                    rawData = rawData.rename(columns = headers)
                else:
                    rawData = pd.read_csv(path, sep='\t', dtype=str)
                identifier = name[0:5]
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
                    dataSensorDf = pd.read_sql_query(dataSensor,curSession.get_bind())
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
                    newData.to_sql(ArgosEngineering.__tablename__, curSession.get_bind(), schema = dbConfig['sensor_schema'], if_exists='append', index=False)
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
                        maxDateData, futurAnnotated = self.futureAnnotation(rawData, timeDifference)
                        individualID, deployementDate = self.IndividualID_deployementDate(sensor, curSession, maxDateData)
                        # #Function that permits to get new data comparing with what is already in database
                        dataForSpeed, newData = self.findNewData(futurAnnotated, curSession, identifier, columns, dataType)
                        if len(newData) == 0:
                            print('deso deja importées dans Sensor')
                            return 'Ces données ont déjà été importées'
                        else:  
                            # #Function to remove impossible coordinates (null or abs(lat)> 90 or abs(lon)>180)
                            geoOutliers, geoDataClean = self.findGeoOutliers(newData, dataType)
                            # #Function to remove and annotate data depending on date possibility : past before sensor creation, test before deployment
                            timeDataClean, pastOutliers = self.findTimeOutliers(geoDataClean, sensorCreationDate, deployementDate)
                            # #Function that finds duplicates = data with at least exactly same timestamp
                            duplicatesToDelete,duplicateCleanData = self.findTimeDuplicates(timeDataClean)
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
                            print(diftime)
                            print('diftime')
                            finalDataset.to_sql(ArgosGps.__tablename__, curSession.get_bind(), schema = dbConfig['sensor_schema'], if_exists='append', index=False)

    def futureAnnotation(self, rawData, timeDifference):
        ## Annotate dates in the future
        # date import 
        currentDate = (datetime.now()+timedelta(hours=timeDifference)).strftime('%Y-%m-%dT%H:%M:%S')
        # Date in filename at 23:59:59 
        # datefile = datetime.strptime(datefile,'%Y-%m-%d')
        # datefile = (datefile+timedelta(hours=23,minutes=59,seconds=59)).strftime('%Y-%m-%dT%H:%M:%S')
        # count = 0
        for i in rawData.index:
            if rawData.loc[i,'date'] > currentDate:
                rawData.loc[i,'Status']='Future'
        ## get FK_individual and deployment date
        for idx in reversed(rawData.index):
            if rawData.loc[idx,'Status']=='Future':
                pass
            else :
                maxDateData = rawData.loc[idx,'date']
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

    def findNewData(self,futurAnnotated, curSession, identifier, columns, dataType): 
        # result gives all 
        # dataSensorNotImported = curSession.query(Gsm).filter(Gsm.platform_==int(identifier), Gsm.imported == 0).order_by(desc(Gsm.date)).all()
        dataSensorNotImportedQuery1 = curSession.query(ArgosGps).filter(ArgosGps.ptt==int(identifier), ArgosGps.imported == 1).order_by(desc(ArgosGps.date))
        dataSensorNotImportedRes1 = dataSensorNotImportedQuery1.statement.compile( compile_kwargs={"literal_binds" : True} )
        dataSensorNotImportedDf1 = pd.read_sql_query(dataSensorNotImportedRes1,curSession.get_bind())
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
        dataSensorNotImportedDf = pd.read_sql_query(dataSensorNotImportedRes,curSession.get_bind())
        dataTypeSensorNotImportedRes = dataTypeSensorNotImportedQuery.statement.compile( compile_kwargs={"literal_binds" : True} )
        dataTypeSensorNotImportedDf = pd.read_sql_query(dataTypeSensorNotImportedRes,curSession.get_bind())
        dataFutureAnnotatedRes = dataFutureAnnotatedQuery.statement.compile( compile_kwargs={"literal_binds" : True} )
        dataFutureAnnotatedDf = pd.read_sql_query(dataFutureAnnotatedRes,curSession.get_bind())
        dataFutureAnnotatedDf['date'] = pd.to_datetime(dataFutureAnnotatedDf['date']).dt.strftime('%Y-%m-%dT%H:%M:%S')
        # à modifier
        # individualLocation = curSession.query(Individual_Location).filter(Individual_Location.FK_Individual == int(individualID),Individual_Location.FK_Sensor == sensor.ID).order_by(desc(Individual_Location.Date)).first()
        listOldID = []
        # list from file
        listForSpeedtmpID = []
        # list from database
        getDataForSpeed = []
        newDatatmpID = []
        if len(dataSensorNotImportedDf) > 0:
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
        newData = self.findFutureDuplicates(newData, dataFutureAnnotatedDf)
        return dataForSpeed, newData

    def findFutureDuplicates(self, newData, dataFutureAnnotatedDf):
        # To remove data that was annotated Future at previous import
        newData['lat'] = newData['lat'].apply(pd.to_numeric)
        newData['lon'] = newData['lon'].apply(pd.to_numeric)
        toConcat = [newData, dataFutureAnnotatedDf]
        newAndFutureData = pd.concat(toConcat, sort=False)
        futureDuplicates = newAndFutureData[newAndFutureData.duplicated(['date','lat','lon'],keep='last')].copy()
        print(futureDuplicates)
        newData = newData.loc[(~newData['PK_id'].isin(futureDuplicates.PK_id))].copy()
        return newData

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
        # # Recherche de potentielles dates avant le déploiement
        if timeDataClean['date'].iloc[0] < deploymentDateobj:
            for i in timeDataClean.index:
                if timeDataClean.loc[i,'date'] >= deploymentDateobj:
                    break
                else:
                    timeDataClean.loc[i,'Status']='test'   
        return timeDataClean, pastOutliers

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