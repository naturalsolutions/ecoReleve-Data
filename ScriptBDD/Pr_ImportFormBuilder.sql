ALTER PROCEDURE [dbo].[pr_ImportFormBuilder]
AS
BEGIN
 print 'OK'
 
 
 DECLARE  @NewProtocole TABLE
 (
	[ID] [int]  NOT NULL,
	[Name] [nvarchar](250) NULL,
	[OriginalId] [nvarchar](250) NULL
 )
 -- INSERTION DES NOUVEAU PROTOCOLETYPE
 INSERT INTO dbo.ProtocoleType  (Name,OriginalId,Status)
 OUTPUT INSERTED.ID,INSERTED.NAME,INSERTED.[OriginalId] INTO @NewProtocole 
 SELECT FI.Name,'FormBuilder-' + convert(varchar,FI.FBID),4 FROM FormBuilderFormsInfos FI
 WHERE NOT EXISTS (SELECT * FROM ProtocoleType PT WHERE REPLACE(PT.OriginalId,'FormBuilder-','') = FI.FBID)
 
-- Gestion de mise à jour des Noms des protocoles existants
UPDATE dbo.ProtocoleType  SET Name= FI.Name
FROM
FormBuilderFormsInfos FI
WHERE NOT EXISTS (SELECT * FROM ProtocoleType PT WHERE REPLACE(PT.OriginalId,'FormBuilder-','') = FI.FBID and PT.Name = FI.name)
and REPLACE(ProtocoleType.OriginalId,'FormBuilder-','') = FI.FBID

select * from @NewProtocole

-- TODO Gestion de la même propriétés dynamqiue avec plusieurs types. ==> POURQUOI ? 
-- TODO gestion de la compatibilité des type FB-ERD. (voir plus bas) 
-- TODO definir le type de la propriétés dynamique en fonction du type FB et attributs  FAITS ! 

 DECLARE  @NewDynProp TABLE
 (
	[ID] [int]  NOT NULL,
	[Name] [nvarchar](250) NOT NULL,
	[TypeProp] [nvarchar](250) NOT NULL
 )
 -- INSERTION DES NOUVELLES DYN PROP
 INSERT INTO dbo.ObservationDynProp  (Name,TypeProp)
 OUTPUT INSERTED.ID,INSERTED.NAME,INSERTED.TypeProp INTO @NewDynProp 
 SELECT DISTINCT FI.Name,
 CASE  
  
	WHEN FI.type IN('Number','NumberPicker')
	AND EXISTS (SELECT * FROM FormBuilderInputProperty FIP2 Where FIP2.value = '1' AND FIP2.name = 'decimal' AND FIP2.fk_input = FIP.fk_input)
	THEN 'Float'
	
	WHEN FI.type IN('Number','NumberPicker')
	THEN 'Integer'

	WHEN FI.type IN ('Date','DatePicker') 
	THEN 'Date' 

	ELSE 'String'
	END
 FROM FormBuilderInputInfos FI JOIN FormBuilderInputProperty FIP ON FI.FBID = FIP.fk_input 
 WHERE EXISTS (SELECT * FROM ProtocoleType PT WHERE REPLACE(PT.OriginalId,'FormBuilder-','') = FI.fk_form) and 
 NOT EXISTS (SELECT * FROM ObservationDynProp OD2 WHERE OD2.Name = FI.name)


--Suppression des liens ProtocoleType_ObservationDynProp
DELETE [ProtocoleType_ObservationDynProp]
DBCC CHECKIDENT ([ProtocoleType_ObservationDynProp], RESEED, 0)
-- INSERTION DES NOUVELLES DYNPROP/TYPE
INSERT INTO [NewModelERD].[dbo].[ProtocoleType_ObservationDynProp]
           ([Required]
           ,[FK_ProtocoleType]
           ,[FK_ObservationDynProp])
           
SELECT FI.required, PT.ID,OD.ID
FROM FormBuilderInputInfos FI JOIN FormBuilderFormsInfos FF ON FI.fk_form = FF.FBID JOIN ObservationDynProp OD ON OD.Name = FI.Name
JOIN ProtocoleType PT on REPLACE(PT.OriginalId,'FormBuilder-','') = FF.FBID 
where not exists (select * from [ProtocoleType_ObservationDynProp] ODN where ODN.FK_ProtocoleType = PT.ID AND ODN.FK_ObservationDynProp = OD.ID)

-- SUPPRESSION de la configuration
DELETE [NewModelERD].[dbo].[ModuleField]
DBCC CHECKIDENT ([ModuleField], RESEED, 0)
-- INSERTION DE LA CONFIGURATION
-- TODO: s'appuyer sur syscolumns à patir de la table Observation pour enelver les propriétés statiques. FAIT !
-- Faire un not exists
INSERT INTO [NewModelERD].[dbo].[ModuleField]
           ([FK_FrontModule]
           ,[Name]
           ,[LabelFr]
           ,[Required]
           ,[FieldSize]
           ,[InputType]
           ,[editorClass]
           ,[fieldClass]
           ,[FormRender]
           ,[FormOrder]
           ,[QueryName]
           ,[IsSearchable]
           ,[Legend]
           ,TypeObj)
SELECT 1,OD.Name,FI.[LabelFr],FI.[Required],FI.[FieldSize],
CASE 
	WHEN FI.Name in (select col.name from sys.tables t join syscolumns col on t.object_id = col.id
		where  t.name = 'Observation')
	THEN 'Hidden'
	ELSE FI.type
	END
,FI.[editorClass],FI.[fieldClass],2,0,'',1,'Detailled Infos',PT.ID
FROM FormBuilderInputInfos FI JOIN FormBuilderFormsInfos FF ON FI.fk_form = FF.FBID JOIN ObservationDynProp OD ON OD.Name = FI.Name
JOIN ProtocoleType PT ON REPLACE(PT.OriginalId,'FormBuilder-','') = FF.FBID
--- TODO : Table de correspondance entre type d'input Track/FB et ecoReleve/FB ==> LEFT JOIN correpondance C (HERE)
where NOT EXISTS (select * from [ModuleField] MF where MF.FK_FrontModule = 1   AND MF.Name = OD.Name AND MF.TypeObj = PT.ID)
 
END