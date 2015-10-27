CREATE VIEW SensorDynPropValuesNow AS
SELECT dyn_val.*,dyn.Name as Name,dyn.TypeProp FROM 
  .SensorDynPropValue dyn_val 
  JOIN SensorDynProp dyn ON dyn_val.FK_SensorDynProp = dyn.ID
	 where not exists (select * from  SensorDynPropValue  V2 
         where V2.FK_SensorDynProp  =  dyn_val.FK_SensorDynProp  and V2.FK_Sensor = dyn_val.FK_Sensor
        AND V2.startdate > dyn_val.startdate and V2.startdate <= GETDATE())



