
Create view [dbo].[VRfidData_With_equipSite]
as 
( SELECT  t.ID as equipID
	  ,s.UnicIdentifier
		, rfid.*
	 , t.StartDate as StartDate
	 ,t.EndDate as EndDate
	 ,m.Name as site_name
	,m.[Category] as site_type
	,m.ID as FK_MonitoredSite
	
  FROM [ecoReleve_sensor].[dbo].[T_rfid] rfid
  join sensor s on rfid.FK_Sensor=s.ID

  LEFT JOIN (
	SELECT e.*,e1.StartDate as EndDate  FROM 
	NewModelERD.dbo.equipment e 
	LEFT JOIN NewModelERD.dbo.equipment e1 
	ON e.[FK_MonitoredSite] = e1.[FK_MonitoredSite] AND e.FK_Sensor =  e1.FK_Sensor AND e.StartDate < e1.StartDate AND e.ID != e1.ID AND e.Deploy != e1.Deploy
	WHERE  e.Deploy = 1) t 
  ON s.ID = t.FK_Sensor AND rfid.date_ >= t.StartDate AND (rfid.[date_] < t.EndDate OR t.EndDate IS NULL)
 LEFT join [dbo].[MonitoredSite] m on m.ID=t.FK_MonitoredSite
)


GO


