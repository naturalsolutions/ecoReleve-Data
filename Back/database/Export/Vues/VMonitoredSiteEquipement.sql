IF EXISTS (SELECT * FROM sys.objects WHERE type = 'V' AND name = 'VMonitoredSiteEquipement ')
	DROP VIEW VMonitoredSiteEquipement
GO

CREATE VIEW VMonitoredSiteEquipement
AS
SELECT E.ID,E.FK_Sensor,E.FK_MonitoredSite,FK_Observation 
FROM [NewModelERD].dbo.Equipment E
WHERE E.FK_MonitoredSite IS NOT NULL
AND NOT EXISTS (SELECT *  FROM [NewModelERD].dbo.Equipment E2 where E2.FK_MonitoredSite = E.FK_MonitoredSite and E2.StartDate > E.StartDate)
AND E.Deploy =1

