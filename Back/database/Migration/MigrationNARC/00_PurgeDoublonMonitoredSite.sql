--- Liste des données avec doublons
select * from  [TMonitoredStations_Positions] MSP
WHERE EXISTS (select * 
				from [TMonitoredStations_Positions] MSP2 
				where MSP2.[TGeoPos_FK_TGeo_ID] =MSp.[TGeoPos_FK_TGeo_ID] AND MSP2.[TGeoPos_Begin_Date] = MSP.[TGeoPos_Begin_Date] 
				and MSP2.TGeoPos_PK_ID <> MSP.TGeoPos_PK_ID)
ORDER BY [TGeoPos_FK_TGeo_ID],[TGeoPos_Begin_Date]


DELETE [TMonitoredStations_Positions] 
-- select * from  [TMonitoredStations_Positions] 
WHERE TGeoPos_PK_ID IN (

SELECT MIN(TGeoPos_PK_ID)
  FROM [TMonitoredStations_Positions]
  group by [TGeoPos_FK_TGeo_ID],[TGeoPos_Begin_Date]
 Having count(*) > 1 )