IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'pr_ExportAllMonitoredSite ')
	DROP PROCEDURE pr_ExportAllMonitoredSite
GO

CREATE PROCEDURE pr_ExportAllMonitoredSite 
AS
BEGIN


	IF object_id('TmpMonitoredSiteExport') IS NOT NULL
			DROP TABLE TmpMonitoredSiteExport



	select * into TmpMonitoredSiteExport 
	from [NewModelERD].dbo.MonitoredSite

	--select * from TmpIndivExport
	DECLARE @Req NVARCHAR(MAX)
	DECLARE @ReqFrom NVARCHAR(MAX)
	DECLARE @ReqSet NVARCHAR(MAX)
	IF EXISTS (SELECT * from [NewModelERD].dbo.MonitoredSiteDynProp)
	BEGIN
		SET @Req = ' ALTER TABLE TmpMonitoredSiteExport ADD@'

		select @Req = @Req + ',    ' +  replace(D.Name,' ','_') + ' ' + replace(replace(d.typeProp,'Integer','INT'),'string','varchar(255)')  from [NewModelERD].dbo.MonitoredSiteDynProp D

		SET @Req = replace(@Req,'ADD@,','ADD ')

		--print @req

		exec ( @req)

		--select * from TmpIndivExport

		SET @ReqSet = 'SET@'
		SET @ReqFrom =''

		SELECT @ReqSet = @ReqSet + ',' + replace(P.Name,' ','_') + '=V.' + replace(P.Name,' ','_'), @ReqFrom = @ReqFrom + ',MAX(CASE WHEN Name=''' +  replace(P.Name,' ','_') + ''' THEN Value' + replace(P.TypeProp,'Integer','Int') + ' ELSE NULL END) ' + replace(P.Name,' ','_')																						
		from [NewModelERD].dbo.MonitoredSiteDynProp P

		SET @ReqSet = replace(@ReqSet,'SET@,','SET ')

		SET @Req = 'UPDATE EI ' + @ReqSet +  ' FROM TmpMonitoredSiteExport EI JOIN (SELECT VN.FK_MonitoredSite ' + @ReqFrom + ' FROM   [NewModelERD].dbo.MonitoredSiteDynPropValuesNow VN GROUP BY VN.FK_MonitoredSite) V ON EI.ID = V.FK_MonitoredSite '
		exec ( @req)
	END

	IF object_id('TMonitoredSite') IS NOT NULL DROP TABLE  TMonitoredSite
	
	exec sp_rename 'TmpMonitoredSiteExport','TMonitoredSite'
END






