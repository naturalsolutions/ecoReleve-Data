




--CREATE VIEW [dbo].[V_Qry_AllIndivs_FirstStation] as

select



v.Ind_ID,
v.Origin,
/* TODO Jointure sur equiment
e.VHF@Station,
e.VHFModel@Station,
e.PTT@Station,
e.PTTModel@Station,
*/
v.Sex,
coalesce(v.ReleaseRing,v.BreedingRing,'No Mark') as Ring,
v.BreedingRing,
v.ReleaseRing,
v.ChipCode
--v.Mark1Color,
--v.Mark1Position,
--v.Mark1Code,
--v.Mark2Color,
--v.Mark2Position,
--v.Mark2Code,
--v.BirthDate,
--v.DeathDate,
--v.Age,
--T.StaType,
--T.Sta_ID,
--T.StaName,
--T.StaDate,
--0 as DaysSinceFirstStation,
--T.Region,
--T.Place,
--T.LAT,
--T.LON,
--T.Precision,
--T.FW1,
--T.FW2,
--T.FA, 
--T.FA_ID

from

(select
VInd.ID as Ind_ID,
VInd.Breeding_Ring_Code as BreedingRing,
VInd.Release_Ring_Code as ReleaseRing,
VInd.Chip_Code as ChipCode,
VInd.Mark_code_1 as Mark1Code,
VInd.Birth_date as BirthDate,
VInd.Death_date as DeathDate,
Vind.origin as Origin,
Vind.Sex as Sex
from TIndividu as VInd
) as v
JOIN [dbo].[TProtocol_Chiroptera_capture] T ON T.fk_individual = V.Ind_ID JOIN TStation S on T.fk_station = S.ID
WHERE NOT EXISTS (select * from [dbo].[TProtocol_Chiroptera_capture] T2 JOIN TStation S2 on T2.fk_station = S2.ID where T2.fk_individual = T.fk_individual and S2.stationdate < s.stationdate)




GO


