SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO





ALTER view [dbo].[VRfidData_With_equipSite]
as 
SELECT  e.ID as equipID,e.FK_MonitoredSite,S.UnicIdentifier,m.Name as site_name,M.Category as site_type,e.StartDate as StartDate,e3.StartDate EndDate,rfid.*
from [ecoReleve_Sensor].[dbo].[T_rfid] rfid
LEFT JOIN Equipment E on e.FK_Sensor = rfid.FK_Sensor and e.Deploy =1 and e.StartDate < rfid.date_
					and not exists (select * 
									from  [Equipment] e2 
									where e2.FK_Sensor = e.FK_Sensor AND e2.StartDate > e.StartDate AND e2.StartDate < rfid.date_)
LEFT JOIN MonitoredSite M on e.FK_MonitoredSite = M.id
LEFT JOIN Sensor S on rfid.FK_Sensor = S.ID
LEFT JOIN Equipment E3 on e3.FK_Sensor = rfid.FK_Sensor and e3.Deploy =0 and e3.StartDate > e.StartDate 
							and not exists (select * 
									from  [Equipment] e4 
									where e4.FK_Sensor = e.FK_Sensor AND e4.StartDate < e3.StartDate and e4.StartDate > e.StartDate)









GO
