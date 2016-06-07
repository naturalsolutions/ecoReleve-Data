DECLARE @NbIter INT
DECLARE @compteur INT

SET @NbIter=20
SET @COmpteur = 0




IF object_id('tempdb..#ListError') IS NOT NULL
		DROP TABLE #ListError



SELECT F.[indID]
		,F.[staDate] staDateIni
		  ,F.[staDate]
		  ,F.[CurrentPTT] CurrentPTTIni
		  ,F.[CurrentPTT]
		  ,F.[PTT@Station] PTT@StationIni
		  ,F.[PTT@Station]
		  --,F.[PTTModel@Station]
		 -- ,F.[PTTModel@Station]
		 ,F.[MonitoringStatus@Station] MonitoringStatus@StationIni
		 ,F.[MonitoringStatus@Station]
		  ,F.[SurveyType@Station] SurveyType@StationIni
		  ,F.[SurveyType@Station]
		  ,F.[Origin] OriginIni
		  ,F.[Origin]
		  ,F.[Sex] SexIni
		  ,F.[Sex]
		  ,F.[Age] AgeIni
		  ,F.[Age]
		  --,F.[CurrentIndividualStatus]
		  ,F.[CurrentSurveyType] CurrentSurveyTypeIni
		  ,F.[CurrentSurveyType]
		  ,F.[CurrentMonitoringStatus] CurrentMonitoringStatusIni
		  ,F.[CurrentMonitoringStatus]
		  --,F.[staID]
		  ,convert(VARCHAR(200),NULL) staTypeIni
		  ,convert(VARCHAR(200),NULL) staType
		  ,F.[LAT] LATIni
		  ,F.[LAT]
		  ,F.[LON] LONIni
		  ,F.[LON]
		  ,F.[Precision] PrecisionIni
		  ,F.[Precision]
		  ,F.[ELE] ELEIni
		  ,F.[ELE]
		  ,F.[RelPlace] RelPlaceIni
		  ,F.[RelPlace]
		  ,F.[RelCountry]  RelCountryIni
		  ,F.[RelCountry]
		  ,F.[RelYear] RelYearIni
		  ,F.[RelYear]
		  ,F.[RelDate] RelDateIni
		  ,F.[RelDate]
		  ,F.[ReleaseRingCode] ReleaseRingCodeIni
		  ,F.[ReleaseRingCode]
		  ,F.[SpecieName] SpecieNameIni
		  ,F.[SpecieName]
		  ,F.[DeathDate] DeathDateIni
		  ,F.DeathDate
		  ,convert(varchar(500),'') zeSource
		  into #ListError
		   from [GIS_AllStations_PTTBirds_With_FirstRelCapData] F
		   where 1=0



DECLARE @NbIndiv INT

	select @NbIndiv=count(*)   FROM TIndividu

	print @NbIndiv


WHILE @compteur < @NbIter
BEGIN

	IF object_id('tempdb..#ListIndiv') IS NOT NULL
			DROP TABLE #ListIndiv


	



	DECLARE @NbROw INT


	SET @NbRow = FLOOR(@NbIndiv*RAND())


	select * 
	into #ListIndiv 
	from TIndividu I
	order by I.ID OFFSET @NbRow ROWS
	FETCH NEXT 100 ROWS ONLY
	
	


	insert into #ListError

	SELECT F.[indID]
		 ,F.[staDate] staDate
		  ,N.[staDate]
		  ,F.[CurrentPTT] CurrentPTT
		  ,N.[CurrentPTT]
		  ,F.[PTT@Station] PTT@Station
		  ,N.[PTT@Station]
		  --,F.[PTTModel@Station]
		 -- ,N.[PTTModel@Station]
		 ,F.[MonitoringStatus@Station] MonitoringStatus@Station
		 ,N.[MonitoringStatus@Station]
		  ,F.[SurveyType@Station] SurveyType@Station
		  ,N.[SurveyType@Station]
		  ,F.[Origin] Origni
		  ,N.[Origin]
		  ,F.[Sex] Sex
		  ,N.[Sex]
		  ,F.[Age] Age
		  ,N.[Age]
		  --,F.[CurrentIndividualStatus]
		  ,F.[CurrentSurveyType] CurrentSurveyType
		  ,N.[CurrentSurveyType]
		  ,F.[CurrentMonitoringStatus] CurrentMonitoringStatus
		  ,N.[CurrentMonitoringStatus]
		  --,F.[staID]
		  ,F.[staType] staType
		  ,N.[staType]
		  ,F.[LAT] LAT
		  ,N.[LAT]
		  ,F.[LON] LON
		  ,N.[LON]
		  ,F.[Precision] 
		  ,N.[Precision]
		  ,F.[ELE] ELE
		  ,N.[ELE]
		  ,F.[RelPlace]
		  ,N.[RelPlace]
		  ,F.[RelCountry]
		  ,N.[RelCountry]
		  ,F.[RelYear] RelYear
		  ,N.[RelYear]
		  ,F.[RelDate] RelDate
		  ,N.[RelDate]
		  ,F.[ReleaseRingCode] ReleaseRingCode
		  ,N.[ReleaseRingCode]
		  ,F.[SpecieName] SpecieName
		  ,N.[SpecieName]
		  ,F.[DeathDate] DeathDate
		  ,N.DeathDate
		  ,'Old puis New' zeSource
		   from 
	(SELECT [indID]
		  ,convert(varchar,[CurrentPTT]) [CurrentPTT]
		  ,convert(varchar,[PTT@Station]) [PTT@Station]
		 -- ,[PTTModel@Station]
		 ,[MonitoringStatus@Station]
		  ,[SurveyType@Station]
		  ,[Origin]
		  ,replace([Sex],'undetermined','(indeterminate)') Sex
		  ,[Age]
		  --,[CurrentIndividualStatus]
		  ,[CurrentSurveyType]
		  ,[CurrentMonitoringStatus]
		  --,[staID]
		  ,[staType]
		  ,[staDate]
		  ,[LAT]
		  ,[LON]
		  ,[Precision]
		  ,[ELE]
		  ,[RelPlace]
		  ,[RelCountry]
		  ,[RelYear]
		  ,[RelDate]
		  ,[ReleaseRingCode]
		  ,[SpecieName]
		  ,[DeathDate]
	  FROM [GIS_AllStations_PTTBirds_With_FirstRelCapData_old]
	  where indid in (select id from #ListIndiv)
	  EXCEPT
	  SELECT 
	   [indID]
		  ,convert(varchar,[CurrentPTT]) [CurrentPTT]
		  ,convert(varchar,[PTT@Station]) [PTT@Station]
		  --,[PTTModel@Station]
		 ,[MonitoringStatus@Station]
		  ,[SurveyType@Station]
		  ,[Origin]
		  ,[Sex]
		  ,[Age]
		  --,[CurrentIndividualStatus]
		  ,[CurrentSurveyType]
		  ,[CurrentMonitoringStatus]
		  --,[staID]
		  ,[staType]
		  ,[staDate]
		  ,[LAT]
		  ,[LON]
		  ,[Precision]
		  ,[ELE]
		  ,[RelPlace]
		  ,[RelCountry]
		  ,[RelYear]
		  ,[RelDate]
		  ,[ReleaseRingCode]
		  ,[SpecieName]
		  ,[DeathDate]
	  FROM [GIS_AllStations_PTTBirds_With_FirstRelCapData]
	  where indid in (select id from #ListIndiv)
	 )
	  F LEFT JOIN [EcoReleve_Export_NARC].[dbo].[GIS_AllStations_PTTBirds_With_FirstRelCapData] N ON F.[indID] = n.[indID] and F.staDate = n.StaDate
	  where F.indid in (select id from #ListIndiv)
	  order by F.staDate





  insert into #ListError

	SELECT  F.[indID]
		 ,F.[staDate] staDate
		  ,N.[staDate]
		  ,F.[CurrentPTT] CurrentPTT
		  ,N.[CurrentPTT]
		  ,F.[PTT@Station] PTT@Station
		  ,N.[PTT@Station]
		  --,F.[PTTModel@Station]
		 -- ,N.[PTTModel@Station]
		 ,F.[MonitoringStatus@Station] MonitoringStatus@Station
		 ,N.[MonitoringStatus@Station]
		  ,F.[SurveyType@Station] SurveyType@Station
		  ,N.[SurveyType@Station]
		  ,F.[Origin] Origni
		  ,N.[Origin]
		  ,F.[Sex] Sex
		  ,N.[Sex]
		  ,F.[Age] Age
		  ,N.[Age]
		  --,F.[CurrentIndividualStatus]
		  ,F.[CurrentSurveyType] CurrentSurveyType
		  ,N.[CurrentSurveyType]
		  ,F.[CurrentMonitoringStatus] CurrentMonitoringStatus
		  ,N.[CurrentMonitoringStatus]
		  --,F.[staID]
		  ,F.[staType] staType
		  ,N.[staType]
		  ,F.[LAT] LAT
		  ,N.[LAT]
		  ,F.[LON] LON
		  ,N.[LON]
		  ,F.[Precision] 
		  ,N.[Precision]
		  ,F.[ELE] ELE
		  ,N.[ELE]
		  ,F.[RelPlace]
		  ,N.[RelPlace]
		  ,F.[RelCountry]
		  ,N.[RelCountry]
		  ,F.[RelYear] RelYear
		  ,N.[RelYear]
		  ,F.[RelDate] RelDate
		  ,N.[RelDate]
		  ,F.[ReleaseRingCode] ReleaseRingCode
		  ,N.[ReleaseRingCode]
		  ,F.[SpecieName] SpecieName
		  ,N.[SpecieName]
		  ,F.[DeathDate] DeathDate
		  ,N.DeathDate
		  ,'New puis Old' zeSource
		   from 
	(SELECT [indID]
		  ,convert(varchar,[CurrentPTT]) [CurrentPTT]
		  ,convert(varchar,[PTT@Station]) [PTT@Station]
		 -- ,[PTTModel@Station]
		 ,[MonitoringStatus@Station]
		  ,[SurveyType@Station]
		  ,[Origin]
		  ,[Sex]
		  ,[Age]
		  --,[CurrentIndividualStatus]
		  ,[CurrentSurveyType]
		  ,[CurrentMonitoringStatus]
		  --,[staID]
		  ,[staType]
		  ,[staDate]
		  ,[LAT]
		  ,[LON]
		  ,[Precision]
		  ,[ELE]
		  ,[RelPlace]
		  ,[RelCountry]
		  ,[RelYear]
		  ,[RelDate]
		  ,[ReleaseRingCode]
		  ,[SpecieName]
		  ,[DeathDate]
	  FROM [GIS_AllStations_PTTBirds_With_FirstRelCapData]
	  where indid in (select id from #ListIndiv)
	  EXCEPT
	  SELECT 
	   [indID]
		  ,convert(varchar,[CurrentPTT]) [CurrentPTT]
		  ,convert(varchar,[PTT@Station]) [PTT@Station]
		  --,[PTTModel@Station]
		 ,[MonitoringStatus@Station]
		  ,[SurveyType@Station]
		  ,[Origin]
		  ,replace([Sex],'undetermined','(indeterminate)') Sex
		  ,[Age]
		  --,[CurrentIndividualStatus]
		  ,[CurrentSurveyType]
		  ,[CurrentMonitoringStatus]
		  --,[staID]
		  ,[staType]
		  ,[staDate]
		  ,[LAT]
		  ,[LON]
		  ,[Precision]
		  ,[ELE]
		  ,[RelPlace]
		  ,[RelCountry]
		  ,[RelYear]
		  ,[RelDate]
		  ,[ReleaseRingCode]
		  ,[SpecieName]
		  ,[DeathDate]
	  FROM [GIS_AllStations_PTTBirds_With_FirstRelCapData_old]
	  where indid in (select id from #ListIndiv)
	 )
	  F LEFT JOIN [EcoReleve_Export_NARC].[dbo].[GIS_AllStations_PTTBirds_With_FirstRelCapData_old] N ON F.[indID] = n.[indID] and F.staDate = n.StaDate
	  where F.indid in (select id from #ListIndiv)
	  order by F.indID,F.staDate

	  SET @compteur = @compteur+1
END


select * from #ListError where indID not in ( 4622447)
order by indid,staDateIni

--select * from #ListError where indID = 260

--select distinct indID from [dbo].[GIS_AllStations_PTTBirds_With_FirstRelCapData_Old] where indID
--in (
--select distinct indid from #ListError)
