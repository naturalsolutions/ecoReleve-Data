
IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'pr_GIS_AllStations_PTTBirds_With_FirstRelCapData ')
	DROP PROCEDURE pr_GIS_AllStations_PTTBirds_With_FirstRelCapData
GO

CREATE PROCEDURE pr_GIS_AllStations_PTTBirds_With_FirstRelCapData 
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
	select DISTINCT I.Origin FullPath, lb.TLib_Name, 'Individu' as [objectName], 'Origine' ObjectProp
	FROM TIndividu I JOIN THESAURUS.dbo.TTopic Th on I.Origin = Th.TTop_FullPath and Th.TTop_Type = 'origine'
	JOIN THESAURUS.[dbo].[TTopicLibelle] Lb on Lb.[TLib_FK_TTop_ID] = Th.[TTop_PK_ID] and Lb.TLib_FK_TLan_ID='en'

	INSERT INTO #ThesaurusTraduction (FullPath, TLib_Name, [objectName],  ObjectProp)
	select DISTINCT I.Sex FullPath, lb.TLib_Name, 'Individu' as [objectName], 'Sex' ObjectProp
	FROM TIndividu I JOIN THESAURUS.dbo.TTopic Th on I.Sex = Th.TTop_FullPath and Th.TTop_Type = 'sexe'
	JOIN THESAURUS.[dbo].[TTopicLibelle] Lb on Lb.[TLib_FK_TTop_ID] = Th.[TTop_PK_ID] and Lb.TLib_FK_TLan_ID='en'

	INSERT INTO #ThesaurusTraduction (FullPath, TLib_Name, [objectName],  ObjectProp)
	select DISTINCT I.Age FullPath, lb.TLib_Name, 'Individu' as [objectName], 'Age' ObjectProp
	FROM TIndividu I JOIN THESAURUS.dbo.TTopic Th on I.Age = Th.TTop_FullPath and Th.TTop_Type = 'âge'
	JOIN THESAURUS.[dbo].[TTopicLibelle] Lb on Lb.[TLib_FK_TTop_ID] = Th.[TTop_PK_ID] and Lb.TLib_FK_TLan_ID='en'


	IF OBJECT_ID('TmpGIS_AllStations_PTTBirds_With_FirstRelCapData') IS NOT NULL
		DROP TABLE TmpGIS_AllStations_PTTBirds_With_FirstRelCapData

	select  i.ID indID ,sN.UnicIdentifier CurrentPTT,s.UnicIdentifier [PTT@Station],isnull(ThMo.TLib_Name,s.model)   PTTModel@Station
	,isnull(ThMsSt.TLib_Name,VMS.ValueString) MonitoringStatus@Station,isnull(ThStSt.TLib_Name, VST.ValueString)	SurveyType@Station
	,isnull(Thori.TLib_Name,i.Origin) origin,isnull(ThSex.TLib_Name, i.Sex) Sex,isnull(Thage.TLib_Name,i.Age) Age ,i.Status_ CurrentIndividualStatus
	,isnull(Thst.TLib_Name, i.Survey_type) CurrentSurveyType,isnull(ThMS.TLib_Name, i.Monitoring_Status) CurrentMonitoringStatus
    ,l.staID ,10 staType,l.StationDate staDate,	l.LAT,	l.LON,	l.Precision,l.ELE
	,NULL RelPlace, NULL	RelCountry, DATEPART(yyyy,st.StationDate)	RelYear,st.StationDate	RelDate,i.Release_Ring_Code	ReleaseRingCode,CASE WHEN CHARINDEX('>',i.Species) > 0 THEN  REVERSE(LEFT(REVERSE(i.Species), CHARINDEX('>', REVERSE(i.Species)) - 1)) ELSE i.Species END 	SpecieName,i.Death_date	DeathDate
	into TmpGIS_AllStations_PTTBirds_With_FirstRelCapData
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
	LEFT JOIN TStation st on F.FirstStation_ID = st.ID
	JOIN EcoReleve_NARC.dbo.IndividualDynProp DPMS ON DPMS.Name = 'Monitoring_Status'
	LEFT JOIN  EcoReleve_NARC.dbo.IndividualDynPropValue VMS on VMS.FK_Individual = i.ID and VMS.StartDate <= l.StationDate and VMS.FK_IndividualDynProp = DPMS.ID
				and not exists (select * from EcoReleve_NARC.dbo.IndividualDynPropValue VMS2 where VMS2.FK_Individual = VMS.FK_Individual and VMS2.FK_IndividualDynProp = VMS.FK_IndividualDynProp and VMS2.StartDate <= l.StationDate and VMS2.StartDate > VMS.StartDate)
	JOIN EcoReleve_NARC.dbo.IndividualDynProp DPSV ON DPSV.Name = 'Survey_Type'
	LEFT JOIN  EcoReleve_NARC.dbo.IndividualDynPropValue VST on VST.FK_Individual = i.ID and VST.StartDate <= l.StationDate and VST.FK_IndividualDynProp = DPSV.ID
				and not exists (select * from EcoReleve_NARC.dbo.IndividualDynPropValue VST2 where VST2.FK_Individual = VST.FK_Individual and VST2.FK_IndividualDynProp = VST.FK_IndividualDynProp and VST2.StartDate <= l.StationDate and VST2.StartDate > VST.StartDate)
	LEFT JOIN #ThesaurusTraduction ThMo ON ThMo.FullPath = s.Model and ThMo.objectName ='Sensor' 
	LEFT JOIN #ThesaurusTraduction ThMsSt ON ThMsSt.FullPath = VMS.ValueString and ThMsSt.objectName ='individu' and ThMsSt.ObjectProp = 'statut de suivis'
	LEFT JOIN #ThesaurusTraduction ThStSt ON ThStSt.FullPath = VST.ValueString and ThStSt.objectName ='individu' and ThStSt.ObjectProp = 'type de suivis'
	LEFT JOIN #ThesaurusTraduction ThOri ON ThOri.FullPath = i.Origin and ThStSt.objectName ='individu' and ThStSt.ObjectProp = 'origine'
	LEFT JOIN #ThesaurusTraduction ThSex ON ThSex.FullPath = i.Sex and ThSex.objectName ='individu' and ThStSt.ObjectProp = 'sexe'
	LEFT JOIN #ThesaurusTraduction ThAge ON ThAge.FullPath = i.Age and ThAge.objectName ='individu' and ThStSt.ObjectProp = 'age'
	LEFT JOIN #ThesaurusTraduction ThSt ON ThSt.FullPath = i.Survey_type and Thst.objectName ='individu' and ThSt.ObjectProp = 'type de suivis'
	LEFT JOIN #ThesaurusTraduction ThMs ON ThMs.FullPath = i.Monitoring_Status and ThMs.objectName ='individu' and ThSt.ObjectProp = 'statut de suivis'

	CREATE INDEX IX_GIS_AllStations_PTTBirds_With_FirstRelCapData ON TmpGIS_AllStations_PTTBirds_With_FirstRelCapData(indID)

		IF object_id('GIS_AllStations_PTTBirds_With_FirstRelCapData') IS NOT NULL 
			DROP TABLE  GIS_AllStations_PTTBirds_With_FirstRelCapData
	
		exec sp_rename 'TmpGIS_AllStations_PTTBirds_With_FirstRelCapData','GIS_AllStations_PTTBirds_With_FirstRelCapData'

END

