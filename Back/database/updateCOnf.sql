UPDATE ModuleGrids SET Options = '{"source": "autocomplete/monitoredSites/Name", "minLength":3}'
WHERE Name = 'FK_MonitoredSite' and Module_ID = 3 


UPDATE ModuleGrids SET Options ='
SELECT [Region]  as val,[Region] as label 
FROM  [Region] r 
where EXISTS (Select * From Station s where s.FK_Region = r.ID) '
WHERE Name = 'FK_Region' and Module_ID = 3 


UPDATE ModuleGrids SET Label ='Identifier'
WHERE Name = 'UnicIdentifier' and Module_ID = 14

UPDATE ModuleGrids SET Options ='
SELECT Distinct Name as label, Name as val FROM SensorType'
WHERE Name = 'FK_SensorType' and Module_ID = 14
