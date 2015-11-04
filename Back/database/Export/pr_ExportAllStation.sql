IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'pr_ExportAllStation ')
	DROP PROCEDURE pr_ExportAllStation
GO

CREATE PROCEDURE pr_ExportAllStation 
AS
BEGIN


	IF object_id('TmpStationExport') IS NOT NULL
			DROP TABLE TmpStationExport



	select * into TmpStationExport 
	from [NewModelERD].dbo.Station

	--select * from TmpIndivExport
	DECLARE @Req NVARCHAR(MAX)
	DECLARE @ReqFrom NVARCHAR(MAX)
	DECLARE @ReqSet NVARCHAR(MAX)
	IF EXISTS (SELECT * from [NewModelERD].dbo.StationDynProp)
	BEGIN
		SET @Req = ' ALTER TABLE TmpStationExport ADD@'

		select @Req = @Req + ',    ' +  replace(D.Name,' ','_') + ' ' + replace(replace(d.typeProp,'Integer','INT'),'string','varchar(255)')  from [NewModelERD].dbo.StationDynProp D

		SET @Req = replace(@Req,'ADD@,','ADD ')

		--print @req

		exec ( @req)

		--select * from TmpIndivExport

		SET @ReqSet = 'SET@'
		SET @ReqFrom =''

		SELECT @ReqSet = @ReqSet + ',' + replace(P.Name,' ','_') + '=V.' + replace(P.Name,' ','_'), @ReqFrom = @ReqFrom + ',MAX(CASE WHEN Name=''' +  replace(P.Name,' ','_') + ''' THEN Value' + replace(P.TypeProp,'Integer','Int') + ' ELSE NULL END) ' + replace(P.Name,' ','_')																						
		from [NewModelERD].dbo.StationDynProp P

		SET @ReqSet = replace(@ReqSet,'SET@,','SET ')

		SET @Req = 'UPDATE EI ' + @ReqSet +  ' FROM TmpStationExport EI JOIN (SELECT VN.FK_Station ' + @ReqFrom + ' FROM   [NewModelERD].dbo.StationDynPropValuesNow VN GROUP BY VN.FK_Station) V ON EI.ID = V.FK_Station '
		exec ( @req)
	END

	IF object_id('TStation') IS NOT NULL DROP TABLE  TStation
	
	exec sp_rename 'TmpStationExport','TStation'
END






