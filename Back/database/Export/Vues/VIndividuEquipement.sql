IF EXISTS (SELECT * FROM sys.objects WHERE type = 'V' AND name = 'VIndividuEquipement ')
	DROP VIEW VIndividuEquipement
GO

CREATE VIEW VIndividuEquipement
AS
SELECT E.ID,E.FK_Sensor,E.FK_Individual,FK_Observation 
FROM [NewModelERD].dbo.Equipment E
WHERE E.FK_Individual IS NOT NULL
AND NOT EXISTS (SELECT *  FROM [NewModelERD].dbo.Equipment E2 where E2.FK_Individual = E.FK_Individual and E2.StartDate > E.StartDate)
AND E.Deploy =1

