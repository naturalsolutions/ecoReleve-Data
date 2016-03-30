
truncate TABLE ObservationDynPropValue
dbcc  CHECKIDENT (ObservationDynPropValue,reseed,0)

delete from Observation
dbcc  CHECKIDENT (Observation,reseed,0)


ALTER TABLE [ObservationDynPropValue] ALTER COLUMN [ValueFloat] decimal(20,5)




