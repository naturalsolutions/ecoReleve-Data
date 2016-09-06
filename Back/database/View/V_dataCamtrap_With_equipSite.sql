CREATE VIEW V_dataCamTrap_With_equipSite
as

SELECT
cam.pk_id,
E.ID AS equipID,
S.UnicIdentifier,
cam.fk_sensor,
M.Name AS site_name,
M.ID AS FK_MonitoredSite,
M.Category AS site_type,
E.StartDate,
E3.StartDate AS EndDate,
cam.checked


FROM
ecoReleve_Sensor.dbo.TcameraTrap AS cam
LEFT OUTER JOIN
EcoReleve_ECWP.dbo.Equipment AS E
ON E.FK_Sensor = cam.fk_sensor AND E.Deploy = 1 AND E.StartDate < cam.date_creation
AND NOT EXISTS
(SELECT ID, FK_Sensor, FK_Individual, FK_Observation, StartDate, Deploy, FK_MonitoredSite
FROM EcoReleve_ECWP.dbo.Equipment AS e2
WHERE (FK_Sensor = E.FK_Sensor) AND (StartDate > E.StartDate) AND (StartDate < cam.date_creation)
)
LEFT OUTER JOIN
EcoReleve_ECWP.dbo.MonitoredSite AS M
ON E.FK_MonitoredSite = M.ID
LEFT OUTER JOIN
EcoReleve_ECWP.dbo.Sensor AS S
ON cam.fk_sensor = S.ID
LEFT OUTER JOIN
EcoReleve_ECWP.dbo.Equipment AS E3
ON E3.FK_Sensor = cam.fk_sensor AND E3.Deploy = 0 AND E3.StartDate > E.StartDate
AND NOT EXISTS
(SELECT ID, FK_Sensor, FK_Individual, FK_Observation, StartDate, Deploy, FK_MonitoredSite
FROM EcoReleve_ECWP.dbo.Equipment AS e4
WHERE (FK_Sensor = E.FK_Sensor) AND (StartDate < E3.StartDate) AND (StartDate > E.StartDate)
)
