select * from [GIS_AllStations_PTT_NON_UAE_NEW] N
where not exists (select * 
					from NARC_eReleve_Query.dbo.[GIS_AllStations_PTT_NON_UAE_NEW] O
					where n.Ind_ID = o.Ind_ID and n.LAT = o.LAT and n.LON = o.lon
					and n.staDate = o.staDate )
					order by ind_id

select * from NARC_eReleve_Query.dbo.[GIS_AllStations_PTT_NON_UAE_NEW]  N
where not exists (select * 
					from [GIS_AllStations_PTT_NON_UAE_NEW] O
					where n.Ind_ID = o.Ind_ID and n.LAT = o.LAT and n.LON = o.lon
					and n.staDate = o.staDate )
					order by ind_id


select count(*) from NARC_eReleve_Query.dbo.[GIS_AllStations_PTT_NON_UAE_NEW] 

select Ind_ID,LAT,LON,staDate,count(*) from [GIS_AllStations_PTT_NON_UAE_NEW] N
group by Ind_ID,LAT,LON,staDate
having count(*) >1


