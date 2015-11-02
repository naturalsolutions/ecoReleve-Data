

/****** Object:  View [dbo].[VArgosData_With_EquipIndiv]    Script Date: 05/10/2015 17:20:16 ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

/****** Script de la commande SelectTopNRows à partir de SSMS  ******/
/****** Script de la commande SelectTopNRows à partir de SSMS  ******/


CREATE View [dbo].[VGSMData_With_EquipIndiv] as (

SELECT t.FK_Individual,t.FK_Sensor,t.StartDate,t.EndDate,a.*
  FROM [ecoReleve_Sensor].[dbo].[Tgsm] a
  JOIN NewModelERD.dbo.Sensor s ON a.platform_ = s.UnicName 
  LEFT JOIN (
	SELECT e.*,e1.StartDate as EndDate  FROM 
	NewModelERD.dbo.equipment e 
	LEFT JOIN NewModelERD.dbo.equipment e1 
	ON e.FK_Individual = e1.FK_Individual AND e.FK_Sensor =  e1.FK_Sensor AND e.StartDate < e1.StartDate AND e.ID != e1.ID AND e.Deploy != e1.Deploy
	WHERE  e.Deploy = 1) t 
  ON s.ID = t.FK_Sensor AND a.DateTime >= t.StartDate AND (a.DateTime < t.EndDate OR t.EndDate IS NULL)
  )
GO

CREATE View [dbo].[VArgosData_With_EquipIndiv] as (

SELECT t.FK_Individual,t.FK_Sensor,t.StartDate,t.EndDate,a.*
  FROM [ecoReleve_Sensor].[dbo].[T_argosgps] a
  JOIN NewModelERD.dbo.Sensor s ON a.FK_ptt = s.UnicName 
  LEFT JOIN (
	SELECT e.*,e1.StartDate as EndDate  FROM 
	NewModelERD.dbo.equipment e 
	LEFT JOIN NewModelERD.dbo.equipment e1 
	ON e.FK_Individual = e1.FK_Individual AND e.FK_Sensor =  e1.FK_Sensor AND e.StartDate < e1.StartDate AND e.ID != e1.ID AND e.Deploy != e1.Deploy
	WHERE  e.Deploy = 1) t 
  ON s.ID = t.FK_Sensor AND a.date >= t.StartDate AND (a.[date] < t.EndDate OR t.EndDate IS NULL)
  )
GO


