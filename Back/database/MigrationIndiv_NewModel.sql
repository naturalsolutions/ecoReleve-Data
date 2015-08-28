INSERT INTO [NewModelERD].[dbo].Individual (
[creationDate],
Age,
Sex,
Species,
Birth_date,
Death_date,
Old_ID
)
/****** Script de la commande SelectTopNRows à partir de SSMS  ******/
SELECT GETDATE()
      ,[id2@Thes_Age_Precision]
      ,[id30@TCaracThes_Sex_Precision]
	  ,[id34@TCaracThes_Species_Precision]
      ,[id35@Birth_date]
      ,[id36@Death_date]
	  ,Individual_Obj_PK
FROM [ECWP-eReleveData].[dbo].[TViewIndividual] I



INSERT INTO [NewModelERD].[dbo].IndividualDynPropValue(
		[StartDate]
      ,[ValueInt]
      ,[ValueString]
      ,[ValueDate]
      ,[ValueFloat]
      ,[FK_IndividualDynProp]
      ,[FK_Individual]
)

SELECT
val.begin_date,
Case 
	WHEN dp.TypeProp = 'Integer' AND val.value_precision is NULL THEN val.value
	WHEN dp.TypeProp = 'Integer' AND val.value_precision is NOT NULL THEN val.value_precision
	ELSE NULL
	END as ValueInt,
Case 
	WHEN dp.TypeProp = 'String' AND val.value_precision is NULL THEN val.value
	WHEN dp.TypeProp = 'String' AND val.value_precision is NOT NULL THEN val.value_precision
	ELSE NULL
	END as ValueString,
Case 
	WHEN dp.TypeProp = 'Date' AND val.value_precision is NULL THEN val.value
	WHEN dp.TypeProp = 'Date' AND val.value_precision is NOT NULL THEN val.value_precision
	ELSE NULL
	END as ValueDate,
Case 
	WHEN dp.TypeProp = 'Float' AND val.value_precision is NULL THEN val.value
	WHEN dp.TypeProp = 'Float' AND val.value_precision is NOT NULL THEN val.value_precision
	ELSE NULL
	END as ValueFloat,
dp.ID,
I_I.ID
FROM [ECWP-eReleveData].[dbo].[TObj_Carac_value] val 
JOIN [ECWP-eReleveData].[dbo].[TObj_Carac_type] typ on typ.Carac_type_Pk = val.Fk_carac
JOIN [NewModelERD].[dbo].IndividualDynProp dp ON 'TCaracThes_'+dp.Name = typ.name or 'TCarac_'+dp.Name = typ.name or  'Thes_'+dp.Name = typ.name
JOIN [NewModelERD].[dbo].Individual I_I ON  val.fk_object = I_I.Old_ID
