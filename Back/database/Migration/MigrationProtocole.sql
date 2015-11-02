
DECLARE @ProtocoleName VARCHAR(255), @TableName VARCHAR(255) 
DECLARE @Req NVARCHAR(4000)
DECLARE @Id_Prot_Type INT

/*

TODO insertion de toutes les stations quel que soit le protocole


	INSERT INTO [dbo].[Station]
           ([StationDate]
           ,[Name]
           ,[LAT]
           ,[LON]
           ,[ELE]
           ,[precision]
           ,[fieldActivityId]
           ,[creator]
           ,[creationDate]
           ,[FK_StationType]
           ,[FK_Region]
           ,[FK_MonitoredSite]
           ,[Place])
		   select DISTINCT [DATE],S.Name,S.LAT,S.LON,S.ELE,S.precision,FA.ID,1,S.Creation_date,st.id,R.ID,NULL,S.Place
		   from [ECWP-eReleveData].dbo.TStations S 
		   LEFT JOIN fieldActivity FA on FA.Name = S.FieldActivity_Name 
		   JOIN StationType st ON  st.name = 'standard'
		   LEFT JOIN Region R on r.Region = S.Region
		   JOIN [ECWP-eReleveData].dbo.TProtocol_Chiroptera_capture P on P.FK_TSta_ID = S.TSta_PK_ID
		   WHERe NOT EXISTS (select * from Station S2 where S2.LAT = S.LAT AND S2.LON = S.LON AND s2.LAT = S.LAT and S.[DATE] = S2.StationDate)
		   */



SET @ProtocoleName = 'Chiroptera capture'

SELECT @Id_Prot_Type = ID from ProtocoleType pt where pt.Name = @ProtocoleName

SELECT @TableName=TableName  
from [dbo].[MigrationConfigurationProtocoleList] L
where L.[ProtocoleName] = @ProtocoleName

SET @Req = '@Debut'

select  @TableName

	select @Req = @Req + 'union all ' + + char(13) + ' select ''' + O.Name + ''',convert(varchar(255),P.[' + S_C.name + '])  '  
	FROM ObservationDynProp O 
	LEFT JOIN MigrationConfigurationProtocoleList PL on PL.ProtocoleName = [ProtocoleName]
	LEFT JOIN [dbo].[MigrationConfigurationProtocoleContent] PC ON PC.[fk_ConfigurationProtocole] = PL.ID and o.Name = [ColumnName]
	JOIN [ECWP-eReleveData].dbo.sysobjects S_O on s_o.name =@TableName 
	JOIN [ECWP-eReleveData].dbo.syscolumns S_C on o.Name = isnull(PC.[ColumnName],S_C.name) and S_C.id = S_o.id
	

	SET @Req = replace(@Req,'@Debutunion all','')
	IF object_id('tempdb..#ProtValeur') IS NOT NULL
		DROP TABLE #ProtValeur
	CREATE TABLE #ProtValeur (FK_Station int,fk_protocole int,ValName VARCHAR(250),Valeur VARCHAR(250))
	
	SET @Req = ' select S2.ID ,pk , ValName,Valeur from [ECWP-eReleveData].dbo.' + @TableName + ' P JOIN  [ECWP-eReleveData].dbo.TStations S ON  P.FK_TSta_ID = S.TSta_PK_ID JOIN Station S2 ON s2.LAT = S.LAT and S2.LON = S.LOn and s.[Date] = S2.StationDate  cross apply ( ' + @Req + ') c (ValName,Valeur)'
	select @Req
	
	insert into #ProtValeur
	execute(@Req)
	

	INSERT INTO [dbo].[Observation]
           ([FK_ProtocoleType]
           ,[FK_Station]
           ,[creationDate]
           ,[Parent_Observation]
           ,[FK_Individual]
		   ,original_id)

	select DISTINCT @Id_Prot_Type,
	s.id,S.creationDate,NULL,NULL,V.fk_protocole
	from #ProtValeur V 
	--JOIN ObservationDynProp O on V.ValName = o.Name 
	JOIN Station S on V.FK_Station = S.ID
	
	select * from #ProtValeur


INSERT INTO [dbo].[ObservationDynPropValue]
           ([StartDate]
           ,[ValueInt]
           ,[ValueString]
           ,[ValueDate]
           ,[ValueFloat]
           ,[FK_ObservationDynProp]
           ,[FK_Observation])

	select S.StationDate 
	,CASE WHEN o.TypeProp ='Integer' THEN V.Valeur ELSE NULL END
	,CASE WHEN o.TypeProp ='String' THEN V.Valeur ELSE NULL END
	,CASE WHEN o.TypeProp ='Date' THEN convert(datetime,V.Valeur,103) ELSE NULL END
	,CASE WHEN o.TypeProp ='Float' THEN V.Valeur ELSE NULL END
	,o.ID
	,Os.id
	,o.Name
	,o.TypeProp
	from #ProtValeur V 
	JOIN ObservationDynProp O on V.ValName = o.Name 
	JOIN Station S on V.FK_Station = S.ID
	JOIN Observation Os on os.original_id=v.fk_protocole

	--  TO gérer les fk_individu
	/*
	
	select * from ProtocoleType_ObservationDynProp pt_od 
	JOIN ProtocoleType pt on pt_od.FK_ProtocoleType = pt.id
	JOIN ObservationDynProp od on od.id = pt_od.FK_ObservationDynProp
	
	where pt.name = @ProtocoleName
	and not exists (SELECT * 
					FROM [ECWP-eReleveData].dbo.syscolumns S_C 
					JOIN [ECWP-eReleveData].dbo.sysobjects S_O on s_o.name =@TableName and S_C.id = S_o.id
					where  od.Name = S_C.name)


					*/