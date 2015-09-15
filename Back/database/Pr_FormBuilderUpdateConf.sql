CREATE PROCEDURE [dbo].[Pr_FormBuilderUpdateConf]
(
@ObjectType varchar(255),
@id_frontmodule BIGINT
)
AS
BEGIN
 print 'OK'
 
 
-- SUPPRESSION de la configuration
DELETE [ModuleForms]
where module_id= @id_frontmodule
and TypeObj IS NOT NULL

--DBCC CHECKIDENT ([ModuleForms], RESEED, 0)
-- INSERTION DE LA CONFIGURATION
-- TODO: s'appuyer sur syscolumns à patir de la table Observation pour enelver les propriétés statiques. FAIT !
-- Faire un not exists

INSERT INTO [ModuleForms]
           ([module_id]
           ,[TypeObj]
           ,[Name]
           ,[Label]
           ,[Required]
           ,[FieldSizeEdit]
           ,[FieldSizeDisplay]
           ,[InputType]
           ,[editorClass]
           ,[FormRender]
           ,[FormOrder]
           ,[Legend]
           ,[Options]
           ,[Validators]
           ,[displayClass]
           ,[EditClass]
           ,[Status]
		   )

SELECT  @id_frontmodule,
FF.internalID,
FI.name,
FI.labelFr,
FI.required,
FI.fieldSizeEdit,
FI.fieldSizeDisplay
,CASE WHEN FBD.BBEditor IS NOT NULL THEN FBD.BBEditor ELSE FI.type END
,'form-control'
,2
,FI.[order],
FI.linkedFieldset,
IP.value,
NULL,
Fi.fieldClassDisplay,
FI.fieldClassEdit,
FI.curStatus

FROM FormBuilderInputInfos FI JOIN FormBuilderFormsInfos FF ON FI.fk_form = FF.ID
LEFT JOIN FormBuilderType_DynPropType FBD ON FBD.[FBType] = FI.type 
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
LEFT JOIN FormBuilderInputProperty IP ON FI.ID =IP.fk_input AND IP.name = 'webServiceURL'
WHERE FF.ObjectType = @ObjectType
--@id_frontmodule,OD.Name,FI.[LabelFr],FI.[Required],FI.[FieldSize],
--CASE 
--	WHEN FI.Name in (select col.name from sys.tables t join syscolumns col on t.object_id = col.id
--		where  t.name = 'Observation')
--	THEN 'Hidden'
--	ELSE FI.type
--	END
--,FI.[editorClass],FI.[fieldClass],2,0,'',1,'Detailled Infos',PT.ID
--FROM FormBuilderInputInfos FI JOIN FormBuilderFormsInfos FF ON FI.fk_form = FF.FBID
--LEFT JOIN 
----JOIN ObservationDynProp OD ON OD.Name = FI.Name
----JOIN ProtocoleType PT ON REPLACE(PT.OriginalId,'FormBuilder-','') = FF.FBID
----- TODO : Table de correspondance entre type d'input Track/FB et ecoReleve/FB ==> LEFT JOIN correpondance C (HERE)
--where NOT EXISTS (select * from [ModuleField] MF where MF.FK_FrontModule = 1   AND MF.Name = OD.Name AND MF.TypeObj = PT.ID)
 
 
 
END