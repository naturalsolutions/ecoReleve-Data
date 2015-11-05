IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'pr_ExportAllSensor ')
	DROP PROCEDURE pr_ExportAllSensor
GO

CREATE PROCEDURE pr_ExportAllSensor 
AS
BEGIN


	IF object_id('TmpSensorExport') IS NOT NULL
			DROP TABLE TmpSensorExport



	select * into TmpSensorExport 
	from [NewModelERD].dbo.Sensor

	--select * from TmpIndivExport
	DECLARE @Req NVARCHAR(MAX)
	DECLARE @ReqFrom NVARCHAR(MAX)
	DECLARE @ReqSet NVARCHAR(MAX)
	IF EXISTS (SELECT * from [NewModelERD].dbo.SensorDynProp)
	BEGIN
		SET @Req = ' ALTER TABLE TmpSensorExport ADD@'

		select @Req = @Req + ',    ' +  replace(D.Name,' ','_') + ' ' + replace(replace(d.typeProp,'Integer','INT'),'string','varchar(255)')  from [NewModelERD].dbo.SensorDynProp D

		SET @Req = replace(@Req,'ADD@,','ADD ')

		--print @req

		exec ( @req)

		--select * from TmpIndivExport

		SET @ReqSet = 'SET@'
		SET @ReqFrom =''

		SELECT @ReqSet = @ReqSet + ',' + replace(P.Name,' ','_') + '=V.' + replace(P.Name,' ','_'), @ReqFrom = @ReqFrom + ',MAX(CASE WHEN Name=''' +  replace(P.Name,' ','_') + ''' THEN Value' + replace(P.TypeProp,'Integer','Int') + ' ELSE NULL END) ' + replace(P.Name,' ','_')																						
		from [NewModelERD].dbo.SensorDynProp P

		SET @ReqSet = replace(@ReqSet,'SET@,','SET ')

		SET @Req = 'UPDATE EI ' + @ReqSet +  ' FROM TmpSensorExport EI JOIN (SELECT VN.FK_Sensor ' + @ReqFrom + ' FROM   [NewModelERD].dbo.SensorDynPropValuesNow VN GROUP BY VN.FK_Sensor) V ON EI.ID = V.FK_Sensor '
		exec ( @req)
	END

	IF object_id('TSensor') IS NOT NULL DROP TABLE  TSensor
	
	exec sp_rename 'TmpSensorExport','TSensor'
END






