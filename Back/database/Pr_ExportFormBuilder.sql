ALTER PROCEDURE [dbo].[pr_ExportFormBuilder](
@LastExport DATETIME
)
AS
BEGIN


DELETE FormBuilderInputProperty 
DELETE FormBuilderInputInfos 
DELETE FormBuilderFormsInfos 

      
 INSERT INTO [FormBuilderFormsInfos]
           (ID
           ,[name]
           ,[labelFr]
           ,[labelEn]
           ,[creationDate]
           ,[modificationDate]
           ,[curStatus]
           ,[descriptionFr]
           ,[descriptionEn]
           ,ObjectType)
 
 SELECT   pk_form
           ,[name]
           ,[labelFr]
           ,[labelEn]
           ,[creationDate]
           ,[modificationDate]
           ,[curStatus]
           ,[descriptionFr]
           ,[descriptionEn]
           ,'Protocole'
 FROM FormBuilder.dbo.Form fo 
 WHERE (fo.modificationDate IS NULL and fo.creationDate > @LastExport) OR (fo.modificationDate IS NOT NULL and fo.modificationDate > @LastExport);
 -- TODO ajouter le nom de l'application

with toto (ID) as (
SELECT Max(pk_Fieldset)
  FROM FormBuilder.[dbo].[Fieldset]
  group by [refid])

INSERT INTO [FormBuilderInputInfos]
      (ID
      ,[fk_form]
      ,[name]
      ,[labelFr]
      ,[labelEn]
      ,[required]
      ,[readonly]
      ,[fieldSizeEdit]
      ,[fieldSizeDisplay]
      ,[endOfLine]
      ,[startDate]
      ,[curStatus]
      ,[type]
      ,[editorClass]
      ,[fieldClassEdit]
      ,[fieldClassDisplay]
	  ,[linkedFieldTable]
      ,[linkedFieldIdentifyingColumn]
      ,[linkedField]
      ,[formIdentifyingColumn]
	  ,[order]
      ,linkedFieldset
	  )
SELECT pk_Input
           ,I.[fk_form]
           ,I.[name]
           ,I.[labelFr]
           ,I.[labelEn]
           ,CASE WHEN I.editMode < 7 THEN 1 ELSE 0 END as required_
           ,0
           ,I.[fieldSizeEdit]
           ,I.[fieldSizeDisplay]
           ,I.[endOfLine]
           ,I.[startDate]
           ,I.[curStatus]
           ,I.[type]
           ,I.[editorClass]
           ,I.[fieldClassEdit]
           ,I.[fieldClassDisplay]
           ,I.[linkedFieldTable]
           ,I.[linkedFieldIdentifyingColumn]
           ,I.[linkedField]
           ,I.[formIdentifyingColumn]
           ,I.[order]
		   ,F.legend
           FROM FormBuilder.dbo.Input I
		   LEFT JOIN FormBuilder.dbo.Fieldset F ON I.linkedFieldset = F.refid and F.pk_Fieldset in (select * from toto)
		   WHERE i.fk_form in (select ID from [FormBuilderFormsInfos]) 

INSERT INTO [FormBuilderInputProperty]
           ([ID]
           ,[fk_Input]
           ,[name]
           ,[value]
           ,[creationDate]
           ,[valueType])
 SELECT [pk_InputProperty]
      ,[fk_Input]
      ,IP.[name]
      ,IP.[value]
      ,IP.[creationDate]
      ,IP.[valueType]
  FROM FormBuilder.[dbo].[InputProperty] IP WHERE fk_Input in (select ID FROM [FormBuilderInputInfos])
 

END