IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'pr_ExportIndividualLastLocationAllSource')
	DROP PROCEDURE pr_ExportIndividualLastLocationAllSource
GO

CREATE PROCEDURE pr_ExportIndividualLastLocationAllSource
AS
BEGIN

IF OBJECT_ID('tmpIndividualLastLocationAllSource') IS NOT NULL
		DROP TABLE tmpIndividualLastLocationAllSource
select S.*,e.FK_Sensor into tmpIndividualLastLocationAllSource
FROM
	(
	select L.FK_Individual
	,CASE WHEN L.Date > S.StationDate THEN L.Date ELSE S.StationDate END  LocalisationDate
	,CASE WHEN L.Date > S.StationDate THEN L.LAT ELSE S.LAT END  LAT
	,CASE WHEN L.Date > S.StationDate THEN L.LON ELSE S.LON END  LON
	,CASE WHEN L.Date > S.StationDate THEN L.ELE ELSE S.ELE END  ELE
	,CASE WHEN L.Date > S.StationDate THEN NULL ELSE L.fk_station END  fk_station 
	,CASE WHEN L.Date > S.StationDate THEN L.ID ELSE NULL END  fk_individualLocation
	,CASE WHEN L.Date > S.StationDate THEN L.type_ ELSE PT.Name END  Source
	from (
		select distinct LS.*,Os.ID fk_station,os.FK_ProtocoleType 
		from TIndividualLastLocationSensor LS
		JOIN 
			(select S.ID,o.FK_Individual,o.FK_ProtocoleType 
			, ROW_NUMBER() OVER (PARTITION by FK_Individual order by FK_Individual,S.stationdate DESC) nb 
			from [EcoReleve_ECWP].dbo.Observation o join [EcoReleve_ECWP].dbo.Station S on o.FK_Station = S.ID 
			where o.FK_ProtocoleType not in (select id from [EcoReleve_ECWP].dbo.ProtocoleType where name  in ('Nest description'))	
			) Os 
			on os.fk_individual=LS.fk_individual and os.nb=1
		union all
		select LS.*,NULL fk_station , NULL FK_ProtocoleType from TIndividualLastLocationSensor LS
		where not exists (select * from [EcoReleve_ECWP].dbo.Observation o where o.FK_Individual = LS.FK_Individual  and o.FK_ProtocoleType not in (select id from [EcoReleve_ECWP].dbo.ProtocoleType where name  in ('Nest description'))	 )
	) L LEFT JOIN TStation S on S.ID = L.fk_station LEFT JOIN [EcoReleve_ECWP].dbo.ProtocoleType PT on l.FK_ProtocoleType = PT.ID
) S LEFT JOIN VIndividuEquipementHisto E ON  e.StartDate <= S.LocalisationDate  and E.fk_individual = s.FK_Individual and e.Deploy =1 
											and not exists (select * 
															from VIndividuEquipementHisto E2 
															where E2.FK_Individual = e.FK_Individual and e2.StartDate > e.StartDate)

	IF object_id('TIndividualLastLocationAllSource') IS NOT NULL 
		DROP TABLE  TIndividualLastLocationAllSource
	exec sp_rename 'tmpIndividualLastLocationAllSource','TIndividualLastLocationAllSource'

END


