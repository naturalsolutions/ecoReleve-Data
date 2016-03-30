

UPDATE O SET [Parent_Observation]=OP.ID
--select *
from [NARC_eReleveData].dbo.TProtocol_Capture_Individual CI 
JOIN observation O on o.original_id = CI.pk 
JOIN ProtocoleType PT on PT.ID = o.FK_ProtocoleType and  PT.name ='Capture Individual'
JOIN observation OP ON   op.original_id = CI.fk_group 
JOIN ProtocoleType PTT on PTT.ID = op.FK_ProtocoleType and PTT.name = 'Capture Group'


UPDATE O SET [Parent_Observation]=OP.ID

--select *
from [NARC_eReleveData].dbo.TProtocol_Release_Individual CI 
JOIN observation O on o.original_id = CI.pk 
JOIN ProtocoleType PT on PT.ID = o.FK_ProtocoleType and  PT.name ='Release Individual'
JOIN observation OP ON   op.original_id = CI.fk_group 
JOIN ProtocoleType PTT on PTT.ID = op.FK_ProtocoleType and PTT.name = 'Release Group'



UPDATE O SET [Parent_Observation]=OP.ID

--select *
from [NARC_eReleveData].dbo.TProtocol_Clutch_Description CI 
JOIN observation O on o.original_id = CI.pk 
JOIN ProtocoleType PT on PT.ID = o.FK_ProtocoleType and  PT.name ='Clutch Description'
JOIN observation OP ON   op.original_id = CI.FK_Nest
JOIN ProtocoleType PTT on PTT.ID = op.FK_ProtocoleType and PTT.name = 'Nest Description'

UPDATE O SET [Parent_Observation]=OP.ID

--select *
from [NARC_eReleveData].dbo.TProtocol_Vertebrate_Individual CI 
JOIN observation O on o.original_id = CI.pk 
JOIN ProtocoleType PT on PT.ID = o.FK_ProtocoleType and  PT.name ='Vertebrate Individual'
JOIN observation OP ON   op.original_id = CI.Fk_Group
JOIN ProtocoleType PTT on PTT.ID = op.FK_ProtocoleType and PTT.name = 'Vertebrate Group'