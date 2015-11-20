delete from IndividualType_IndividualDynProp
dbcc  CHECKIDENT (IndividualType_IndividualDynProp,reseed,0)

/*
delete from SensorType_SensorDynProp
dbcc  CHECKIDENT (SensorType_SensorDynProp,reseed,0)

delete from SensorType
dbcc  CHECKIDENT (SensorType,reseed,0)
*/

delete from MonitoredSiteType
dbcc  CHECKIDENT (MonitoredSiteType,reseed,0)

delete from IndividualDynProp
dbcc  CHECKIDENT (IndividualDynProp,reseed,0)



DECLARE @output table ( id int)

-- Create Individus Type IF Missing
IF NOT EXISTS (select * from IndividualType it where it.Name = 'Standard')
BEGIN
	print 'Type to be created'
	
	INSERT INTO [dbo].[IndividualType]
           ([Name]
           ,[Status])
		   VALUES ('Standard',4)
END



-----------------------------------INSERT dynProp and Linked type_DynProp -------------------------------------------------------------
INSERT INTO  IndividualDynProp (Name,TypeProp)
OUTPUT inserted.ID into @output
 Values ('Release_Ring_Position','String'),
('Release_Ring_Color','String'),
('Release_Ring_Code','String'),
('Breeding_Ring_Position','String'),
('Breeding_Ring_Color','String'),
('Breeding_Ring_Code','String'),
('Chip_Code','String'),
('Mark_Color_1','String'),
('Mark_Position_1','String'),
('Mark_Color_2','String'),
('Mark_Position_2','String'),
('Origin','String'),
('Comments','String'),
('Mark_code_1','String'),
('Mark_code_2','String'),
('Individual_Status','String'),
('Monitoring_Status','String'),
('Survey_type','String'),
('Sex','String')

INSERT INTO  IndividualType_IndividualDynProp (FK_IndividualDynProp ,FK_IndividualType,Required)
SELECT id , 1 ,1
FROM @output


IF NOT EXISTS (select * from MonitoredSiteType m where m.ID=1) 
begin
	print 'TO be created'

	SET IDENTITY_INSERT MonitoredSiteType ON
	INSERT INTO [dbo].[MonitoredSiteType]
           (ID,[Name]
           ,[Status])
		VALUES (1,'Standard',4)
	SET IDENTITY_INSERT MonitoredSiteType OFF
end

/*
SET IDENTITY_INSERT SensorType ON 

INSERT INTO SensorType (
ID,
Name,
Status)
VALUES (1,'Argos',4)

INSERT INTO SensorType (
ID,
Name,
Status)
VALUES (2,'GSM',4)

INSERT INTO SensorType (
ID,
Name,
Status)
VALUES (3,'RFID',4)

INSERT INTO SensorType (
ID,
Name,
Status)
VALUES (4,'VHF',4)

SET IDENTITY_INSERT SensorType OFF

*/