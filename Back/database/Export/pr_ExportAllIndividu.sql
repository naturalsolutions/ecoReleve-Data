IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'pr_ExportAllIndividu ')
	DROP PROCEDURE pr_ExportAllIndividu
GO

CREATE PROCEDURE pr_ExportAllIndividu 
AS
BEGIN


	IF object_id('TmpIndivExport') IS NOT NULL
			DROP TABLE TmpIndivExport



	select * into TmpIndivExport 
	from [NewModelERD].dbo.individual

	--select * from TmpIndivExport
	DECLARE @Req NVARCHAR(MAX)
	DECLARE @ReqFrom NVARCHAR(MAX)
	DECLARE @ReqSet NVARCHAR(MAX)

	SET @Req = ' ALTER TABLE TmpIndivExport ADD@'

	select @Req = @Req + ',    ' +  replace(D.Name,' ','_') + ' ' + replace(replace(d.typeProp,'Integer','INT'),'string','varchar(255)')  from [NewModelERD].dbo.IndividualDynProp D

	SET @Req = replace(@Req,'ADD@,','ADD ')

	--print @req

	exec ( @req)

	--select * from TmpIndivExport

	SET @ReqSet = 'SET@'
	SET @ReqFrom =''

	SELECT @ReqSet = @ReqSet + ',' + replace(P.Name,' ','_') + '=V.' + replace(P.Name,' ','_'), @ReqFrom = @ReqFrom + ',MAX(CASE WHEN Name=''' +  replace(P.Name,' ','_') + ''' THEN Value' + replace(P.TypeProp,'Integer','Int') + ' ELSE NULL END) ' + replace(P.Name,' ','_')																						
	from [NewModelERD].dbo.IndividualDynProp P

	SET @ReqSet = replace(@ReqSet,'SET@,','SET ')

	SET @Req = 'UPDATE EI ' + @ReqSet +  ' FROM TmpIndivExport EI JOIN (SELECT VN.FK_Individual ' + @ReqFrom + ' FROM   [NewModelERD].dbo.IndividualDynPropValuesNow VN GROUP BY VN.FK_Individual) V ON EI.ID = V.FK_Individual '
	exec ( @req)


	IF object_id('TIndividu') IS NOT NULL DROP TABLE  TIndividu
	
	exec sp_rename 'TmpIndivExport','TIndividu'
END






