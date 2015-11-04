DELETE [TMonitoredStations_Positions] 
WHERE TGeoPos_PK_ID IN (

SELECT MIN(TGeoPos_PK_ID)
  FROM [TMonitoredStations_Positions]
  group by [TGeoPos_FK_TGeo_ID],[TGeoPos_Begin_Date]
 Having count(*) > 1 )