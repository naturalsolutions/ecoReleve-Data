IF  EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[dbo].[VAllIndividualLocation]'))
DROP VIEW [dbo].[VAllIndividualLocation]
GO


CREATE VIEW VAllIndividualLocation 
AS
select * from (
	select I.ID FK_Individual , l.[Date] StationDate, l.LAT,l.LON,l.[Precision],'Indiv_Location' Name,l.ID staID,l.ELE,L.type_ type_
	from [dbo].[TIndividu] I 
	JOIN EcoReleve_NARC.dbo.[Individual_Location] L on L.FK_Individual = i.id
	union all
	select I.ID FK_Individual, st.StationDate,St.LAT,St.LON,st.[precision],pt.Name,st.id StaID,St.ELE,'Obs' type_
	from [dbo].[TIndividu] I 
	JOIN EcoReleve_NARC.dbo.Observation o ON o.FK_Individual = i.ID JOIN EcoReleve_NARC.dbo.ProtocoleType PT on o.FK_ProtocoleType = pt.ID and pt.name not in ('Bird Biometry')
	JOIN  TStation st ON st.ID = o.FK_Station ) F


