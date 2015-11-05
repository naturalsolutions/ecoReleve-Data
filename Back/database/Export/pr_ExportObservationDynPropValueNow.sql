IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'pr_ExportObservationDynPropValueNow')
	DROP PROCEDURE pr_ExportObservationDynPropValueNow
GO

CREATE PROCEDURE pr_ExportObservationDynPropValueNow 
	
AS
BEGIN
	IF NOT EXISTS (SELECT * FROM TImportInfo I WHERE I.ImportInfoName = 'ExportObservationDynPropValueNow' and convert(datetime,I.ImportInfoValue,121) > getdate()-0.1)
	BEGIN
		IF EXISTS (select * from sysobjects where name='TObservationDynPropValueNow' and type='U')
			DROP TABLE TObservationDynPropValueNow

		CREATE TABLE [dbo].[TObservationDynPropValueNow](
			[ID] [int] NOT NULL,
			[StartDate] [datetime] NOT NULL,
			[ValueInt] [int] NULL,
			[ValueString] [varchar](max) NULL,
			[ValueDate] [datetime] NULL,
			[ValueFloat] [float] NULL,
			[FK_ObservationDynProp] [int] NULL,
			[FK_Observation] [int] NULL,
			[Name] [nvarchar](250) NOT NULL,
			[TypeProp] [nvarchar](250) NOT NULL
		) 


		
		
		INSERT INTO [dbo].[TObservationDynPropValueNow]
           ([ID]
           ,[StartDate]
           ,[ValueInt]
           ,[ValueString]
           ,[ValueDate]
           ,[ValueFloat]
           ,[FK_ObservationDynProp]
           ,[FK_Observation]
           ,[Name]
           ,[TypeProp])
		SELECT * FROM [NewModelERD].dbo.ObservationDynPropValuesNow WITH(NOLOCK)
		
		CREATE CLUSTERED INDEX [IX_TObservationDynPropValue_Fk_Observation_autres] ON [dbo].TObservationDynPropValueNow
				(
					[FK_Observation] ,
					[FK_ObservationDynProp] 
				)

		INSERT INTO [dbo].[TImportInfo]
           ([ImportInfoName]
           ,[ImportInfoValue])
		   VALUES ('ExportObservationDynPropValueNow',convert(varchar,getdate(),121)) 
	END
END



