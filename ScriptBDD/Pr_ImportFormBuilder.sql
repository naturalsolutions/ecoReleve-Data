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
 
-- TODO : Gestion de mise à jour des protocole existant, s'appuyer sur Original_ID

 
select * from @NewProtocole

-- TODO Gestion de la même propriétés dynamqiue avec plusieurs types.
-- TODO gestion de la compatibilité des type FB-ERD.
-- TODO definir le type de la propriétés dynamique en fonction du type FB et attributs


 DECLARE  @NewDynProp TABLE
 (
	[ID] [int]  NOT NULL,
	[Name] [nvarchar](250) NOT NULL,
	[TypeProp] [nvarchar](250) NOT NULL
 )
 -- INSERTION DES NOUVELLES DYN PROP
 INSERT INTO dbo.ObservationDynProp  (Name,TypeProp)
 OUTPUT INSERTED.ID,INSERTED.NAME,INSERTED.TypeProp INTO @NewDynProp 
 SELECT DISTINCT FI.Name,CASE   WHEN FI.type IN('Number','NumberPicker') THEN 'Integer' WHEN FI.type IN ('DatePicker') THEN 'Date' ELSE 'String' END  FROM FormBuilderInputInfos FI
 WHERE NOT EXISTS (SELECT * FROM ProtocoleType PT WHERE REPLACE(PT.OriginalId,'FormBuilder-','') = FI.FBID)
-- TO s'appuyer sur syscolumns à patir de la table Observation pour enelver les propriétés statiques.
-- Faire un not exists
select o.name from sysobjects o JOIN  syscolumns s on s.id=o.id
where o.type='U' and o.name ='Observation'

-- TODO : Suppression des liens ProtocoleType_ObservationDynProp

-- INSERTION DES NOUVELLES DYNPROP/TYPE
INSERT INTO [NewModelERD].[dbo].[ProtocoleType_ObservationDynProp]
           ([Required]
           ,[FK_ProtocoleType]
           ,[FK_ObservationDynProp])
           
SELECT FI.required, PT.ID,OD.ID
FROM FormBuilderInputInfos FI JOIN FormBuilderFormsInfos FF ON FI.fk_form = FF.FBID JOIN ObservationDynProp OD ON OD.Name = FI.Name
JOIN ProtocoleType PT on REPLACE(PT.OriginalId,'FormBuilder-','') = FF.FBID 
where not exists (select * from [ProtocoleType_ObservationDynProp] ODN where ODN.FK_ProtocoleType = PT.ID AND ODN.FK_ObservationDynProp = OD.ID)

-- TODO SUPPRESSION de la configuration

 -- INSERTION DE LA CONFIGURATION
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
SELECT 1,OD.Name,FI.[LabelFr],FI.[Required],FI.[FieldSize],FI.Type,FI.[editorClass],FI.[fieldClass],2,0,'',1,'Detailled Infos',PT.ID
FROM FormBuilderInputInfos FI JOIN FormBuilderFormsInfos FF ON FI.fk_form = FF.FBID JOIN ObservationDynProp OD ON OD.Name = FI.Name
JOIN ProtocoleType PT on REPLACE(PT.OriginalId,'FormBuilder-','') = FF.FBID
where not exists (select * from [ModuleField] MF where MF.FK_FrontModule = 1   AND MF.Name = OD.Name AND MF.TypeObj = PT.ID)
 
END