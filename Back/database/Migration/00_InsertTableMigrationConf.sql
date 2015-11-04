INSERT INTO [dbo].[MigrationConfigurationProtocoleList]
           (
		   [ProtocoleName]
           ,[TableName])
SELECT t.Name
      ,'TProtocol_'+[Relation]
	--
  FROM [ECWP-eReleveData].[dbo].[TProtocole] p 
  JOIN ProtocoleType t on replace(p.Relation,'_',' ') like t.Name  
/*
INSERT INTO [dbo].[MigrationConfigurationProtocoleContent]
           ([fk_ConfigurationProtocole]
           ,[ColumnName]
           ,[TargetColumnType]
           ,[TargetColumnName])


		   */