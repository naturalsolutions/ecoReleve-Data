-- Vérification avant purge


select * 
from ProtocoleType PT JOIN ProtocoleType_ObservationDynProp PTOD ON PTOD.FK_ProtocoleType = PT.ID
JOIN ObservationDynProp P on p.ID = PTOD.FK_ObservationDynProp



DECLARE @DynPropToDelete TABLE(ID INT)

INSERT INTO  @DynPropToDelete
select PTOD.FK_ObservationDynProp 
			FROM ProtocoleType_ObservationDynProp PTOD 
			JOIN Protocoletype PT ON PTOD.FK_ProtocoleType = PT.ID 
			WHERE PT.OriginalId like 'FormBuilder%'

DELETE FROM ProtocoleType_ObservationDynProp 
WHERE id  in
			(
			select PTOD.ID
			FROM ProtocoleType_ObservationDynProp PTOD 
			JOIN Protocoletype PT ON PTOD.FK_ProtocoleType = PT.ID 
			WHERE PT.OriginalId like 'FormBuilder%'
			)
			
DELETE FROM ObservationDynPropValue 
WHERE FK_ObservationDynProp IN
			(select ID from @DynPropToDelete
			)			
			

DELETE FROM Observation
WHERE FK_ProtocoleType IN (select ID from ProtocoleType PT WHERE PT.OriginalId like 'FormBuilder%')
			
DELETE FROM ProtocoleType WHERE OriginalId like 'FormBuilder%'

DELETE FROM ObservationDynProp WHERE ID IN (select ID from @DynPropToDelete)

		