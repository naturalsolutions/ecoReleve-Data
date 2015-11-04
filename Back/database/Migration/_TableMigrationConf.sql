CREATE TABLE MigrationConfigurationProtocoleList(
	[ID] [int] IDENTITY(1,1) NOT NULL,
	[ProtocoleName] [nvarchar](250) NOT NULL,
	[TableName] [nvarchar](250) NOT NULL,
	PRIMARY KEY CLUSTERED 
	(
		[ID] ASC
	)
)
GO
CREATE TABLE MigrationConfigurationProtocoleContent(
	[ID] [int] IDENTITY(1,1) NOT NULL,
	fk_ConfigurationProtocole INT NOT NULL,
	[ColumnName] [nvarchar](250) NOT NULL,
	[TargetColumnType] INT NOT NULL,
	[TargetColumnName] [nvarchar](250) NOT NULL,
	PRIMARY KEY CLUSTERED 
	(
		[ID] ASC
	),
	CONSTRAINT fk_MigrationConfigurationProtocoleContent_ConfigurationProtocole FOREIGN KEY (fk_ConfigurationProtocole) REFERENCES MigrationConfigurationProtocoleList(ID)
)