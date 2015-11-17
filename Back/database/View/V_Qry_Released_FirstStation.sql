
/****** Object:  View [dbo].[V_Qry_Released_FirstStation]    Script Date: 13/11/2015 16:03:52 ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE View [dbo].[V_Qry_Released_FirstStation]
AS

SELECT  I.[ID] as Ind_ID,I.[Species],I.[Age],I.[Birth_date]
,I.[Death_date],I.[FK_IndividualType],I.[Caisse_ID],I.[UnicIdentifier]
,I.[Release_Ring_Position],I.[Release_Ring_Color],I.[Release_Ring_Code]
,I.[Breeding_Ring_Position],I.[Breeding_Ring_Color],I.[Breeding_Ring_Code]
,I.[Chip_Code],I.[Mark_Color_1],I.[Mark_Position_1],I.[Mark_Color_2],I.[Mark_Position_2]
,I.[Origin],I.[Mark_code_1],I.[Mark_code_2],I.[Individual_Status]
,I.[Monitoring_Status],I.[Survey_type],I.[Sex],I.[Poids]
,I.[Comments] as IndivComments

,r.comments as releaseComments
,rg.release_method, sr.*


FROM ERDExport.dbo.TIndividu I 
JOIN ERDExport.dbo.TProtocol_Release_Individual r
	ON I.ID = r.FK_Individual
JOIN ERDExport.dbo.TProtocol_Bird_Biometry b 
	ON I.ID = b.FK_Individual
JOIN ERDExport.dbo.TStation Sr 
	ON Sr.ID = r.FK_Station AND b.FK_Station = Sr.ID
JOIN ERDExport.dbo.TProtocol_Release_Group rg 
	ON rg.ID = r.Parent_Observation
GO


