IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'pr_ExportAfterCreateIndex')
	DROP PROCEDURE pr_ExportAfterCreateIndex
GO

CREATE PROCEDURE pr_ExportAfterCreateIndex
AS
BEGIN


	CREATE UNIQUE CLUSTERED INDEX pk_TStation on TStation(ID)

	CREATE INDEX IX_Station_StationDate ON Tstation(StationDate)

	CREATE INDEX IX_TProtocol_Release_Individual_fk_individu ON [TProtocol_Release_Individual](fk_individual)

	CREATE INDEX IX_TProtocol_Release_Individual_fk_Station ON [TProtocol_Release_Individual](fk_Station)


	CREATE INDEX IX_TProtocol_Capture_Individual_fk_individu ON [TProtocol_Capture_Individual](fk_individual)

	CREATE INDEX IX_TProtocol_Capture_Individual_fk_Station ON [TProtocol_Capture_Individual](fk_Station)
END