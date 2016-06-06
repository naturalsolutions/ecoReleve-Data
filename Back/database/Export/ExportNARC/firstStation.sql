USE [EcoReleve_Export_ECWP]
GO

/****** Object:  StoredProcedure [dbo].[pr_ExportFirstStation]    Script Date: 23/03/2016 17:46:03 ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO




Alter PROCEDURE [dbo].[pr_ExportFirstStation] 
AS
BEGIN

	IF OBJECT_ID('TmpTIndividualFirstStation') IS NOT NULL
		DROP TABLE TmpTIndividualFirstStation

	SELECT	i.ID FK_Individual
			, CASE WHEN sc.ID is null or s.StationDate <= sc.StationDate THEN s.ID 
				when sc.ID is not null then sc.ID 
				when sc.ID is null then c.FK_Station
				else R.FK_Station
				
				END FirstStation_ID
			, e.FK_Sensor FK_Sensor_FirstStation
			, R.ID Protocol_Release_Individual_ID, R.FK_Station Release_Individual_FK_Station, s.ID Release_Individual_Station_ID
			, c.ID Protocol_Capture_Individual_ID, c.FK_Station Capture_Individual_FK_Station,sc.ID Capture_Individual_Station_ID
			,s.StationDate as releaseDate ,sc.StationDate as captureDate, e.StartDate as equipDate
	INTO TmpTIndividualFirstStation
	FROM TIndividu I 
	LEFT JOIN [dbo].[TProtocol_Release_Individual] R 
		ON r.FK_Individual = i.ID 
	LEFT JOIN TStation S 
		ON r.FK_Station = S.ID
	LEFT JOIN [dbo].[TProtocol_Capture_individual] C 
		ON C.FK_Individual = i.ID 
	LEFT JOIN TStation SC 
		ON C.FK_Station = Sc.ID
	LEFT JOIN ecoReleve_ECWP.[dbo].[IndividualEquipment] e
		ON  e.StartDate <= ISNULL(s.stationdate,sc.stationdate)  AND E.fk_individual = i.id 
		
	
	WHERE NOT EXISTS 
			(SELECT * 
			 FROM [TProtocol_Release_Individual] R2 
			 JOIN TStation S2 ON s2.id = R2.fk_station 
			 WHERE S2.StationDate < s.StationDate AND r.id <> r2.id	AND R2.FK_Individual = i.id )
	AND NOT EXISTS (SELECT * FROM [TProtocol_Capture_individual] C2 
					JOIN TStation SC2 ON sC2.id = C2.fk_station 
					WHERE SC2.StationDate < sc.StationDate AND c.id <> c2.id AND c2.FK_Individual = i.id)

		IF object_id ('TIndividualFirstStation') IS NOT NULL 
			DROP TABLE  TIndividualFirstStation
	
		EXEC sp_rename 'TmpTIndividualFirstStation','TIndividualFirstStation'

END




GO


