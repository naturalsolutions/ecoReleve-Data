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

-------------- INSERT  sensor Argos and GSM -------------------------------------------------------------------
INSERT INTO Sensor(
	UnicIdentifier
      ,[Model]
      ,[Compagny]
      ,[SerialNumber]
      ,[creationDate]
      ,[FK_SensorType]
      ,Original_ID
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

INSERT INTO Sensor(
	UnicIdentifier
      ,[Model]
      ,[Compagny]
      ,[SerialNumber]
      ,[creationDate]
      ,[FK_SensorType]
      ,Original_ID
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
