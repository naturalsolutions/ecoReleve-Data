IF EXISTS (SELECT * FROM sys.objects WHERE type = 'V' AND name = 'VIndividuEquipementHisto ')
	DROP VIEW VIndividuEquipementHisto
GO

CREATE VIEW VIndividuEquipementHisto
AS
SELECT *
FROM [EcoReleve_ECWP].dbo.Equipment E
WHERE E.FK_Individual IS NOT NULL

