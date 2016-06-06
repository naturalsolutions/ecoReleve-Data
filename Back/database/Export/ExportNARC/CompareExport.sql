--select S.original_id, Sb.FK_TSta_ID,EB.*,SB.* 
--from [dbo].TProtocole_Bird_Biometry EB JOIN TSTation S on EB.fk_station = S.ID
--JOIN NARC_eReleveData.[dbo].[TProtocol_Bird_Biometry] SB on SB.pk = EB.original_id
--where ( convert(int,replace(S.original_id,'eReleve_','')) <> Sb.FK_TSta_ID or
--EB.weight <> SB.weight OR EB.wings <> SB.wings OR  abs(EB.Tarso_Metatarsus - SB.Tarso_Metatarsus) > 0.01  )

IF object_id('tempdb..#ProtList') IS NOT NULL
			DROP TABLE #ProtList

DECLARE @TableName VARCHAR(4000)


DECLARE @Req VARCHAR(4000)
DECLARE @ReqSelect VARCHAR(4000)
DECLARE @Reqwhere VARCHAR(4000)



	Select name into #ProtList from sysobjects o where o.name like 'TProtocol_%' and type='U'
	and o.name not in ('TProtocol_Individual_Equipment','TProtocol_Site_equipment')
	--where ID not in (208)

	WHILE EXISTS (select * from #ProtList) 
	BEGIN
		SELECT TOP 1 @TableName = Name from #ProtList

		

		SET @ReqSelect = ' SELECT S.original_id, SP.FK_TSta_ID,EP.id,ep.original_id,SP.pk ' 
		SET @Reqwhere  = ' convert(int,replace(S.original_id,''eReleve_'','''')) <> SP.FK_TSta_ID '

		select @ReqSelect = @ReqSelect + ',EP.' + C.name + ',SP.' +  c2.name ,
		@Reqwhere = @Reqwhere + 
			CASE WHEN C2.xtype =62 THEN ' OR abs(EP.' + c.name + ' - SP.' +   c2.name +') > 0.01 '
			ELSE ' OR EP.' + c.name + ' <> SP.' +   c2.name
			END
		from sysobjects o 
		JOIN syscolumns c ON C.id=o.id
		JOIN EcoReleve_NARC.dbo.MigrationConfigurationProtocoleList PL on PL.TableName = o.name
		--LEFT JOIN EcoReleve_NARC.dbo.MigrationConfigurationProtocoleContent PC on PC.fk_ConfigurationProtocole =PL.ID and PC.TargetColumnName = C.name
		JOIN NARC_eReleveData.[dbo].sysobjects o2 ON o2.name = @TableName  
		JOIN NARC_eReleveData.[dbo].syscolumns c2 ON C2.id=o2.id and C.name = c2.name --and isnull(PC.ColumnName, C.name) = c2.name 
		where o.name = @TableName
		and c.name not in ('ID','original_id','fk_station','fk_individual','creationdate','FK_ProtocoleType','comments','timestamp')


		SET @Req = @ReqSelect + ' FROM  ' + @TableName + ' EP JOIN TSTation S on EP.fk_station = S.ID JOIN NARC_eReleveData.[dbo].' + @TableName + ' SP on SP.pk = EP.original_id WHERE (' + @Reqwhere + ')'

		--select ' Comparaison Protocole ' + @TableName

		SET @Req = 'select ''' + @TableName + ''' ProtocoleTable,S.Nbsource,T.NBTarget FROM  (SELECT count(*) nbSource from NARC_eReleveData.[dbo].' + @TableName + ' P JOIN NARC_eReleveData.[dbo].TStations S  ON P.FK_TSta_ID = S.TSta_PK_ID where (s.FieldActivity_ID <> 27 or s.FieldActivity_ID IS NULL) ) S JOIN  (select count(*) NbTarget from ' + @TableName + ') T ON S.Nbsource <> T.NbTarget '
		print @req
		exec (@Req )



		--print @Req
		--exec (@Req )



		DELETE FROM  #ProtList where name = @TableName
	END