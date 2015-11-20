CREATE VIEW VStationFieldWorkers
AS
 select  S.* , replace('@'+
	(
    select ',' + Tuse_FirstName + ' '  +  Tuse_Lastname 
    from EcoReleve_ECWP.[dbo].[Station_FieldWorker] SF JOIN SECURITE.dbo.TUsers U on SF.FK_FieldWorker = u.[TUse_PK_ID]
	where S.ID = SF.fk_station
	order by Tuse_Lastname
    for xml path('')
    )
	,'@,','') FieldWorkers
from Tstation S


