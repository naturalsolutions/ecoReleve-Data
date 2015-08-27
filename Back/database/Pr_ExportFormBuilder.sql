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
           ,'Procotole'
 FROM formbuilder.dbo.Form fo WHERE (fo.modificationDate IS NULL and fo.creationDate > @LastExport) OR (fo.modificationDate IS NOT NULL and fo.modificationDate > @LastExport)
 -- TODO ajouter le nom de l'application



INSERT INTO [FormBuilderInputInfos]
           (ID
           ,[fk_form]
           ,[name]
           ,[labelFr]
           ,[labelEn]
           ,[required]
           ,[readonly]
           ,[fieldSize]
           ,[endOfLine]
           ,[startDate]
           ,[curStatus]
           ,[type]
           ,[editorClass]
           ,[fieldClass]
           ,[linkedFieldTable]
           ,[linkedFieldIdentifyingColumn]
           ,[linkedField]
           ,[formIdentifyingColumn]
           ,[order])
SELECT pk_Input
           ,I.[fk_form]
           ,I.[name]
           ,I.[labelFr]
           ,I.[labelEn]
           ,I.[required]
           ,I.[readonly]
           ,I.[fieldSize]
           ,I.[endOfLine]
           ,I.[startDate]
           ,I.[curStatus]
           ,I.[type]
           ,I.[editorClass]
           ,I.[fieldClass]
           ,I.[linkedFieldTable]
           ,I.[linkedFieldIdentifyingColumn]
           ,I.[linkedField]
           ,I.[formIdentifyingColumn]
           ,I.[order]
           FROM formbuilder.dbo.Input I WHERE i.fk_form in (select ID from [FormBuilderFormsInfos])

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
  FROM [formbuilder].[dbo].[InputProperty] IP WHERE fk_Input in (select ID FROM [FormBuilderInputInfos])
 

END