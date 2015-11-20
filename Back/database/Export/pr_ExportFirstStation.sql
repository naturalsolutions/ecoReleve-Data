
IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'pr_ExportFirstStation ')
	DROP PROCEDURE pr_ExportFirstStation
GO

CREATE PROCEDURE pr_ExportFirstStation 
AS
BEGIN

	IF OBJECT_ID('TmpTIndividualFirstStation') IS NOT NULL
		DROP TABLE TmpTIndividualFirstStation

	select	i.ID fk_individual,isnull(s.id,sc.id) FirstStation_id,e.FK_Sensor FK_Sensor_FirstStation
	, R.ID Protocol_Release_Individual_ID, S.ID Release_Individual_Station_ID
	,c.ID Protocol_Capture_Individual_ID,sc.ID Capture_Individual_Station_ID
	into TmpTIndividualFirstStation
	from TIndividu I 
	LEFT JOIN [dbo].[TProtocol_Release_Individual] R ON r.FK_Individual = i.ID 
	LEFT JOIN TStation S on r.FK_Station = S.ID
	LEFT JOIN [dbo].[TProtocol_Capture_individual] C ON C.FK_Individual = i.ID 
	LEFT JOIN TStation SC on C.FK_Station = Sc.ID
	LEFT JOIN VIndividuEquipementHisto E ON  e.StartDate <= ISNULL(s.stationdate,sc.stationdate)  and E.fk_individual = i.id and e.Deploy =1 and not exists (select * from VIndividuEquipementHisto E2 where E2.FK_Individual = e.FK_Individual and e2.StartDate > e.StartDate)
	where not exists 
			(select * from [TProtocol_Release_Individual] R2 
				JOIN TStation S2 on s2.id = R2.fk_station 
				WHERE S2.StationDate > s.StationDate and r.id <> r2.id
				AND R2.FK_Individual = i.id )
	and not exists (
					(select * from [TProtocol_Capture_individual] C2 
					JOIN TStation SC2 on sC2.id = C2.fk_station 
					WHERE SC2.StationDate > sc.StationDate and c.id <> c2.id
					AND c2.FK_Individual = i.id )
					)


		IF object_id('TIndividualFirstStation') IS NOT NULL 
			DROP TABLE  TIndividualFirstStation
	
		exec sp_rename 'TmpTIndividualFirstStation','TIndividualFirstStation'

END

