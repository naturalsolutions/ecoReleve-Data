SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO




CREATE VIEW [dbo].[ObservationDynPropValuesNow] AS
SELECT dyn_val.*,dyn.Name as Name,dyn.TypeProp FROM 
  .ObservationDynPropValue dyn_val 
  JOIN ObservationDynProp dyn ON dyn_val.FK_ObservationDynProp = dyn.ID
	 where not exists (select * from  ObservationDynPropValue  V2 
         where V2.FK_ObservationDynProp  =  dyn_val.FK_ObservationDynProp  and V2.FK_Observation = dyn_val.FK_Observation
        AND V2.startdate > dyn_val.startdate and V2.startdate <= GETDATE())



GO
