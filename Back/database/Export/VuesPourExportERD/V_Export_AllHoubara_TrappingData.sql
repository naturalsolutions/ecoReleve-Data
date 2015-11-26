CREATE V_Export_AllHoubara_TrappingData
AS


select e.*,h.*
from  [EcoReleve_Export_ECWP].dbo.VStationFieldWorkers SFW 
JOIN [EcoReleve_Export_ECWP].dbo.TProtocol_Capture_Group CG ON CG.fk_station =  SFW.ID
LEFT JOIN [EcoReleve_Export_ECWP].dbo.TProtocol_Capture_Individual ci on ci.[Parent_Observation] = CG.ID
LEFT JOIN [EcoReleve_Export_ECWP].dbo.TProtocol_Bird_Biometry BB ON BB.FK_Individual = ci.FK_Individual and BB.fk_station = SFW.ID
LEFT JOIN [EcoReleve_Export_ECWP].dbo.VIndividuEquipementHisto H on ci.FK_Individual = h.FK_Individual and h.[StartDate] <= SFW.StationDate and deploy=1
LEFT JOIN [EcoReleve_Export_ECWP].dbo.TIndividu I on I.ID = ci.FK_Individual 
--outer apply [EcoReleve_Export_ECWP].dbo.fn_v_qry_GetEquipAtDate(ci.FK_Individual,SFW.StationDate) e
WHERE NOT EXISTS (SELECT * from [EcoReleve_Export_ECWP].dbo.VIndividuEquipementHisto H2 where  H2.FK_Individual = h.FK_Individual and H2.StartDate > h.StartDate)
AND CG.Name_Taxon = 'Chlamydotis undulata undulata'



