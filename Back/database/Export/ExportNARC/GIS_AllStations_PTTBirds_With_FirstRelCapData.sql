
ALTER VIEW AllIndividualLocation 
AS
select * from (
	select I.ID FK_Individual , l.[Date] StationDate, l.LAT,l.LON,l.[Precision],'Indiv_Location' Name,l.ID staID,l.ELE
	from [dbo].[TIndividu] I 
	JOIN EcoReleve_NARC.dbo.[Individual_Location] L on L.FK_Individual = i.id
	union all
	select I.ID FK_Individual, st.StationDate,St.LAT,St.LON,st.[precision],pt.Name,st.id StaID,St.ELE
	from [dbo].[TIndividu] I 
	JOIN EcoReleve_NARC.dbo.Observation o ON o.FK_Individual = i.ID JOIN EcoReleve_NARC.dbo.ProtocoleType PT on o.FK_ProtocoleType = pt.ID and pt.name not in ('Bird Biometry')
	JOIN  TStation st ON st.ID = o.FK_Station ) F
GO

ALTER VIEW GIS_AllStations_PTTBirds_With_FirstRelCapData_New
AS
	select  i.ID indID ,sN.UnicIdentifier CurrentPTT,s.UnicIdentifier [PTT@Station],s.Model PTTModel@Station
	,VMS.ValueString MonitoringStatus@Station,VST.ValueString	SurveyType@Station,i.Origin,i.Sex,i.Age,'A FAire' CurrentIndividualStatus,i.Survey_type CurrentSurveyType,i.Monitoring_Status CurrentMonitoringStatus
    ,l.staID ,10 staType,l.StationDate staDate,	l.LAT,	l.LON,	l.Precision,l.ELE
	,Pl.Place RelPlace, Re.Country	RelCountry, DATEPART(yyyy,st.StationDate)	RelYear,st.StationDate	RelDate,i.Release_Ring_Code	ReleaseRingCode,CASE WHEN CHARINDEX('>',i.Species) > 0 THEN  REVERSE(LEFT(REVERSE(i.Species), CHARINDEX('>', REVERSE(i.Species)) - 1)) ELSE i.Species END 	SpecieName,i.Death_date	DeathDate
	from [dbo].[TIndividu] I 
	JOIN TIndividualFirstStation F on F.FK_Individual = I.ID 
	JOIN AllIndividualLocation L on L.FK_Individual = i.id
	LEFT JOIN  EcoReleve_NARC.dbo.Equipment E on E.FK_Individual = I.ID and e.Deploy=1 and e.StartDate <= l.stationDate
								and not exists (select * 
											from EcoReleve_NARC.dbo.Equipment E2 
											where E2.FK_Individual = e.FK_Individual and E2.StartDate > e.StartDate and e2.StartDate <= l.stationDate and e2.FK_Sensor in (select id from TSensor where FK_SensorType =1))
								and FK_Sensor in (select id from TSensor where FK_SensorType =1)
	LEFT JOIN TSensor S on S.ID = E.FK_Sensor 
	LEFT JOIN VIndividuEquipement EN ON EN.FK_Individual = I.ID and E.FK_Sensor in (select id from TSensor where FK_SensorType =1)
	LEFT JOIN TSensor SN ON SN.ID = EN.FK_Sensor 
	--LEFT JOIN TProtocol_Capture_individual C ON F.Protocol_Capture_Individual_ID = C.ID 
	--LEFT JOIN TProtocol_Release_Individual R ON F.Protocol_Release_Individual_ID = R.ID
	LEFT JOIN TStation st on F.FirstStation_ID = st.ID
	LEFT JOIN  EcoReleve_NARC.dbo.Place Pl on Pl.ID = st.Place
	LEFT JOIN EcoReleve_NARC.dbo.Region Re on PL.FK_Region = Re.ID
	
	JOIN EcoReleve_NARC.dbo.IndividualDynProp DPMS ON DPMS.Name = 'Monitoring_Status'
	LEFT JOIN  EcoReleve_NARC.dbo.IndividualDynPropValue VMS on VMS.FK_Individual = i.ID and VMS.StartDate <= l.StationDate and VMS.FK_IndividualDynProp = DPMS.ID
				and not exists (select * from EcoReleve_NARC.dbo.IndividualDynPropValue VMS2 where VMS2.FK_Individual = VMS.FK_Individual and VMS2.FK_IndividualDynProp = VMS.FK_IndividualDynProp and VMS2.StartDate <= l.StationDate and VMS2.StartDate > VMS.StartDate)
	JOIN EcoReleve_NARC.dbo.IndividualDynProp DPSV ON DPSV.Name = 'Survey_Type'
	LEFT JOIN  EcoReleve_NARC.dbo.IndividualDynPropValue VST on VST.FK_Individual = i.ID and VST.StartDate <= l.StationDate and VST.FK_IndividualDynProp = DPSV.ID
				and not exists (select * from EcoReleve_NARC.dbo.IndividualDynPropValue VST2 where VST2.FK_Individual = VST.FK_Individual and VST2.FK_IndividualDynProp = VST.FK_IndividualDynProp and VST2.StartDate <= l.StationDate and VST2.StartDate > VST.StartDate)
	

	
