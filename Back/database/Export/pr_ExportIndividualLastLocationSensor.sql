IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'pr_ExportIndividualLastLocationSensor')
	DROP PROCEDURE pr_ExportIndividualLastLocationSensor
GO

CREATE PROCEDURE pr_ExportIndividualLastLocationSensor
AS
BEGIN

IF OBJECT_ID('tmpIndividualLastLocationSensor') IS NOT NULL
		DROP TABLE tmpIndividualLastLocationSensor
select * into tmpIndividualLastLocationSensor
FROM
	(
	select IL.[ID]
		  ,IL.[LAT]
		  ,IL.[LON]
		  ,IL.[ELE]
		  ,IL.[Date]
		  ,IL.[Precision]
		  ,IL.[FK_Sensor]
		  ,I.ID [FK_Individual]
		  ,IL.[creator]
		  ,IL.[creationDate]
		  ,IL.[type_]
		  ,IL.[OriginalData_ID]
	from TIndividu I 
	JOIN (select Il.*,ROW_NUMBER() OVER (PARTITION by FK_Individual,[date] order by FK_Individual,[date] DESC) Nb from [EcoReleve_ECWP].dbo.Individual_Location IL) IL ON IL.FK_Individual = I.ID and Il.Nb =1 
	and not exists (select * from [EcoReleve_ECWP].dbo.Individual_Location IL2 where IL2.FK_Individual = IL.FK_Individual and il2.Date > il.Date)
	union all 
	select NULL [ID]
		  ,NULL [LAT]
		  ,NULL [LON]
		  ,NULL [ELE]
		  ,NULL [Date]
		  ,NULL [Precision]
		  ,NULL [FK_Sensor]
		  ,I.ID [FK_Individual]
		  ,NULL [creator]
		  ,NULL [creationDate]
		  ,NULL [type_]
		  ,NULL [OriginalData_ID]
	from TIndividu I 
	Where not exists (select * from [EcoReleve_ECWP].dbo.Individual_Location IL where IL.FK_Individual = I.ID )
	) S

	IF object_id('TIndividualLastLocationSensor') IS NOT NULL 
		DROP TABLE  TIndividualLastLocationSensor
	exec sp_rename 'tmpIndividualLastLocationSensor','TIndividualLastLocationSensor'

END


