
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE View [dbo].[VArgosData_With_EquipIndiv] as (


SELECT t.ID, t.FK_Individual,s.ID as FK_Sensor,t.StartDate,t.EndDate,a.*
  FROM [ecoReleve_Sensor].[dbo].[T_argosgps] a
  JOIN NewModelERD.dbo.Sensor s ON CONVERT(VARCHAR,a.FK_ptt) = s.UnicIdentifier
  LEFT JOIN (
	SELECT e.*,e1.StartDate as EndDate  FROM 
	NewModelERD.dbo.equipment e 
	LEFT JOIN NewModelERD.dbo.equipment e1 
	ON e.FK_Individual = e1.FK_Individual AND e.FK_Sensor =  e1.FK_Sensor AND e.StartDate < e1.StartDate AND e.ID != e1.ID AND e.Deploy != e1.Deploy
	WHERE  e.Deploy = 1) t 
  ON s.ID = t.FK_Sensor AND a.date >= t.StartDate AND (a.[date] < t.EndDate OR t.EndDate IS NULL)
  WHERE a.lon IS NOT NULL AND a.lat IS NOT NULL

  )



GO


