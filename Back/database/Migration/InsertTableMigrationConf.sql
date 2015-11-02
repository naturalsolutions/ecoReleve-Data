SET IDENTITY_INSERT [MigrationConfigurationProtocoleList] ON 
GO
INSERT INTO [dbo].[MigrationConfigurationProtocoleList]
           (ID,
		   [ProtocoleName]
           ,[TableName])

	VALUES
           (1
		   ,'Chiroptera capture'
           ,'TProtocol_Chiroptera_capture')

GO
SET IDENTITY_INSERT [MigrationConfigurationProtocoleList] OFF 
/*
INSERT INTO [dbo].[MigrationConfigurationProtocoleContent]
           ([fk_ConfigurationProtocole]
           ,[ColumnName]
           ,[TargetColumnType]
           ,[TargetColumnName])


		   */