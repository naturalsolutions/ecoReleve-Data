INSERT INTO [NewModelERD].[dbo].SensorType (
Name,
Status)
VALUES ('Argos',4)
INSERT INTO [NewModelERD].[dbo].SensorType (
Name,
Status)
VALUES ('GSM',4)
INSERT INTO [NewModelERD].[dbo].SensorType (
Name,
Status)
VALUES ('RFID',4)
INSERT INTO [NewModelERD].[dbo].SensorType (
Name,
Status)
VALUES ('VHF',4)


-------------- INSERT  sensor Argos and GSM -------------------------------------------------------------------
INSERT INTO [NewModelERD].[dbo].Sensor(
	[UnicName]
      ,[Model]
      ,[Compagny]
      ,[SerialNumber]
      ,[creationDate]
      ,[FK_SensorType]
      ,[OldID]
)
SELECT  
[id19@TCarac_PTT],
[id41@TCaracThes_Model_Precision],
[id42@TCaracThes_Company_Precision],
[id6@TCarac_Transmitter_Serial_Number],
GETDATE(),
CASE WHEN [id41@TCaracThes_Model_Precision] like '%solar%' THEN  1 
	else 
		2
	END,
[Trx_Sat_Obj_PK]  
FROM [ECWP-eReleveData].[dbo].[TViewTrx_Sat]
where [id41@TCaracThes_Model_Precision] not like '%RI%'

-------------- INSERT  RFID -------------------------------------------------------------------

INSERT INTO [NewModelERD].[dbo].Sensor(
	[UnicName]
      ,[Model]
      ,[Compagny]
      ,[SerialNumber]
      ,[creationDate]
      ,[FK_SensorType]
      ,[OldID]
)

SELECT 
      [identifier]
	  ,model
      ,[manufacturer]
      ,[serial_number]
	  ,[creation_date]
	  , 3
	, PK_id
  FROM [ECWP-eReleveData].[dbo].[T_Object]
