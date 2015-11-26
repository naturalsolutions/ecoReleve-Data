IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'pr_ExportAll')
	DROP PROCEDURE pr_ExportAll
GO

CREATE PROCEDURE pr_ExportAll
AS
BEGIN
SET NOCOUNT on
	print 'export individus'
	exec pr_ExportAllIndividu
	print ' export Stations '
	exec pr_ExportAllStation
	print ' export MonitoredSites '
	exec pr_ExportAllMonitoredSite
	print ' export Sensors '
	exec pr_ExportAllSensor
	print ' export Observations '
	exec pr_ExportAllProtocole

	print ' export AfterCreateIndex '
	exec pr_ExportAfterCreateIndex

	print ' export FirstStation '
	exec pr_ExportFirstStation

	print 'export LastLocationSensor'
	exec pr_ExportIndividualLastLocationSensor

	print ' export Last LocationAllSource '
	exec pr_ExportIndividualLastLocationAllSource
END