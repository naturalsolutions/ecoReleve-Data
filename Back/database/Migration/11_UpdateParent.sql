

UPDATE O SET [Parent_Observation]=OP.ID
--select *
from [ECWP-eReleveData].dbo.TProtocol_Capture_Individual CI 
JOIN [EcoReleve_ECWP].dbo.observation O on o.original_id = CI.pk 
JOIN [EcoReleve_ECWP].dbo.ProtocoleType PT on PT.ID = o.FK_ProtocoleType and  PT.name ='Capture Individual'
JOIN [EcoReleve_ECWP].dbo.observation OP ON   op.original_id = CI.fk_group 
JOIN [EcoReleve_ECWP].dbo.ProtocoleType PTT on PTT.ID = op.FK_ProtocoleType and PTT.name = 'Capture Group'


UPDATE O SET [Parent_Observation]=OP.ID

--select *
from [ECWP-eReleveData].dbo.TProtocol_Release_Individual CI 
JOIN [EcoReleve_ECWP].dbo.observation O on o.original_id = CI.pk 
JOIN [EcoReleve_ECWP].dbo.ProtocoleType PT on PT.ID = o.FK_ProtocoleType and  PT.name ='Release Individual'
JOIN [EcoReleve_ECWP].dbo.observation OP ON   op.original_id = CI.fk_group 
JOIN [EcoReleve_ECWP].dbo.ProtocoleType PTT on PTT.ID = op.FK_ProtocoleType and PTT.name = 'Release Group'



UPDATE O SET [Parent_Observation]=OP.ID

--select *
from [ECWP-eReleveData].dbo.TProtocol_Clutch_Description CI 
JOIN [EcoReleve_ECWP].dbo.observation O on o.original_id = CI.pk 
JOIN [EcoReleve_ECWP].dbo.ProtocoleType PT on PT.ID = o.FK_ProtocoleType and  PT.name ='Clutch Description'
JOIN [EcoReleve_ECWP].dbo.observation OP ON   op.original_id = CI.FK_Nest
JOIN [EcoReleve_ECWP].dbo.ProtocoleType PTT on PTT.ID = op.FK_ProtocoleType and PTT.name = 'Nest Description'

UPDATE O SET [Parent_Observation]=OP.ID

--select *
from [ECWP-eReleveData].dbo.TProtocol_Vertebrate_Individual CI 
JOIN [EcoReleve_ECWP].dbo.observation O on o.original_id = CI.pk 
JOIN [EcoReleve_ECWP].dbo.ProtocoleType PT on PT.ID = o.FK_ProtocoleType and  PT.name ='Vertebrate Individual'
JOIN [EcoReleve_ECWP].dbo.observation OP ON   op.original_id = CI.Fk_Group
JOIN [EcoReleve_ECWP].dbo.ProtocoleType PTT on PTT.ID = op.FK_ProtocoleType and PTT.name = 'Vertebrate Group'