CREATE PROCEDURE [dbo].[pr_ExportFormBuilder]
AS
BEGIN


DELETE FormBuilderFormsInfos WHERE exists(select * from formbuilder.dbo.Form fo where FormBuilderFormsInfos.FBID = fo.pk_Form)

DELETE FormBuilderInputInfos WHERE exists(select * from formbuilder.dbo.Input fi where FormBuilderInputInfos.FBID = fi.pk_Input)

DELETE FormBuilderInputProperty WHERE exists(select * from formbuilder.dbo.[InputProperty] IP where FormBuilderInputProperty.FBID = IP.pk_InputProperty)    

      
 INSERT INTO [NewModelERD].[dbo].[FormBuilderFormsInfos]
           ([FBID]
           ,[name]
           ,[labelFr]
           ,[labelEn]
           ,[creationDate]
           ,[modificationDate]
           ,[curStatus]
           ,[descriptionFr]
           ,[descriptionEn])
 
 SELECT   pk_form
           ,[name]
           ,[labelFr]
           ,[labelEn]
           ,[creationDate]
           ,[modificationDate]
           ,[curStatus]
           ,[descriptionFr]
           ,[descriptionEn]
 FROM formbuilder.dbo.Form fo where not exists(select * from [FormBuilderFormsInfos] fbf where fbf.FBID = fo.pk_Form)
 



INSERT INTO [NewModelERD].[dbo].[FormBuilderInputInfos]
           ([FBID]
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
           ,[fieldClass]) 
SELECT pk_Input
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
           FROM formbuilder.dbo.Input I where not exists(select * from [FormBuilderInputInfos] fbi where fbi.FBID = I.pk_Input)

INSERT INTO [NewModelERD].[dbo].FormBuilderInputProperty
( 
FBID ,
fk_input,
name,
value ,
creationDate,
valueType
 )
 SELECT [pk_InputProperty]
      ,[fk_Input]
      ,[name]
      ,[value]
      ,[creationDate]
      ,[valueType]
  FROM [formbuilder].[dbo].[InputProperty] IP where not exists(select * from FormBuilderInputProperty fbip where fbip.FBID = IP.pk_InputProperty)
 

END