CREATE PROCEDURE [dbo].[pr_ExportFormBuilder]
AS
BEGIN


DELETe FROM FormBuilderFormsInfos

DELETe FROM FormBuilderInputInfos 
           
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
 
 SELECT		pk_form
           ,[name]
           ,[labelFr]
           ,[labelEn]
           ,[creationDate]
           ,[modificationDate]
           ,[curStatus]
           ,[descriptionFr]
           ,[descriptionEn]
 FROM formbuilder.dbo.Form
 
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
           FROM formbuilder.dbo.Input

 -- TODO Import Table pour les propriétés des input: InputProperty
 
END