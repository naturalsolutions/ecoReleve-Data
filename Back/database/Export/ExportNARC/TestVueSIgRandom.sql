

IF object_id('tempdb..#ListError') IS NOT NULL
	BEGIN
		DROP TABLE #ListError
	END
GO


DECLARE @NbIter INT
DECLARE @compteur INT

SET @NbIter=2
SET @COmpteur = 0

SELECT 
		  [Ind_ID] Ind_ID_ini
		  ,NULL [Ind_ID] 
		  ,[staDate] staDate_ini
		  ,[staDate]
		  ,[PTT_Station] PTT_Station_ini
		  ,[PTT_Station] 
		  ,[TypeOfData] TypeOfData_ini
		  ,[TypeOfData] 
		  ,[Precision] Precision_ini
		  ,[Precision] 
		  ,[RelPlace] RelPlace_ini
		  ,[RelPlace]
		  ,[RelCountry] RelCountry_init
		  ,[RelCountry] 
		  ,[Origin] Origin_ini
		  ,[Origin]
		  ,[RelYear] [RelYear_ini]
		  ,[RelYear]
		  ,[RelDate] [RelDate_ini]
		  ,[RelDate]
		  ,[Sex] [Sex_ini]
		  ,[Sex]
		  ,[Age] [Age_ini]
		  ,[Age]
		  ,[ReleaseRingCode] [ReleaseRingCode_ini]
		  ,[ReleaseRingCode]
		  ,[MonitoringStatus@Station] [MonitoringStatus@Station_ini]
		  ,[MonitoringStatus@Station]
		  ,[SurveyType@Station] [SurveyType@Station_ini]
		  ,[SurveyType@Station]
		  ,[PTTModel@Station] [PTTModel@Station_init]
		  ,[PTTModel@Station]
		  --,[CurrentMonitoringStatus] [CurrentMonitoringStatus_init] 
		  --,[CurrentMonitoringStatus]
		  ,[CurrentIndividualStatus] [CurrentIndividualStatus_inti]
		  ,[CurrentIndividualStatus]
		  ,[CurrentSurveyType] [CurrentSurveyType_ini]
		  ,[CurrentSurveyType]
		  ,[CurrentPTT] [CurrentPTT_ini]
		  ,[CurrentPTT]
		  ,[staType] [staType_ini] 
		  ,[staType]
		  ,[DeathDate] [DeathDate_ini]
		  ,[DeathDate]
		  ,[LAT] [LAT_ini] 
		  ,[LAT]
		  ,[LON] [LON_ini]
		  ,[LON]
		  ,[ELE] [ELE_ini]
		  ,[ELE]
		  ,[SpecieName] [SpecieName_ini]
		  ,[SpecieName]
		  ,convert(varchar(500),'') zeSource
		  into #ListError
		   from [Ecolo_AllStations_PTT_UAE] F
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
	FETCH NEXT 15 ROWS ONLY



	insert into #ListError

	SELECT 
		  F.[Ind_ID] Ind_ID_ini
		  ,N.[Ind_ID] 
		  ,F.[staDate] staDate_ini
		  ,N.[staDate]
		  ,F.[PTT_Station] PTT_Station_ini
		  ,N.[PTT_Station] 
		  ,F.[TypeOfData] TypeOfData_ini
		  ,N.[TypeOfData] 
		  ,F.[Precision] Precision_ini
		  ,N.[Precision] 
		  ,F.[RelPlace] RelPlace_ini
		  ,n.[RelPlace]
		  ,F.[RelCountry] RelCountry_init
		  ,N.[RelCountry] 
		  ,F.[Origin] Origin_ini
		  ,N.[Origin]
		  ,F.[RelYear] [RelYear_ini]
		  ,N.[RelYear]
		  ,F.[RelDate] [RelDate_ini]
		  ,N.[RelDate]
		  ,F.[Sex] [Sex_ini]
		  ,N.[Sex]
		  ,F.[Age] [Age_ini]
		  ,N.[Age]
		  ,F.[ReleaseRingCode] [ReleaseRingCode_ini]
		  ,n.[ReleaseRingCode]
		  ,F.[MonitoringStatus@Station] [MonitoringStatus@Station_ini]
		  ,N.[MonitoringStatus@Station]
		  ,F.[SurveyType@Station] [SurveyType@Station_ini]
		  ,N.[SurveyType@Station]
		  ,F.[PTTModel@Station] [PTTModel@Station_init]
		  ,N.[PTTModel@Station]
		  --,F.[CurrentMonitoringStatus] [CurrentMonitoringStatus_init] 
		  --,N.[CurrentMonitoringStatus]
		  ,F.[CurrentIndividualStatus] [CurrentIndividualStatus_inti]
		  ,N.[CurrentIndividualStatus]
		  ,F.[CurrentSurveyType] [CurrentSurveyType_ini]
		  ,N.[CurrentSurveyType]
		  ,F.[CurrentPTT] [CurrentPTT_ini]
		  ,N.[CurrentPTT]
		  ,F.[staType] [staType_ini] 
		  ,N.[staType]
		  ,F.[DeathDate] [DeathDate_ini]
		  ,N.[DeathDate]
		  ,F.[LAT] [LAT_ini] 
		  ,N.[LAT]
		  ,F.[LON] [LON_ini]
		  ,N.[LON]
		  ,F.[ELE] [ELE_ini]
		  ,N.[ELE]
		  ,F.[SpecieName] [SpecieName_ini]
		  ,N.[SpecieName]
		  ,'Old puis New' zeSource
		   from 
	(SELECT [Ind_ID]
      ,[staDate]
      ,[PTT_Station]
      ,[TypeOfData]
      ,[Precision]
      ,[RelPlace]
      ,[RelCountry]
      ,[Origin]
      ,[RelYear]
      ,[RelDate]
      ,[Sex]
      ,[Age]
      ,[ReleaseRingCode]
      ,[MonitoringStatus@Station]
      ,[SurveyType@Station]
      ,[PTTModel@Station]
      --,[CurrentMonitoringStatus]
      ,[CurrentIndividualStatus]
      ,[CurrentSurveyType]
      ,[CurrentPTT]
      ,[staType]
      ,[DeathDate]
      ,[LAT]
      ,[LON]
      ,[ELE]
      ,[SpecieName]
	  FROM Ecolo_AllStations_PTT_UAE_OLD
	  where ind_id in (select id from #ListIndiv)
	  EXCEPT
	  SELECT 
	   [Ind_ID]
      ,[staDate]
      ,[PTT_Station]
      ,[TypeOfData]
      ,[Precision]
      ,[RelPlace]
      ,[RelCountry]
      ,[Origin]
      ,[RelYear]
      ,[RelDate]
      ,[Sex]
      ,[Age]
      ,[ReleaseRingCode]
      ,[MonitoringStatus@Station]
      ,[SurveyType@Station]
      ,[PTTModel@Station]
      --,[CurrentMonitoringStatus]
      ,[CurrentIndividualStatus]
      ,[CurrentSurveyType]
      ,[CurrentPTT]
      ,[staType]
      ,[DeathDate]
      ,[LAT]
      ,[LON]
      ,[ELE]
      ,[SpecieName]
	  FROM Ecolo_AllStations_PTT_UAE
	  where ind_id in (select id from #ListIndiv)
	 )
	  F LEFT JOIN Ecolo_AllStations_PTT_UAE N ON F.[ind_ID] = n.[ind_ID] and F.staDate = n.StaDate
	  where F.ind_id in (select id from #ListIndiv)
	  order by F.staDate


	  insert into #ListError

	SELECT 
		  F.[Ind_ID] Ind_ID_ini
		  ,N.[Ind_ID] 
		  ,F.[staDate] staDate_ini
		  ,N.[staDate]
		  ,F.[PTT_Station] PTT_Station_ini
		  ,N.[PTT_Station] 
		  ,F.[TypeOfData] TypeOfData_ini
		  ,N.[TypeOfData] 
		  ,F.[Precision] Precision_ini
		  ,N.[Precision] 
		  ,F.[RelPlace] RelPlace_ini
		  ,n.[RelPlace]
		  ,F.[RelCountry] RelCountry_init
		  ,N.[RelCountry] 
		  ,F.[Origin] Origin_ini
		  ,N.[Origin]
		  ,F.[RelYear] [RelYear_ini]
		  ,N.[RelYear]
		  ,F.[RelDate] [RelDate_ini]
		  ,N.[RelDate]
		  ,F.[Sex] [Sex_ini]
		  ,N.[Sex]
		  ,F.[Age] [Age_ini]
		  ,N.[Age]
		  ,F.[ReleaseRingCode] [ReleaseRingCode_ini]
		  ,n.[ReleaseRingCode]
		  ,F.[MonitoringStatus@Station] [MonitoringStatus@Station_ini]
		  ,N.[MonitoringStatus@Station]
		  ,F.[SurveyType@Station] [SurveyType@Station_ini]
		  ,N.[SurveyType@Station]
		  ,F.[PTTModel@Station] [PTTModel@Station_init]
		  ,N.[PTTModel@Station]
		  --,F.[CurrentMonitoringStatus] [CurrentMonitoringStatus_init] 
		  --,N.[CurrentMonitoringStatus]
		  ,F.[CurrentIndividualStatus] [CurrentIndividualStatus_inti]
		  ,N.[CurrentIndividualStatus]
		  ,F.[CurrentSurveyType] [CurrentSurveyType_ini]
		  ,N.[CurrentSurveyType]
		  ,F.[CurrentPTT] [CurrentPTT_ini]
		  ,N.[CurrentPTT]
		  ,F.[staType] [staType_ini] 
		  ,N.[staType]
		  ,F.[DeathDate] [DeathDate_ini]
		  ,N.[DeathDate]
		  ,F.[LAT] [LAT_ini] 
		  ,N.[LAT]
		  ,F.[LON] [LON_ini]
		  ,N.[LON]
		  ,F.[ELE] [ELE_ini]
		  ,N.[ELE]
		  ,F.[SpecieName] [SpecieName_ini]
		  ,N.[SpecieName]
		  ,'New puis Old' zeSource
		   from 
	(SELECT [Ind_ID]
      ,[staDate]
      ,[PTT_Station]
      ,[TypeOfData]
      ,[Precision]
      ,[RelPlace]
      ,[RelCountry]
      ,[Origin]
      ,[RelYear]
      ,[RelDate]
      ,[Sex]
      ,[Age]
      ,[ReleaseRingCode]
      ,[MonitoringStatus@Station]
      ,[SurveyType@Station]
      ,[PTTModel@Station]
      --,[CurrentMonitoringStatus]
      ,[CurrentIndividualStatus]
      ,[CurrentSurveyType]
      ,[CurrentPTT]
      ,[staType]
      ,[DeathDate]
      ,[LAT]
      ,[LON]
      ,[ELE]
      ,[SpecieName]
	  FROM Ecolo_AllStations_PTT_UAE
	  where ind_id in (select id from #ListIndiv)
	  EXCEPT
	  SELECT 
	   [Ind_ID]
      ,[staDate]
      ,[PTT_Station]
      ,[TypeOfData]
      ,[Precision]
      ,[RelPlace]
      ,[RelCountry]
      ,[Origin]
      ,[RelYear]
      ,[RelDate]
      ,[Sex]
      ,[Age]
      ,[ReleaseRingCode]
      ,[MonitoringStatus@Station]
      ,[SurveyType@Station]
      ,[PTTModel@Station]
      --,[CurrentMonitoringStatus]
      ,[CurrentIndividualStatus]
      ,[CurrentSurveyType]
      ,[CurrentPTT]
      ,[staType]
      ,[DeathDate]
      ,[LAT]
      ,[LON]
      ,[ELE]
      ,[SpecieName]
	  FROM Ecolo_AllStations_PTT_UAE_OLD
	  where ind_id in (select id from #ListIndiv)
	 )
	  F LEFT JOIN Ecolo_AllStations_PTT_UAE_OLD N ON F.[ind_ID] = n.[ind_ID] and F.staDate = n.StaDate
	  where F.ind_id in (select id from #ListIndiv)
	  order by F.staDate


  

	  SET @compteur = @compteur+1
END


select * from #ListError 
order by Ind_ID_ini,staDate_Ini

--select * from #ListError where indID = 260

--select distinct indID from [dbo].[GIS_AllStations_PTTBirds_With_FirstRelCapData_Old] where indID
--in (
--select distinct indid from #ListError)
