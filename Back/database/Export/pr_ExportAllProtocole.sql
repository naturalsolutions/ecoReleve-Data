
IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'pr_ExportAllProtocole ')
	DROP PROCEDURE pr_ExportAllProtocole 
GO

CREATE PROCEDURE pr_ExportAllProtocole 
AS
BEGIN

	DECLARE @ProtocoleType INT
	Select ID into #ProtList from [NewModelERD].dbo.ProtocoleType
	--where ID not in (208)

	WHILE EXISTS (select * from #ProtList) 
	BEGIN
		SELECT TOP 1 @ProtocoleType=ID FROM #ProtList
		print @ProtocoleType
		execute pr_ExportOneProtocole @ProtocoleType
		DELETE FROM #ProtList WHERE ID=@ProtocoleType
	END

END


