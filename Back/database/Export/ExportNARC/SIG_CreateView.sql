


ALTER VIEW [dbo].[GIS_AllStations_PTT_NON_UAE_NEW]
AS
SELECT         dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staID AS sta_id, dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.indID AS Ind_ID, 
                         dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staDate, dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.PTT@Station AS PTT_Station, st.Name AS TypeOfData, 
                         dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.Precision, dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.RelPlace, dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.RelCountry, 
                         dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.Origin, dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.RelYear, dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.RelDate, 
                         dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.Sex, dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.Age, dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.ReleaseRingCode, 
                         dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.MonitoringStatus@Station, dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.SurveyType@Station, 
                         dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.PTTModel@Station, dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.CurrentMonitoringStatus, 
                         dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.CurrentIndividualStatus, dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.CurrentSurveyType, 
                         dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.CurrentPTT, dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staType, dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.DeathDate, 
                         dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.LAT, dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.LON, dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.ELE, 
                         dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.SpecieName
FROM            dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData INNER JOIN
                         NARC_eReleveData.dbo.TStation_Type AS st ON dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staType = st.PK
WHERE        (NOT (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.RelCountry IN (N'Cambodia', N'United Arab Emirates'))) AND (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staType IN (20, 30, 40)) AND 
                         (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.PTT@Station IS NOT NULL) AND (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staDate >= CONVERT(DATETIME, '2015-06-01 00:00:00', 102)) AND 
                         (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staDate < CONVERT(DATETIME, '2016-04-26 00:00:00', 102)) OR
                         (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staType = 50) AND (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.PTT@Station IN (88806, 98296, 115330, 128468, 128470, 131743, 134782, 
                         134783, 134784)) AND (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staDate >= CONVERT(DATETIME, '2016-01-01 00:00:00', 102)) AND 
                         (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.Precision < 1001) OR
                         (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staType = 50) AND (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.PTT@Station IN (131819, 133907)) AND 
                         (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staDate >= CONVERT(DATETIME, '2016-01-01 00:00:00', 102)) AND (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staDate < CONVERT(DATETIME, 
                         '2016-04-17 00:00:00', 102)) AND (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.Precision < 1001) OR
                         (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staType = 50) AND (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.PTT@Station IN (88887, 88889)) AND 
                         (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staDate >= CONVERT(DATETIME, '2016-01-01 00:00:00', 102)) AND (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staDate < CONVERT(DATETIME, 
                         '2014-05-16 00:00:00', 102)) AND (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.Precision < 1001) OR
                         (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staType = 50) AND (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.PTT@Station IN (131762)) AND 
                         (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staDate >= CONVERT(DATETIME, '2016-01-01 00:00:00', 102)) AND (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staDate < CONVERT(DATETIME, 
                         '2014-09-13 00:00:00', 102)) AND (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.Precision < 1001) OR
                         (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staType = 50) AND (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.PTT@Station = 133909) AND 
                         (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staDate >= CONVERT(DATETIME, '2016-01-01 00:00:00', 102)) AND (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.Precision < 1001) OR
                         (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staType = 50) AND (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.PTT@Station = 44236) AND 
                         (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staDate >= CONVERT(DATETIME, '2016-01-01 00:00:00', 102)) AND (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staDate < CONVERT(DATETIME, 
                         '2016-04-17 00:00:00', 102)) AND (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.Precision < 1001) OR
                         (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staType = 50) AND (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.PTT@Station = 67514) AND 
                         (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staDate >= CONVERT(DATETIME, '2016-01-01 00:00:00', 102)) AND (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staDate < CONVERT(DATETIME, 
                         '2016-04-17 00:00:00', 102)) AND (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.Precision < 1001) OR
                         (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staType = 50) AND (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.PTT@Station IN (131759, 93851)) AND 
                         (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staDate >= CONVERT(DATETIME, '2016-01-01 00:00:00', 102)) AND (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staDate < CONVERT(DATETIME, 
                         '2015-09-13 00:00:00', 102)) AND (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.Precision < 1001) OR
                         (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staType = 50) AND (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.PTT@Station = 88844) AND 
                         (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staDate >= CONVERT(DATETIME, '2016-01-01 00:00:00', 102)) AND (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staDate < CONVERT(DATETIME, 
                         '2016-04-17 00:00:00', 102)) AND (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.Precision < 1001) OR
                         (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staType = 50) AND (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.PTT@Station = 136940) AND 
                         (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staDate >= CONVERT(DATETIME, '2016-01-01 00:00:00', 102)) AND (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.Precision < 1001) OR
                         (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staType = 50) AND (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.PTT@Station = 136889) AND 
                         (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staDate >= CONVERT(DATETIME, '2016-01-01 00:00:00', 102)) AND (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.Precision < 1001) OR
                         (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staType = 50) AND (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.PTT@Station = 131748) AND 
                         (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staDate >= CONVERT(DATETIME, '2016-01-01 00:00:00', 102)) AND (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.Precision < 1001) OR
                         (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staType = 50) AND (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.PTT@Station IN (137616, 137619, 137634, 138331, 137615)) AND 
                         (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staDate >= CONVERT(DATETIME, '2016-01-01 00:00:00', 102)) AND (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staDate < CONVERT(DATETIME, 
                         '2015-04-05 00:00:00', 102)) AND (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.Precision < 1001) OR
                         (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staType = 50) AND (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.PTT@Station = 131792) AND 
                         (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staDate >= CONVERT(DATETIME, '2016-01-01 00:00:00', 102)) AND (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staDate < CONVERT(DATETIME, 
                         '2015-04-05 00:00:00', 102)) AND (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.Precision < 1001) OR
                         (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staType = 50) AND (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.PTT@Station = 136918) AND 
                         (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staDate >= CONVERT(DATETIME, '2016-01-01 00:00:00', 102)) AND (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staDate < CONVERT(DATETIME, 
                         '2015-04-21 00:00:00', 102)) AND (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.Precision < 1001) OR
                         (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staType = 50) AND (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.PTT@Station = 140760) AND 
                         (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staDate >= CONVERT(DATETIME, '2016-01-01 00:00:00', 102)) AND (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staDate < CONVERT(DATETIME, 
                         '2015-09-13 00:00:00', 102)) AND (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.Precision < 1001) OR
                         (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staType = 50) AND (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.PTT@Station IN (115299, 131758)) AND 
                         (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staDate >= CONVERT(DATETIME, '2016-01-01 00:00:00', 102)) AND (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staDate < CONVERT(DATETIME, 
                         '2016-04-17 00:00:00', 102)) AND (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.Precision < 1001) OR
                         (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staType = 50) AND (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.PTT@Station = 140812) AND 
                         (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staDate >= CONVERT(DATETIME, '2016-01-01 00:00:00', 102)) AND (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staDate < CONVERT(DATETIME, 
                         '2015-07-26 00:00:00', 102)) AND (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.Precision < 1001) OR
                         (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staType = 50) AND (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.PTT@Station IN (140755, 140775)) AND 
                         (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staDate >= CONVERT(DATETIME, '2016-01-01 00:00:00', 102)) AND (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staDate < CONVERT(DATETIME, 
                         '2015-07-26 00:00:00', 102)) AND (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.Precision < 1001) OR
                         (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staType = 50) AND (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.PTT@Station = 140806) AND 
                         (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staDate >= CONVERT(DATETIME, '2016-01-01 00:00:00', 102)) AND (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staDate < CONVERT(DATETIME, 
                         '2015-07-26 00:00:00', 102)) AND (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.Precision < 1001) OR
                         (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staType = 50) AND (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.PTT@Station = 133917) AND 
                         (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staDate >= CONVERT(DATETIME, '2016-01-01 00:00:00', 102)) AND (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staDate < CONVERT(DATETIME, 
                         '2015-08-02 00:00:00', 102)) AND (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.Precision < 1001) OR
                         (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staType = 50) AND (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.PTT@Station = 140792) AND 
                         (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staDate >= CONVERT(DATETIME, '2016-01-01 00:00:00', 102)) AND (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.Precision < 1001) OR
                         (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staType = 50) AND (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.PTT@Station = 138358) AND 
                         (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staDate >= CONVERT(DATETIME, '2016-01-01 00:00:00', 102)) AND (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staDate < CONVERT(DATETIME, 
                         '2015-09-27 00:00:00', 102)) AND (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.Precision < 1001) OR
                         (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staType = 50) AND (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.PTT@Station = 136908) AND 
                         (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staDate >= CONVERT(DATETIME, '2016-01-01 00:00:00', 102)) AND (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staDate < CONVERT(DATETIME, 
                         '2016-04-17 00:00:00', 102)) AND (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.Precision < 1001) OR
                         (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staType = 50) AND (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.PTT@Station = 44243) AND 
                         (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staDate >= CONVERT(DATETIME, '2016-01-01 00:00:00', 102)) AND (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staDate < CONVERT(DATETIME, 
                         '2016-04-17 00:00:00', 102)) AND (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.Precision < 1001) OR
                         (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staType = 50) AND (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.PTT@Station = 151228) AND 
                         (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staDate >= CONVERT(DATETIME, '2016-01-01 00:00:00', 102)) AND (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staDate < CONVERT(DATETIME, 
                         '2015-09-27 00:00:00', 102)) AND (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.Precision < 1001) OR
                         (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staType = 50) AND (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.PTT@Station = 88846) AND 
                         (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staDate >= CONVERT(DATETIME, '2016-01-01 00:00:00', 102)) AND (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staDate < CONVERT(DATETIME, 
                         '2015-09-27 00:00:00', 102)) AND (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.Precision < 1001) OR
                         (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staType = 50) AND (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.PTT@Station = 137621) AND 
                         (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staDate >= CONVERT(DATETIME, '2016-01-01 00:00:00', 102)) AND (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staDate < CONVERT(DATETIME, 
                         '2015-09-27 00:00:00', 102)) AND (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.Precision < 1001) OR
                         (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staType = 50) AND (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.PTT@Station IN (130882, 140761, 151259)) AND 
                         (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staDate >= CONVERT(DATETIME, '2016-01-01 00:00:00', 102)) AND (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staDate < CONVERT(DATETIME, 
                         '2015-09-27 00:00:00', 102)) AND (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.Precision < 1001) OR
                         (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staType = 50) AND (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.PTT@Station = 136900) AND 
                         (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staDate >= CONVERT(DATETIME, '2016-01-01 00:00:00', 102)) AND (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.Precision < 1001) OR
                         (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staType = 50) AND (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.PTT@Station = 115502) AND 
                         (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staDate >= CONVERT(DATETIME, '2016-01-01 00:00:00', 102)) AND (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.Precision < 1001) OR
                         (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staType = 50) AND (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.PTT@Station = 131758) AND 
                         (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staDate >= CONVERT(DATETIME, '2016-01-01 00:00:00', 102)) AND (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staDate < CONVERT(DATETIME, 
                         '2016-04-17 00:00:00', 102)) AND (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.Precision < 1001) OR
                         (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staType = 50) AND (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.PTT@Station = 140779) AND 
                         (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staDate >= CONVERT(DATETIME, '2016-01-01 00:00:00', 102)) AND (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.Precision < 1001) OR
                         (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staType = 50) AND (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.PTT@Station = 138326) AND 
                         (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staDate >= CONVERT(DATETIME, '2016-01-01 00:00:00', 102)) AND (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staDate < CONVERT(DATETIME, 
                         '2016-04-17 00:00:00', 102)) AND (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.Precision < 1001) OR
                         (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staType = 50) AND (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.PTT@Station = 134425) AND 
                         (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staDate >= CONVERT(DATETIME, '2016-01-01 00:00:00', 102)) AND (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staDate < CONVERT(DATETIME, 
                         '2016-04-17 00:00:00', 102)) AND (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.Precision < 1001) OR
                         (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staType = 50) AND (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.PTT@Station = 128576) AND 
                         (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staDate >= CONVERT(DATETIME, '2016-01-01 00:00:00', 102)) OR
                         (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staType = 50) AND (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.PTT@Station = 148286) AND 
                         (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staDate >= CONVERT(DATETIME, '2016-01-01 00:00:00', 102)) AND (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.Precision < 1001) OR
                         (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staType = 50) AND (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.PTT@Station = 136915) AND 
                         (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staDate >= CONVERT(DATETIME, '2016-01-01 00:00:00', 102)) AND (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.Precision < 1001) OR
                         (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staType = 50) AND (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.PTT@Station IN (111741, 121527)) AND 
                         (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staDate >= CONVERT(DATETIME, '2016-01-01 00:00:00', 102)) AND (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staDate < CONVERT(DATETIME, 
                         '2016-04-17 00:00:00', 102)) AND (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.Precision < 1001) OR
                         (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staType = 50) AND (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.PTT@Station IN (115535, 140773, 140803)) AND 
                         (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staDate >= CONVERT(DATETIME, '2016-01-01 00:00:00', 102)) AND (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staDate < CONVERT(DATETIME, 
                         '2016-04-17 00:00:00', 102)) AND (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.Precision < 1001) OR
                         (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staType = 50) AND (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.PTT@Station = 115533) AND 
                         (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staDate >= CONVERT(DATETIME, '2016-01-01 00:00:00', 102)) AND (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.Precision < 1001) OR
                         (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staType = 50) AND (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.PTT@Station = 42832) AND 
                         (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staDate >= CONVERT(DATETIME, '2016-01-01 00:00:00', 102)) AND (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.Precision < 1001) OR
                         (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staType = 50) AND (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.PTT@Station IN (140820, 151232)) AND 
                         (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staDate > CONVERT(DATETIME, '2016-01-09 00:00:00', 102)) AND (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staDate < CONVERT(DATETIME, 
                         '2016-04-17 00:00:00', 102)) AND (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.Precision < 1001) OR
                         (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staType = 50) AND (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.PTT@Station = 115510) AND 
                         (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staDate >= CONVERT(DATETIME, '2016-01-07 00:00:00', 102)) AND (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.Precision < 1001) OR
                         (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staType = 50) AND (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.PTT@Station = 121565) AND 
                         (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staDate >= CONVERT(DATETIME, '2016-03-17 00:00:00', 102)) AND (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staDate < CONVERT(DATETIME, 
                         '2016-04-17 00:00:00', 102)) AND (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.Precision < 1001) OR
                         (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staType = 50) AND (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.PTT@Station = 60169) AND 
                         (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staDate >= CONVERT(DATETIME, '2016-03-17 00:00:00', 102)) AND (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.Precision < 1001)

GO

CREATE VIEW [dbo].[GIS_AllStations_PTT_UAE_NEW]
AS
SELECT         dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staID AS sta_id, dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.indID AS Ind_ID, 
                         dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staDate, dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.PTT@Station AS PTT_Station, st.Name AS TypeOfData, 
                         dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.Precision, dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.RelPlace, dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.RelCountry, 
                         dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.Origin, dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.RelYear, dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.RelDate, 
                         dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.Sex, dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.Age, dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.ReleaseRingCode, 
                         dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.MonitoringStatus@Station, dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.SurveyType@Station, 
                         dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.PTTModel@Station, dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.CurrentMonitoringStatus, 
                         dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.CurrentIndividualStatus, dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.CurrentSurveyType, 
                         dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.CurrentPTT, dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staType, dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.DeathDate, 
                         dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.LAT, dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.LON, dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.ELE, 
                         dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.SpecieName
FROM            dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData INNER JOIN
                         NARC_eReleveData.dbo.TStation_Type AS st ON dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staType = st.PK
WHERE        (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.RelCountry = 'United Arab Emirates') AND (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staType IN (20, 30, 40, 50)) AND 
                         (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staDate >= CONVERT(DATETIME, '31/12/2014', 103)) AND (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.PTT@Station IS NOT NULL) AND 
                         (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.Precision < 1000) AND (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staDate < CONVERT(DATETIME, '26/04/2016', 103))
GO


CREATE VIEW [dbo].[GIS_AllBirds_RelCaptSta]
AS
SELECT     dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staID AS sta_id, dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.indID AS Ind_ID, 
                      dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staDate, dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.PTT@Station AS PTT_Station, 
                      st.Name AS TypeOfData, dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.Precision, dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.RelPlace, 
                      dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.RelCountry, dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.Origin, 
                      dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.RelYear, dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.Sex, 
                      dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.Age, dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.ReleaseRingCode, 
                      dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.MonitoringStatus@Station, dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.SurveyType@Station, 
                      dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.PTTModel@Station, dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.CurrentMonitoringStatus, 
                      dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.CurrentIndividualStatus, dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.CurrentSurveyType, 
                      dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.CurrentPTT, dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staType, 
                      dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.DeathDate, dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.LAT, 
                      dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.LON, dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.ELE, 
                      dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.SpecieName
FROM         dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData INNER JOIN
                      NARC_eReleveData.dbo.TStation_Type AS st ON dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staType = st.PK
WHERE     (NOT (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.RelCountry IN (N'Cambodia'))) AND (dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staType IN (20, 
                      30))
ORDER BY PTT_Station, dbo.GIS_AllStations_PTTBirds_With_FirstRelCapData.staDate DESC




CREATE VIEW [dbo].[Ecolo_LastStations_PTT_NON_UAE_GT]
AS
SELECT     TOP (100) PERCENT allSta.Ind_ID, allSta.sta_id, allSta.staDate, allSta.PTT_Station, allSta.TypeOfData, allSta.Precision, allSta.RelPlace, allSta.RelCountry, 
                      allSta.Origin, allSta.RelYear, allSta.RelDate, allSta.Sex, allSta.Age, allSta.ReleaseRingCode, allSta.MonitoringStatus@Station, allSta.SurveyType@Station, 
                      allSta.PTTModel@Station, allSta.CurrentMonitoringStatus, allSta.CurrentIndividualStatus, allSta.CurrentSurveyType, allSta.CurrentPTT, allSta.staType, 
                      allSta.DeathDate, allSta.LAT, allSta.LON, allSta.ELE, allSta.SpecieName
FROM        
                      dbo.Ecolo_AllStations_PTT_NON_UAE AS allSta 
					  where not exists (select * from Ecolo_AllStations_PTT_NON_UAE AllSta2 where AllSta2.Ind_ID = allSta.Ind_ID and AllSta2.staDate > allSta.staDate)





ALTER VIEW [dbo].[GIS_LastStations_PTT_UAE_NEW_GT]
AS
SELECT     allSta.sta_id, allSta.Ind_ID, allSta.staDate, allSta.PTT_Station, allSta.TypeOfData, allSta.Precision, allSta.RelPlace, allSta.RelCountry, 
                      allSta.Origin, allSta.RelYear, allSta.RelDate, allSta.Sex, allSta.Age, allSta.ReleaseRingCode, allSta.MonitoringStatus@Station, allSta.SurveyType@Station, 
                      allSta.PTTModel@Station, allSta.CurrentMonitoringStatus, allSta.CurrentIndividualStatus, allSta.CurrentSurveyType, allSta.CurrentPTT, allSta.staType, 
                      allSta.DeathDate, allSta.LAT, allSta.LON, allSta.ELE, allSta.SpecieName
FROM                  dbo.GIS_AllStations_PTT_UAE_NEW AS allSta 
WHERE NOT EXISTS (SELECT * 
					from GIS_AllStations_PTT_UAE_NEW allSta2 
					where  
					 allSta2.Ind_ID = allSta.Ind_ID and allSta2.staDate > AllSta.staDate
					)
					
GO

CREATE VIEW [dbo].[GIS_LastStations_PTT_NON_UAE_NEW_GT]
AS
SELECT        Ind_ID, sta_id, staDate, PTT_Station, TypeOfData, Precision, RelPlace, RelCountry, Origin, RelYear, RelDate, Sex, Age, ReleaseRingCode, MonitoringStatus@Station, SurveyType@Station, 
                         PTTModel@Station, CurrentMonitoringStatus, CurrentIndividualStatus, CurrentSurveyType, CurrentPTT, staType, DeathDate, LAT, LON, ELE, SpecieName
FROM            dbo.GIS_AllStations_PTT_NON_UAE_NEW AS allSta
WHERE        (NOT EXISTS
                             (SELECT        *
                               FROM            dbo.GIS_AllStations_PTT_NON_UAE_NEW AS allSta2
                               WHERE        (Ind_ID = allSta.Ind_ID) AND (staDate > allSta.staDate)))

GO