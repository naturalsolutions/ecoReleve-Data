from ecoreleve_server.traversal.core import MetaEndPointNotREST
from ecoreleve_server.modules.permissions import context_permissions
from pyramid.httpexceptions import HTTPBadRequest
from sqlalchemy import func, desc
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from vincenty import vincenty
from  ecoreleve_server.modules.sensors.sensor_model import Sensor
from ecoreleve_server.core import Base
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
                    rawData.insert(len(rawData.columns),'status','')
                    rawData['status'] = 'exotic'
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
                        rawData.insert(0, 'ID', range(0, 0 + len(rawData)))
                        rawData.insert(len(rawData.columns),'status','ok')
                        rawData.insert(len(rawData.columns),'qualityOnSpeed','')
                        rawData.insert(len(rawData.columns),'qualityOnMetadata','')
                        timeDifference = 12 # parameter to verify if data in future = date > import date + time difference (depends where is the server)
                        maxDateData, futurAnnotated = self.futureAnnotation(rawData, timeDifference, datefile)
                        individualID, deployementDate = self.IndividualID_deployementDate(sensor, curSession, maxDateData)
                        # #Function that permits to get new data comparing with what is already in database
                        NewData = self.findNewData(futurAnnotated, individualID, curSession)
                        if len(NewData) == 0:
                            return 'Ces données ont déjà été importées'
                        else:  
                            # #Function to remove impossible coordinates (null or abs(lat)> 90 or abs(lon)>180)
                            geoOutliers, geoDataClean = self.findGeoOutliers(NewData)
                            # #Function to remove and annotate data depending on date possibility : past before sensor creation, test before deployment
                            timeDataClean, pastOutliers = self.findTimeOutliers(geoDataClean, sensorCreationDate, deployementDate)
                            # #Function that finds duplicates = data with at least exactly same timestamp
                            duplicatesToDelete,duplicateCleanData = self.findDuplicates(timeDataClean)
                            # to have only ok status data for quality annotation 
                            dataForAfterQuality = duplicateCleanData.loc[duplicateCleanData['status'].isin(['test','Future'])].copy()
                            dataForQuality = duplicateCleanData.loc[~duplicateCleanData['status'].isin(['test','Future'])].copy()
                            # to transform dataframe into List of dict
                            prefilteredData = self.dfToListDict(dataForQuality)
                            maxSpeed1 = 15 #paramètre
                            iterationNb = 1
                            prefilteredDataAnnotated1, eliminatedSpeed1, points_filtered1=self.Speed_algo(prefilteredData,maxSpeed1,iterationNb)
                            maxSpeed2 = 5
                            iterationNb = 2
                            prefilteredDataAnnotated2, eliminatedSpeed2, points_filtered2=self.Speed_algo(prefilteredData,maxSpeed2,iterationNb)
                            # Condition sur le fournisseur pour la note de qualité
                            qualityAnnotated = self.setQuality(prefilteredDataAnnotated2)
                            finalDataset = self.convertDataset(qualityAnnotated, dataForAfterQuality)
                            lasttime = datetime.now()
                            diftime = lasttime - first_time
                            print(finalDataset)
                            print(diftime)
                            print('diftime')
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
                rawData.loc[i,'status']='Future'
        ## get FK_individual and deployment date
        for idx in reversed(rawData.index):
            if rawData.loc[idx,'status']=='Future':
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

    def findNewData(self,futurAnnotated, individualID, curSession):
        individualLocation = curSession.query(Individual_Location).filter(Individual_Location.FK_Individual == int(individualID)).order_by(desc(Individual_Location.Date)).first()
        if individualLocation is not None :
            individualLastDate = individualLocation.Date.isoformat()
            listOldID=[]
            for i in futurAnnotated.index:
                if futurAnnotated.loc[i,'DateTime'] <= individualLastDate:
                    listOldID.append(i)
                else :
                    break
            if len(listOldID) != 0:
                newData = futurAnnotated.drop(listOldID)
            return newData
        else:
            return futurAnnotated

    def findGeoOutliers(self, NewData):
        geoOutliers = NewData.loc[((NewData['Latitude_N'].isnull())|(NewData['Longitude_E'].isnull()))|((abs(pd.to_numeric(NewData['Latitude_N']))>90)|(abs(pd.to_numeric(NewData['Longitude_E']))>180))].copy()
        geoOutliers['status'] = 'geoimpossible'
        geoDataClean = NewData.loc[(~NewData['ID'].isin(geoOutliers.ID))].copy()
        return geoOutliers, geoDataClean

    def findTimeOutliers(self,geoDataClean,sensorCreationDate,deploymentDateobj):
        sensorCreationDateobj = sensorCreationDate.isoformat()
        # # Recherche de potentielles dates avant la céation du sensor
        pastOutliers = geoDataClean.loc[geoDataClean['DateTime'] < sensorCreationDateobj].copy()
        pastOutliers ['status'] = 'Past outlier'
        timeDataClean = geoDataClean.loc[(~geoDataClean['ID'].isin(pastOutliers.ID))].copy()
        # # Recherche de potentielles dates avant le déploiement
        if timeDataClean['DateTime'].iloc[0] < deploymentDateobj:
            for i in timeDataClean.index:
                if timeDataClean.loc[i,'DateTime'] >= deploymentDateobj:
                    break
                else:
                    timeDataClean.loc[i,'status']='test'   
        return timeDataClean, pastOutliers

    def findDuplicates(self, timeDataClean):
        # Dataframe with duplicates with same date
        allDuplicatesDf = timeDataClean[timeDataClean.duplicated(['DateTime'],keep=False)].copy()
        allDuplicatesDf['status']='duplicate'
        duplicateCleanData = timeDataClean.loc[(~timeDataClean['ID'].isin(allDuplicatesDf.ID))].copy()
        return allDuplicatesDf, duplicateCleanData

    def dfToListDict(self, dataframe):
        toret = []
        dataframe = dataframe.replace({np.NAN:None})
        rows = dataframe.to_dict('Index').values()
        for row in rows:
            toret.append(row)
        return  toret

    def Speed_algo(self, prefilteredData,MaxSpeed, iterationNb):
        # ici prefilteredData commence bien à la première nouvelle date 
        eliminatedSpeed =[]
        pointsfiltered = []
        prefilteredData[0]['distance'] = 0
        prefilteredData[0]['myspeed'] = 0
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
                prefilteredData[i+j]['myspeed'] = speed
                # prefilteredData[i+j]['speed'] = speed
                # Comparaison à la vitesse maximale entrée en paramètre,
                # Si la vitesse est considérée aberrante on ajoute le point aux données éliminées et on l'annote dans les données brutes 
                if iterationNb == 1:
                    if speed > MaxSpeed:
                        eliminatedSpeed.append(prefilteredData[i+j])
                        prefilteredData[i+j]['qualityOnSpeed']= 2
                    else:
                        prefilteredData[i+j]['qualityOnSpeed']= 1
                        i=i+j
                        break 
                if iterationNb == 2:
                    if speed > MaxSpeed:
                        eliminatedSpeed.append(prefilteredData[i+j])
                        prefilteredData[i+j]['qualityOnSpeed']=prefilteredData[i+j]['qualityOnSpeed'] + 1 
                    else:
                        i=i+j
                        break 
        # Elimination des points dont la vitesse a été jugée aberrante
        pointsfiltered = [x for x in prefilteredData if x not in eliminatedSpeed]          
        return prefilteredData, eliminatedSpeed, pointsfiltered

    def setQuality(self, prefilteredDataAnnotated):
        for i in range(len(prefilteredDataAnnotated)):
            if float(prefilteredDataAnnotated[i]['SatelliteCount']) >= 5:
                prefilteredDataAnnotated[i]['qualityOnMetadata'] = 1
            if float(prefilteredDataAnnotated[i]['SatelliteCount']) < 5 and float(prefilteredDataAnnotated[i]['SatelliteCount']) >= 3:
                if float(prefilteredDataAnnotated[i]['HDOP']) <= 2:
                    prefilteredDataAnnotated[i]['qualityOnMetadata'] = 1
                if float(prefilteredDataAnnotated[i]['HDOP']) > 2:
                    prefilteredDataAnnotated[i]['qualityOnMetadata'] = 2
            if float(prefilteredDataAnnotated[i]['SatelliteCount']) < 3:
                prefilteredDataAnnotated[i]['qualityOnMetadata'] = 3
            if float(prefilteredDataAnnotated[i]['HDOP']) == 0:
                prefilteredDataAnnotated[i]['qualityOnMetadata'] = 3
        return prefilteredDataAnnotated

    def convertDataset(self, qualityAnnotated,dataForAfterQuality):
        qualityAnnotateddf = pd.DataFrame(qualityAnnotated)
        # Final dataset = dataset with 'quality' + 'test' and future data
        frames = [qualityAnnotateddf, dataForAfterQuality]
        finalDataset = pd.concat(frames)
        finalDataset = finalDataset.drop(['distance'],axis = 1)
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
                prefilteredDataAnnotated[i]['qualityOnMetadata'] = 1
            elif float(prefilteredDataAnnotated[i]['lc']) == 1:
                prefilteredDataAnnotated[i]['qualityOnMetadata'] = 2
            else:
                prefilteredDataAnnotated[i]['qualityOnMetadata'] = 3
        return prefilteredDataAnnotated

    def parseFile(self):
        print("on est dans le parsing des fichers ARGOS")