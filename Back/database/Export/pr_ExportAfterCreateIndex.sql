USE [EcoReleve_Export_ECWP]
GO

/****** Object:  StoredProcedure [dbo].[pr_ExportAfterCreateIndex]    Script Date: 16/12/2015 08:47:23 ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO


ALTER PROCEDURE [dbo].[pr_ExportAfterCreateIndex]
AS
BEGIN


	CREATE UNIQUE CLUSTERED INDEX pk_TStation on TStation(ID)

	CREATE INDEX IX_Station_StationDate ON Tstation(StationDate)

	CREATE INDEX IX_TProtocol_Release_Individual_fk_individu ON [TProtocol_Release_Individual](fk_individual)

	CREATE INDEX IX_TProtocol_Release_Individual_fk_Station ON [TProtocol_Release_Individual](fk_Station)


	CREATE INDEX IX_TProtocol_Capture_Individual_fk_individu ON [TProtocol_Capture_Individual](fk_individual)

	CREATE INDEX IX_TProtocol_Capture_Individual_fk_Station ON [TProtocol_Capture_Individual](fk_Station)

	CREATE INDEX IX_TProtocol_Release_Individual_Parent_Observation ON [TProtocol_Release_Individual]([Parent_Observation])

	CREATE INDEX [IX_TIndividual] ON [dbo].[TIndividu] ([ID])

	CREATE INDEX [IX_Sensor_ID_UnicIdentifier] ON [dbo].[TSensor]
	(
	[ID] ASC
	)
	INCLUDE (UnicIdentifier)

END
GO


