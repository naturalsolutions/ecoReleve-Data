

INSERT INTO [dbo].[MigrationConfigurationProtocoleList]
           (
		   [ProtocoleName]
           ,[TableName])
SELECT t.Name
      ,'TProtocol_'+[Relation]
	--
  FROM [ECWP-eReleveData].[dbo].[TProtocole] p 
  JOIN ProtocoleType t on replace(p.Relation,'_',' ') like t.Name  

INSERT INTO [dbo].[MigrationConfigurationProtocoleContent]
           ([fk_ConfigurationProtocole]
           ,[ColumnName]
           ,[TargetColumnType]
           ,[TargetColumnName])

select ID,'Name_Taxon',1,'Taxon' from [MigrationConfigurationProtocoleList] where ProtocoleName = 'Chiroptera capture'


INSERT INTO [dbo].[MigrationConfigurationProtocoleContent]
           ([fk_ConfigurationProtocole]
           ,[ColumnName]
           ,[TargetColumnType]
           ,[TargetColumnName])

select ID,'Name_Sex',1,'Sex' from [MigrationConfigurationProtocoleList] where ProtocoleName = 'Bird Biometry'


INSERT INTO [dbo].[MigrationConfigurationProtocoleContent]
           ([fk_ConfigurationProtocole]
           ,[ColumnName]
           ,[TargetColumnType]
           ,[TargetColumnName])

select ID,'Name_Age',1,'Age' from [MigrationConfigurationProtocoleList] where ProtocoleName = 'Bird Biometry'


INSERT INTO [dbo].[MigrationConfigurationProtocoleContent]
           ([fk_ConfigurationProtocole]
           ,[ColumnName]
           ,[TargetColumnType]
           ,[TargetColumnName])

select ID,'Name_Impact',1,'Impact' from [MigrationConfigurationProtocoleList] where ProtocoleName = 'Building and Activities'

