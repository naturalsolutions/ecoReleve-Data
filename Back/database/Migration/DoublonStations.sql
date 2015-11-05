select * from TStations S 
where exists (select * from TStations S2 where S.TSta_PK_ID <> s2.TSta_PK_ID and S2.LAT =S.LAT and s2.LON = s.LON and S.[DATE] = S2.[DATE])
order by S.[DATE],s.LAT,s.LON