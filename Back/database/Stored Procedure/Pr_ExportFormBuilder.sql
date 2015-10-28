USE [NewModelERD]
GO

/****** Object:  StoredProcedure [dbo].[pr_ExportFormBuilder]    Script Date: 09/10/2015 12:06:42 ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO




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
 ;
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
      /*,linkedFieldset*/
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
           ,CASE WHEN ip.value IS NOT NULL AND ip.value LIKE 'hh:mm' THEN 'TimePicker' ELSE I.[type] END
           ,I.[editorClass]
           ,I.[fieldClassEdit]
           ,I.[fieldClassDisplay]
           ,I.[linkedFieldTable]
           ,I.[linkedFieldIdentifyingColumn]
           ,I.[linkedField]
           ,I.[formIdentifyingColumn]
           ,I.[order]
       /*,F.legend*/
           FROM FormBuilder.dbo.Input I
       LEFT JOIN FormBuilder.dbo.InputProperty ip ON I.pk_Input = ip.fk_Input AND I.type = 'Date' AND ip.name = 'format'
       /*LEFT JOIN FormBuilder.dbo.Fieldset F ON I.linkedFieldset = F.refid and F.pk_Fieldset in (select * from toto)*/
       WHERE i.fk_form in (select ID from [FormBuilderFormsInfos]) AND I.[curStatus] = 1 

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
 
 EXEC dbo.[pr_ImportFormBuilder] 
END

GO


