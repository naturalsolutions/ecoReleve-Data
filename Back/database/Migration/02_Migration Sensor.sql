


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



-------------- INSERT  VHF not finished  -------------------------------------------------------------------
INSERT INTO Sensor(
	UnicIdentifier
      ,[Model]
      ,[Compagny]
      ,[SerialNumber]
      ,[creationDate]
      ,[FK_SensorType]
      ,Original_ID
)

SELECT DISTINCT CASE 
		WHEN v4.value IS NOT NULL 
		THEN v1.value+'_'+v4.value 
		ELSE v1.value+'_NULL' 
		END as UnicIdentifier,
		NULL,
		NULL,
		v4.value,
		GETDATE(),
		4,
		'VHF_'+CONVERT(VARCHAR,r.Trx_Radio_Obj_PK)

  FROM [ECWP-eReleveData].[dbo].[TObj_Carac_value] v1 
  LEFT JOIN [ECWP-eReleveData].[dbo].[TObj_Carac_value] v2 on v1.fk_object = v2.fk_object
		 and v2.Fk_carac = 3 and CONVERT(DATE,v1.begin_date) = CONVERT(DATE,v2.begin_date)
  
  LEFT JOIN [ECWP-eReleveData].[dbo].[TObj_Carac_value] v3 on v1.fk_object = v3.fk_object 
		and v3.Fk_carac = 4 and CONVERT(DATE,v1.begin_date) = CONVERT(DATE,v3.begin_date)
  
  LEFT JOIN [ECWP-eReleveData].[dbo].[TObj_Carac_value] v4 on v1.fk_object = v4.fk_object 
		and v4.Fk_carac = 6 and CONVERT(DATE,v1.begin_date) = CONVERT(DATE,v4.begin_date)
	
  LEFT JOIN [ECWP-eReleveData].[dbo].TViewTrx_Radio r on v4.value = r.id6@TCarac_Transmitter_Serial_Number
  where v1.Fk_carac = 5 
  --order by v4.value
 
 INSERT INTO SensorDynPropValue (
		StartDate,
		ValueInt,
		ValueString,
		ValueDate,
		ValueFloat,
		FK_SensorDynProp,
		FK_Sensor
		)
SELECT v.begin_date,
	v.value,
	NULL,
	NULL,
	NULL,
	p.ID,
	s.ID
FROM [ECWP-eReleveData].[dbo].[TObj_Carac_value] v JOIN SensorDynProp P on p.Name = 'Frequency'
JOIN Sensor s ON s.Original_ID = 'VHF_'+CONVERT(VARCHAR,v.fk_object)
where v.Fk_carac = 5 


 INSERT INTO SensorDynPropValue (
		StartDate,
		ValueInt,
		ValueString,
		ValueDate,
		ValueFloat,
		FK_SensorDynProp,
		FK_Sensor
		)
SELECT v.begin_date,
	NULL,
	v.value_precision,
	NULL,
	NULL,
	p.ID,
	s.ID
FROM [ECWP-eReleveData].[dbo].[TObj_Carac_value] v JOIN SensorDynProp P on p.Name = 'Status'
JOIN Sensor s ON s.Original_ID = 'VHF_'+CONVERT(VARCHAR,v.fk_object)
where v.Fk_carac = 1
