ALTER PROCEDURE [dbo].[pr_ImportFormBuilder]
AS
BEGIN
 print 'OK'
 
 /*
 DECLARE  @NewProtocole TABLE
 (
	[ID] [int]  NOT NULL,
	[Name] [nvarchar](250) NULL,
	[OriginalId] [nvarchar](250) NULL
 )*/
 -- INSERTION DES NOUVEAU PROTOCOLETYPE
 INSERT INTO dbo.ProtocoleType  (Name,OriginalId,Status)
 --OUTPUT INSERTED.ID,INSERTED.NAME,INSERTED.[OriginalId] INTO @NewProtocole 
 SELECT FI.Name,'FormBuilder-' + convert(varchar,FI.ID),4 FROM FormBuilderFormsInfos FI
 WHERE NOT EXISTS (SELECT * FROM ProtocoleType PT WHERE REPLACE(PT.OriginalId,'FormBuilder-','') = FI.ID)
 
-- Gestion de mise à jour des Noms des protocoles existants
UPDATE PT  SET Name= FI.Name
FROM ProtocoleType PT JOIN FormBuilderFormsInfos FI ON REPLACE(PT.OriginalId,'FormBuilder-','') = FI.ID


--select * from @NewProtocole

-- TODO Gestion de la même propriétés dynamqiue avec plusieurs types. ==> POURQUOI ? 
-- TODO gestion de la compatibilité des type FB-ERD. (voir plus bas) 
-- TODO definir le type de la propriétés dynamique en fonction du type FB et attributs  FAITS ! 

 --DECLARE  @NewDynProp TABLE
 --(
	--[ID] [int]  NOT NULL,
	--[Name] [nvarchar](250) NOT NULL,
	--[TypeProp] [nvarchar](250) NOT NULL
 --)
 DELETE [ProtocoleType_ObservationDynProp]
 DBCC CHECKIDENT ([ProtocoleType_ObservationDynProp], RESEED, 0)
-- DELETE [ObservationDynProp]
 -- INSERTION DES NOUVELLES DYN PROP
 INSERT INTO dbo.ObservationDynProp  (Name,TypeProp)
 --OUTPUT INSERTED.ID,INSERTED.NAME,INSERTED.TypeProp INTO @NewDynProp 
 SELECT DISTINCT FI.Name, CASE WHEN FBD.[DynPropType] IS NULL THEN 'String' ELSE FBD.[DynPropType] END
 FROM FormBuilderInputInfos FI 
 LEFT JOIN [FormBuilderType_DynPropType] FBD ON FBD.[FBType] = FI.type 
			AND (
				[FBInputPropertyName] IS NULL 
				OR (FBD.IsEXISTS =1 AND EXISTS (	SELECT * FROM FormBuilderInputProperty FIP
						Where FIP.fk_input = Fi.ID 
						AND FIP.value = FBD.[FBInputPropertyValue] 
						AND FIP.name = FBD.[FBInputPropertyName]  
						)
					)
				OR (FBD.IsEXISTS =0 AND NOT EXISTS (	SELECT * FROM FormBuilderInputProperty FIP
						Where FIP.fk_input = Fi.ID 
						AND FIP.value = FBD.[FBInputPropertyValue] 
						AND FIP.name = FBD.[FBInputPropertyName]  
						)
					)
				)
 WHERE EXISTS (SELECT * FROM ProtocoleType PT WHERE REPLACE(PT.OriginalId,'FormBuilder-','') = FI.fk_form)  
 AND NOT EXISTS (SELECT * FROM ObservationDynProp ODP WHERE ODP.Name = FI.name)


--Suppression des liens ProtocoleType_ObservationDynProp

-- INSERTION DES NOUVELLES DYNPROP/TYPE
INSERT INTO [ProtocoleType_ObservationDynProp]
           ([Required]
           ,[FK_ProtocoleType]
           ,[FK_ObservationDynProp])         
SELECT FI.required, PT.ID,OD.ID
FROM FormBuilderInputInfos FI JOIN FormBuilderFormsInfos FF ON FI.fk_form = FF.ID JOIN ObservationDynProp OD ON OD.Name = FI.Name
JOIN ProtocoleType PT on REPLACE(PT.OriginalId,'FormBuilder-','') = FF.ID 
where not exists (select * from [ProtocoleType_ObservationDynProp] ODN where ODN.FK_ProtocoleType = PT.ID AND ODN.FK_ObservationDynProp = OD.ID)


UPDATE FF
SET internalID = PT.ID
FROM FormBuilderFormsInfos FF JOIN ProtocoleType PT on  REPLACE(PT.OriginalId,'FormBuilder-','') = FF.ID 

EXEC [Pr_FormBuilderUpdateConf] @ObjectType = 'Protocole',@id_frontmodule=1
 
END