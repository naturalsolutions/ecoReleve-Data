IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'pr_MigrationProtocole ')
	DROP PROCEDURE pr_MigrationProtocole
GO

CREATE PROCEDURE pr_MigrationProtocole 
(
 @ProtocoleName VARCHAR(255)
)
AS
BEGIN

	DECLARE @TableName VARCHAR(255) 
	DECLARE @Req NVARCHAR(max)
	DECLARE @Id_Prot_Type INT
	DECLARE @colIndID INT
	
	

	print 'Migration Protocole ' + @ProtocoleName

	SELECT @Id_Prot_Type = ID from ProtocoleType pt where pt.Name = @ProtocoleName;

	SELECT @TableName=TableName  
	from [MigrationConfigurationProtocoleList] L
	where L.[ProtocoleName] = @ProtocoleName

		SET @Req = '@Debut'

		--select @Req = @Req + 'union all ' + + char(13) + ' select ''' + O.Name + ''',convert(varchar(1000),P.[' + S_C.name + '])  ' 
		--FROM ObservationDynProp O 
		--LEFT JOIN MigrationConfigurationProtocoleList PL on PL.ProtocoleName = @ProtocoleName
		--LEFT JOIN [dbo].[MigrationConfigurationProtocoleContent] PC ON PC.[fk_ConfigurationProtocole] = PL.ID and o.Name = PC.[ColumnName]
		--JOIN [NARC_eReleveData].dbo.sysobjects S_O on s_o.name =@TableName --AND s_o.type != NULL
		--JOIN [NARC_eReleveData].dbo.syscolumns S_C on o.Name = isnull(PC.[ColumnName],S_C.name) and S_C.id = S_o.id
	

		SELECT @Req = @Req + 'union all ' + + char(13) + ' select ''' + O.Name + ''',convert(varchar(1000),P.[' + S_C.name + '])  ' 
		FROM ObservationDynProp O JOIN ProtocoleType_ObservationDynProp PTO ON PTO.FK_ObservationDynProp = O.ID  JOIN ProtocoleType PT on PTO.FK_ProtocoleType = PT.ID AND PT.Name = @ProtocoleName
		LEFT JOIN MigrationConfigurationProtocoleList PL on PL.ProtocoleName = @ProtocoleName
		LEFT JOIN [dbo].[MigrationConfigurationProtocoleContent] PC ON PC.[fk_ConfigurationProtocole] = PL.ID and o.Name = PC.TargetColumnName
		JOIN [NARC_eReleveData].dbo.sysobjects S_O on s_o.name =@TableName --AND s_o.type != NULL
		JOIN [NARC_eReleveData].dbo.syscolumns S_C on isnull(PC.[ColumnName],o.Name) = S_C.name and S_C.id = S_o.id
		SET @Req = replace(@Req,'@Debutunion all','');
		

		IF object_id('tempdb..#ProtValeur') IS NOT NULL
			DROP TABLE #ProtValeur
		CREATE TABLE #ProtValeur (FK_Station int,fk_protocole int,ValName VARCHAR(250),Valeur VARCHAR(1000),FK_Indiv INT,comments varchar(255))
		
		

		SELECT @colIndID = count(*)
		FROM [NARC_eReleveData].dbo.sysobjects S_O 
		JOIN [NARC_eReleveData].dbo.syscolumns S_C on S_C.id = S_o.id
		WHERE s_o.name =@TableName and s_c.Name in ('FK_TIND_ID') 
			
		SET @Req = ' select S2.ID ,P.pk ,ValName,Valeur ,' + CASE WHEN  @colIndID >0  THEN ' P.FK_TIND_ID' ELSE 'NULL' END+ ', p.comments  from [NARC_eReleveData].dbo.' + @TableName + ' P JOIN  [NARC_eReleveData].dbo.TStations S ON  P.FK_TSta_ID = S.TSta_PK_ID JOIN Station S2 ON s2.ID =S.TSta_PK_ID    cross apply(' + @Req + ') c (ValName,Valeur)'
		SET @req = replace(@req,'cross apply(@debut)','cross apply(Select ''none'' ,NULL)')
		select @ProtocoleName;
		select @Req;
		--print @Req
		
		
		insert into #ProtValeur
		execute(@Req)

		--select * from #ProtValeur
		CREATE INDEX IX_ProtValeur_Station on #ProtValeur(FK_Station)
		--CREATE INDEX IX_ProtValeur_ValName on #ProtValeur(ValName)

		IF object_id('tempdb..##InsertedObs') IS NOT NULL
			DROP TABLE #InsertedObs
		CREATE TABLE #InsertedObs (fk_obs INT,fk_protocole int,creationDate DATETIME)
		

		INSERT INTO [dbo].[Observation]
			   ([FK_ProtocoleType]
			   ,[FK_Station]
			   ,[creationDate]
			   ,[Parent_Observation]
			   ,[FK_Individual]
			   ,Original_ID
			   ,comments)
			   OUTPUT inserted.ID, inserted.original_id,inserted.creationDate into #InsertedObs
		select DISTINCT @Id_Prot_Type,
		s.id,S.StationDate,NULL,i.ID, V.fk_protocole,v.comments
		from #ProtValeur V 
		--JOIN ObservationDynProp O on V.ValName = o.Name 
		JOIN Station S on V.FK_Station = S.ID
		LEFT JOIN Individual i ON V.FK_Indiv = i.ID
	--SELECT * FROM #InsertedObs
	CREATE INDEX IX_InsertedObs_fk_protocole on #InsertedObs(fk_protocole)
	CREATE INDEX IX_InsertedObs_fk_obs on #InsertedObs(fk_obs)

	INSERT INTO [dbo].[ObservationDynPropValue]
			   ([StartDate]
			   ,[ValueInt]
			   ,[ValueString]
			   ,[ValueDate]
			   ,[ValueFloat]
			   ,[FK_ObservationDynProp]
			   ,[FK_Observation]
			   )

		select OI.creationDate 
		,CASE WHEN o.TypeProp ='Integer' THEN V.Valeur ELSE NULL END
		,CASE WHEN o.TypeProp ='String' THEN V.Valeur ELSE NULL END
		,CASE WHEN o.TypeProp ='Date'  or o.TypeProp ='DateOnly' or o.TypeProp ='time' THEN convert(datetime,V.Valeur,103) ELSE NULL END
		,CASE WHEN o.TypeProp ='Float' THEN V.Valeur ELSE NULL END
		,o.ID
		,OI.fk_obs
		--,o.Name
		--,o.TypeProp
		from #ProtValeur V 
		JOIN #InsertedObs OI ON  V.fk_protocole = OI.fk_protocole
		JOIN ObservationDynProp O on V.ValName = o.Name 
		

		

END