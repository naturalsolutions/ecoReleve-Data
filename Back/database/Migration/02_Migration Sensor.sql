<<<<<<< HEAD
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
	9,
	s.ID
FROM [ECWP-eReleveData].[dbo].[TObj_Carac_value] v
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
	3,
	s.ID
FROM [ECWP-eReleveData].[dbo].[TObj_Carac_value] v
JOIN Sensor s ON s.Original_ID = 'VHF_'+CONVERT(VARCHAR,v.fk_object)
where v.Fk_carac = 1
=======



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
 

WITH toto as (
SELECT 
	cv.begin_date as StartDate,
	dp.TypeProp,
	s.ID as SensorID,
	dp.Name as dynPropName,
	dp.ID as dynPopID,
	typ.name, 
	CASE 
	WHEN th.TTop_FullPath is NOT NULL THEN th.TTop_FullPath
	WHEN cv.value_precision is not null then  cv.value_precision 
	ELSe cv.value
	END as Value,
	th.TTop_FullPath as fullPath,
	s.Original_ID 

  FROM [ECWP-eReleveData_old].[dbo].[TObj_Carac_value] cv
  JOIN [ECWP-eReleveData_old].[dbo].[TObj_Carac_type] typ 
		ON cv.Fk_carac = typ.Carac_type_Pk 
  JOIN dbo.SensorDynProp dp 
		ON 'TCaracThes_'+dp.Name = typ.name 
		or 'TCarac_'+dp.Name = typ.name 
		or dp.Name = typ.name 
		or 'Thes_'+dp.Name = typ.name 
		or 'Thes_txt_'+dp.Name = typ.name
		or 'TCaracThes_txt_'+dp.Name = typ.name
  JOIN dbo.Sensor s on cv.fk_object = s.Original_ID
  LEFT join THESAURUS.dbo.TTopic th 
		ON th.TTop_PK_ID> 204082 
		and typ.name != 'Comments' 
		and (typ.name like '%Thes_%' or typ.name like '%TCaracThes_Txt%') 
		and th.TTop_NameEn = cv.value_precision
  where [object_type] in ('Trx_Radio','Trx_Sat' ) )


INSERT INTO [dbo].[SensorDynPropValue]
	([StartDate]
      ,[ValueInt]
      ,[ValueString]
      ,[ValueDate]
      ,[ValueFloat]
      ,[FK_SensorDynProp]
      ,[FK_Sensor]
)
SELECT 
	toto.StartDate,
	CASE WHEN toto.TypeProp = 'Integer' THEN toto.value else NULL end as ValueInt,
	CASE WHEN toto.TypeProp = 'String' THEN toto.value else NULL end as ValueString,
	CASE WHEN toto.TypeProp = 'Date' THEN toto.value else NULL end as ValueDate,
	CASE WHEN toto.TypeProp = 'Float' THEN toto.value else NULL end as ValueFloat,
	toto.dynPopID,
	toto.SensorID
FROM toto
>>>>>>> c736a1259dfed9e43e5cf39f2f5799e74964caca
