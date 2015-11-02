
/****** Object:  View [dbo].[VArgosData_With_EquipIndiv]    Script Date: 12/10/2015 17:53:50 ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO
CREATE view [dbo].[V_dataRFID_as_file]
as 
with toto as 
( SELECT 
	  s.UnicIdentifier
	  ,rfid.[creator] as creator
      ,rfid.[checked] as checked
	, count (distinct chip_code) as nb_chip_code
	 , count (chip_code) as total_scan
	-- , rfid.frequency_hour as frequency_hour
	 , t.StartDate as StartDate
	 ,t.EndDate as EndDate
	 ,m.Name as site_name
	,m.[Category] as site_type
	,rfid.creation_date
	,Max(rfid.date_) as last_scan
	,Min(rfid.date_) as first_scan
	
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

  group by s.UnicIdentifier, rfid.[creator] ,rfid.[checked],rfid.creation_date,m.Name,m.[Category], t.StartDate,t.EndDate ,rfid.checked

)

select * from toto 


