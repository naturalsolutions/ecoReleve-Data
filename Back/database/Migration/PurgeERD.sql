delete from IndividualDynPropValue
dbcc  CHECKIDENT (IndividualDynPropValue,reseed,0)

delete from SensorDynPropValue
dbcc  CHECKIDENT (SensorDynPropValue,reseed,0)

delete from StationDynPropValue
dbcc  CHECKIDENT (StationDynPropValue,reseed,0)

delete from MonitoredSiteDynPropValue
dbcc  CHECKIDENT (MonitoredSiteDynPropValue,reseed,0)

<<<<<<< HEAD
=======
delete from Equipment
dbcc  CHECKIDENT (Equipment,reseed,0)

>>>>>>> c736a1259dfed9e43e5cf39f2f5799e74964caca
truncate TABLE ObservationDynPropValue
dbcc  CHECKIDENT (ObservationDynPropValue,reseed,0)

delete from Observation
dbcc  CHECKIDENT (Observation,reseed,0)

truncate table Individual_Location
dbcc  CHECKIDENT (Individual_Location,reseed,0)

delete from Station_FieldWorker
dbcc  CHECKIDENT (Station_FieldWorker,reseed,0)

delete from Station
dbcc  CHECKIDENT (Station,reseed,0)

delete from Individual
dbcc  CHECKIDENT (Individual,reseed,0)

delete from Sensor
dbcc  CHECKIDENT (Sensor,reseed,0)

delete from MonitoredSitePosition
dbcc  CHECKIDENT (MonitoredSitePosition,reseed,0)

delete from MonitoredSite
dbcc  CHECKIDENT (MonitoredSite,reseed,0)

delete from Equipment
dbcc  CHECKIDENT (Equipment,reseed,0)



