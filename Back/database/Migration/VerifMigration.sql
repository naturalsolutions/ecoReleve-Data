DECLARE @ProtocoleNAme VARCHAR(100)
DECLARE @ProtocoleID INT

SET @ProtocoleNAme = 'Building and Activities'



pr_MigrationProtocole @ProtocoleNAme

---------------- UPDATE THESAURUS

SET @ProtocoleNAme = 'Building and Activities'

SELECT @ProtocoleID=ID from ProtocoleType where name=@ProtocoleNAme

[pr_ExportOneProtocole] @ProtocoleID