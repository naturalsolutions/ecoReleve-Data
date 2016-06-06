USE [EcoReleve_Export_NARC]
GO

/****** Object:  StoredProcedure [dbo].[pr_GIS_AllStations_PTTBirds_With_FirstRelCapData]    Script Date: 27/04/2016 08:17:20 ******/
DROP PROCEDURE [dbo].[pr_GIS_AllStations_PTTBirds_With_FirstRelCapData]
GO

/****** Object:  StoredProcedure [dbo].[pr_GIS_AllStations_PTTBirds_With_FirstRelCapData]    Script Date: 27/04/2016 08:17:20 ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO


CREATE PROCEDURE [dbo].[pr_GIS_AllStations_PTTBirds_With_FirstRelCapData] 
AS
BEGIN
	IF OBJECT_ID('tempdb') IS NOT NULL
		DROP TABLE TmpGIS_AllStations_PTTBirds_With_FirstRelCapData


	IF object_id('tempdb..#ThesaurusTraduction') IS NOT NULL
		DROP TABLE #ThesaurusTraduction

	select DISTINCT convert(varchar(255),s.Model) FullPath, convert(varchar(255),lb.TLib_Name) TLib_Name , convert(varchar(255),'Sensor') as [objectName], convert(varchar(255),'modèles d''émetteur') ObjectProp
	into #ThesaurusTraduction
	FROM TSensor S JOIN THESAURUS.dbo.TTopic Th on S.Model = Th.TTop_FullPath and Th.TTop_Type = 'modèles d''émetteur'
	JOIN THESAURUS.[dbo].[TTopicLibelle] Lb on Lb.[TLib_FK_TTop_ID] = Th.[TTop_PK_ID] and Lb.TLib_FK_TLan_ID='en'

	INSERT INTO #ThesaurusTraduction (FullPath, TLib_Name, [objectName],  ObjectProp)
	select DISTINCT I.Monitoring_Status FullPath, lb.TLib_Name, 'Individu' as [objectName], 'statut de suivis' ObjectProp
	FROM TIndividu I JOIN THESAURUS.dbo.TTopic Th on I.Monitoring_Status = Th.TTop_FullPath and Th.TTop_Type = 'statut de suivis'
	JOIN THESAURUS.[dbo].[TTopicLibelle] Lb on Lb.[TLib_FK_TTop_ID] = Th.[TTop_PK_ID] and Lb.TLib_FK_TLan_ID='en'

	INSERT INTO #ThesaurusTraduction (FullPath, TLib_Name, [objectName],  ObjectProp)
	select DISTINCT I.Survey_type FullPath, lb.TLib_Name, 'Individu' as [objectName], 'type de suivis' ObjectProp
	FROM TIndividu I JOIN THESAURUS.dbo.TTopic Th on I.Survey_type = Th.TTop_FullPath and Th.TTop_Type = 'type de suivis'
	JOIN THESAURUS.[dbo].[TTopicLibelle] Lb on Lb.[TLib_FK_TTop_ID] = Th.[TTop_PK_ID] and Lb.TLib_FK_TLan_ID='en'

	INSERT INTO #ThesaurusTraduction (FullPath, TLib_Name, [objectName],  ObjectProp)
	select DISTINCT I.Origin FullPath, lb.TLib_Name, 'Individu' as [objectName], 'origine' ObjectProp
	FROM TIndividu I JOIN THESAURUS.dbo.TTopic Th on I.Origin = Th.TTop_FullPath and Th.TTop_Type = 'origine'
	JOIN THESAURUS.[dbo].[TTopicLibelle] Lb on Lb.[TLib_FK_TTop_ID] = Th.[TTop_PK_ID] and Lb.TLib_FK_TLan_ID='en'

	INSERT INTO #ThesaurusTraduction (FullPath, TLib_Name, [objectName],  ObjectProp)
	select DISTINCT I.Sex FullPath, lb.TLib_Name, 'Individu' as [objectName], 'sex' ObjectProp
	FROM TIndividu I JOIN THESAURUS.dbo.TTopic Th on I.Sex = Th.TTop_FullPath and Th.TTop_Type = 'sexe'
	JOIN THESAURUS.[dbo].[TTopicLibelle] Lb on Lb.[TLib_FK_TTop_ID] = Th.[TTop_PK_ID] and Lb.TLib_FK_TLan_ID='en'

	INSERT INTO #ThesaurusTraduction (FullPath, TLib_Name, [objectName],  ObjectProp)
	select DISTINCT I.Age FullPath, lb.TLib_Name, 'Individu' as [objectName], 'age' ObjectProp
	FROM TIndividu I JOIN THESAURUS.dbo.TTopic Th on I.Age = Th.TTop_FullPath and Th.TTop_Type = 'âge'
	JOIN THESAURUS.[dbo].[TTopicLibelle] Lb on Lb.[TLib_FK_TTop_ID] = Th.[TTop_PK_ID] and Lb.TLib_FK_TLan_ID='en'


	INSERT INTO #ThesaurusTraduction (FullPath, TLib_Name, [objectName],  ObjectProp)
	select DISTINCT I.Status_ FullPath, lb.TLib_Name, 'Individu' as [objectName], 'Status_' ObjectProp
	FROM TIndividu I JOIN THESAURUS.dbo.TTopic Th on I.Status_ = Th.TTop_FullPath and TTop_ParentID = 223066
	JOIN THESAURUS.[dbo].[TTopicLibelle] Lb on Lb.[TLib_FK_TTop_ID] = Th.[TTop_PK_ID] and Lb.TLib_FK_TLan_ID='en'

	--select * from #ThesaurusTraduction
	CREATE CLUSTERED INDEX IX_TmpThesTrad ON #ThesaurusTraduction(ObjectProp,FullPath)

	IF object_id('tempdb..#PIndividualDeath') IS NOT NULL
		DROP TABLE #PIndividualDeath
	select Pid.fk_individual,stid.id,stid.stationdate,row_number()  over (partition by pid.fk_individual order by stid.stationdate DESC) nb 
	into #PIndividualDeath
	from Tstation Stid  JOIN  TProtocol_Vertebrate_individual_death PID ON  PID.fk_station = STid.id 
	where PID.FK_Individual IS NOT NULL


	IF OBJECT_ID('TmpGIS_AllStations_PTTBirds_With_FirstRelCapData') IS NOT NULL
		DROP TABLE TmpGIS_AllStations_PTTBirds_With_FirstRelCapData

	select  
	i.ID indID , CASE WHEN EN.Deploy=0 THEN NULL ELSE  SN.UnicIdentifier END CurrentPTT
	,CASE WHEN E.deploy=0 and E.StartDate <> l.StationDate THEN NULL ELSE s.UnicIdentifier END [PTT@Station]
	,CASE WHEN E.deploy=0 and E.StartDate <> l.StationDate THEN NULL ELSE isnull(ThMo.TLib_Name,s.model) END  PTTModel@Station 
	,isnull(ThMsSt.TLib_Name,VMS.ValueString) MonitoringStatus@Station,isnull(ThStSt.TLib_Name, VST.ValueString)	SurveyType@Station
	,isnull(Thori.TLib_Name,i.Origin) origin,isnull(ThSex.TLib_Name, i.Sex) Sex,isnull(Thage.TLib_Name,i.Age) Age 
	,isnull(ThIdSt.TLib_Name,i.Status_) CurrentIndividualStatus
	--,i.Status_
	,isnull(Thst.TLib_Name, i.Survey_type) CurrentSurveyType,isnull(ThMS.TLib_Name, i.Monitoring_Status) CurrentMonitoringStatus
    ,l.staID ,CASE WHEN L.type_ ='argos' THEN  50  WHEN l.type_='gps' THEN  40 WHEN l.name ='Vertebrate individual' THEN 100 WHEN l.name ='Release Individual' THEN 20
				 WHEN l.Name ='Vertebrate individual death' THEN 2 WHEN l.name='Nest description' THEN 10 WHEN l.name = 'Capture Individual' THEN 30 ELSE NULL  END staType
	,l.StationDate staDate,	l.LAT,	l.LON,	l.Precision,l.ELE
	,FS.Place RelPlace, r.Country	RelCountry, DATEPART(yyyy,st.StationDate)	RelYear,st.StationDate	RelDate,i.Release_Ring_Code	ReleaseRingCode,CASE WHEN CHARINDEX('>',i.Species) > 0 THEN  REVERSE(LEFT(REVERSE(i.Species), CHARINDEX('>', REVERSE(i.Species)) - 1)) ELSE i.Species END 	SpecieName
	,StiDe.stationdate DeathDate
	into TmpGIS_AllStations_PTTBirds_With_FirstRelCapData
	from [dbo].[TIndividu] I 
	JOIN TIndividualFirstStation F on F.FK_Individual = I.ID and F.FirstStation_ID IS NOT NULL
	JOIN TStation FS ON f.FirstStation_ID = FS.ID
	JOIN  EcoReleve_NARC.dbo.Region R ON FS.FK_Region = R.ID
	JOIN VAllIndividualLocation L on L.FK_Individual = i.id
	LEFT JOIN  EcoReleve_NARC.dbo.Equipment E on E.FK_Individual = I.ID and e.StartDate <= l.stationDate 
								and not exists (select * 
											from EcoReleve_NARC.dbo.Equipment E2 
											where E2.FK_Individual = e.FK_Individual and E2.StartDate > e.StartDate and e2.StartDate < l.stationDate and e2.FK_Sensor in (select id from TSensor where FK_SensorType in (1,2)) 
											)
								and FK_Sensor in (select id from TSensor where FK_SensorType in (1,2))
	LEFT JOIN TSensor S on S.ID = E.FK_Sensor 
	JOIN EcoReleve_NARC.dbo.Equipment EN ON EN.FK_Individual = I.ID and EN.FK_Sensor in (select id from TSensor where FK_SensorType  in (1,2) )
											and not exists (select * 
											from EcoReleve_NARC.dbo.Equipment E3
											where E3.FK_Individual = EN.FK_Individual and E3.StartDate > en.StartDate and e3.FK_Sensor in (select id from TSensor where FK_SensorType in (1,2)) 
											)
	JOIN TSensor SN ON SN.ID = EN.FK_Sensor 
	LEFT JOIN TStation st on F.FirstStation_ID = st.ID
	JOIN EcoReleve_NARC.dbo.IndividualDynProp DPMS ON DPMS.Name = 'Monitoring_Status'
	LEFT JOIN  EcoReleve_NARC.dbo.IndividualDynPropValue VMS on VMS.FK_Individual = i.ID and VMS.StartDate <= l.StationDate and VMS.FK_IndividualDynProp = DPMS.ID
				and not exists (select * from EcoReleve_NARC.dbo.IndividualDynPropValue VMS2 where VMS2.FK_Individual = VMS.FK_Individual and VMS2.FK_IndividualDynProp = VMS.FK_IndividualDynProp and VMS2.StartDate <= l.StationDate and VMS2.StartDate > VMS.StartDate)
	JOIN EcoReleve_NARC.dbo.IndividualDynProp DPSV ON DPSV.Name = 'Survey_Type'
	LEFT JOIN  EcoReleve_NARC.dbo.IndividualDynPropValue VST on VST.FK_Individual = i.ID and VST.StartDate <= l.StationDate and VST.FK_IndividualDynProp = DPSV.ID
				and not exists (select * from EcoReleve_NARC.dbo.IndividualDynPropValue VST2 where VST2.FK_Individual = VST.FK_Individual and VST2.FK_IndividualDynProp = VST.FK_IndividualDynProp and VST2.StartDate <= l.StationDate and VST2.StartDate > VST.StartDate)
	LEFT JOIN #ThesaurusTraduction ThMo ON ThMo.FullPath = s.Model and ThMo.objectName ='Sensor' 
	LEFT JOIN #ThesaurusTraduction ThMsSt ON ThMsSt.FullPath = VMS.ValueString and ThMsSt.ObjectProp = 'statut de suivis'
	LEFT JOIN #ThesaurusTraduction ThStSt ON ThStSt.FullPath = VST.ValueString  and ThStSt.ObjectProp = 'type de suivis'
	LEFT JOIN #ThesaurusTraduction ThOri ON ThOri.FullPath = i.Origin and ThOri.ObjectProp = 'origine' --and ThOri.objectName ='Individu' 
	LEFT JOIN #ThesaurusTraduction ThSex ON ThSex.FullPath = i.Sex  and ThSex.ObjectProp = 'sex'
	LEFT JOIN #ThesaurusTraduction ThAge ON ThAge.FullPath = i.Age and ThAge.ObjectProp = 'age'
	LEFT JOIN #ThesaurusTraduction ThSt ON ThSt.FullPath = i.Survey_type and  ThSt.ObjectProp = 'type de suivis'
	LEFT JOIN #ThesaurusTraduction ThMs ON ThMs.FullPath = i.Monitoring_Status  and ThMs.ObjectProp = 'statut de suivis'
	LEFT JOIN #ThesaurusTraduction ThIdSt ON ThIdSt.FullPath = i.Status_  and ThIdSt.ObjectProp = 'Status_'
	LEFT JOIN  #PIndividualDeath StiDe ON StiDe.FK_Individual = I.iD and StiDe.Nb = 1
	WHERE L.stationDate <= isnull(StiDe.stationdate,getdate()+1)
	CREATE INDEX IX_GIS_AllStations_PTTBirds_With_FirstRelCapData ON TmpGIS_AllStations_PTTBirds_With_FirstRelCapData(indID,staDate)

		IF object_id('GIS_AllStations_PTTBirds_With_FirstRelCapData') IS NOT NULL 
			DROP TABLE  GIS_AllStations_PTTBirds_With_FirstRelCapData
	
		exec sp_rename 'TmpGIS_AllStations_PTTBirds_With_FirstRelCapData','GIS_AllStations_PTTBirds_With_FirstRelCapData'

END


GO


