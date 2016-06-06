BEGIN TRAN

UPDATE  S 
SET S.DATE = S.Newdate
FROM
--select S.DATE, S.DATE +  0.000001 * row_number () OVER (PARTITION BY S.Date,S.LAT,S.LON order by S.TSta_PK_ID) 
	(	   select S.TSta_PK_ID,S.date, S.DATE +  0.000001 * row_number () OVER (PARTITION BY S.Date,S.LAT,S.LON order by S.TSta_PK_ID) Newdate 
			from [ECWP-eReleveData].dbo.TStations S 
		   WHERe 
		   (S.FieldActivity_ID != 27 or S.FieldActivity_ID IS NULL)
		   AND  
		   EXISTS (SELECT * FROM [ECWP-eReleveData].dbo.TStations S2 where S.TSta_PK_ID <> s2.TSta_PK_ID and isnull(S2.LAT,-1) =isnull(S.LAT,-1) and isnull(S2.LON,-1) =isnull(S.LON,-1) and S.[DATE] = S2.[DATE] AND (S2.FieldActivity_ID != 27 or S2.FieldActivity_ID IS NULL))
	) S	   

COMMIT TRAN

select DISTINCT isnull([DATE],creation_date),S.Name,S.LAT,S.LON,S.ELE,S.precision,FA.ID,1,S.Creation_date,st.id,R.ID,NULL,S.Place,'eReleve_'+CONVERT(VARCHAR,S.TSta_PK_ID),s.Comments
		   from [ECWP-eReleveData].dbo.TStations S 
		   LEFT JOIN fieldActivity FA on FA.Name = S.FieldActivity_Name 
		   JOIN StationType st ON  st.name = 'standard'
		   LEFT JOIN Region R on r.Region = S.Region
		   WHERe NOT EXISTS (select * from Station S2 where S2.LAT = S.LAT AND S2.LON = S.LON AND s2.LAT = S.LAT and S.[DATE] = S2.StationDate)
		   AND (S.FieldActivity_ID != 27 or S.FieldActivity_ID IS NULL)
		   AND EXISTS (SELECT * FROM [ECWP-eReleveData].dbo.TStations S2 where S.TSta_PK_ID <> s2.TSta_PK_ID and isnull(S2.LAT,-1) =isnull(S.LAT,-1) and isnull(S2.LON,-1) =isnull(S.LON,-1) and S.[DATE] = S2.[DATE] AND S2.FieldActivity_ID != 27)
