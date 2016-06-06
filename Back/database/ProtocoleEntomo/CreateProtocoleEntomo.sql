

--INSERT INTO [dbo].[ObservationDynProp]
--           ([Name]
--           ,[TypeProp])
--     VALUES
--           ('ID_ECollection'
--           ,'Integer')

INSERT INTO [dbo].[ProtocoleType]
           ([Name]
           ,[Status]
           ,[OriginalId])
     VALUES
           ('Entomo_Pop_Census'
           ,6
           ,null)
GO
INSERT INTO [dbo].[ProtocoleType_ObservationDynProp]
           ([Required]
           ,[FK_ProtocoleType]
           ,[FK_ObservationDynProp]
           ,[Locked]
           ,[LinkedTable]
           ,[LinkedField]
           ,[LinkedID]
           ,[LinkSourceID])
     select 1,PT.ID,P.ID,1,NULL,NULL,NULL,NULL
	  from protocoletype PT JOIN [dbo].[ObservationDynProp] P ON p.name in ('Taxon','Age','sex','number','sampled','identity_sure','validator','behaviour')
	  where pt.name ='Entomo_Pop_Census'
GO


--delete 
----select * 
--from ModuleForms
--where typeobj=231

INSERT INTO [dbo].[ModuleForms]
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
           ,[Locked]
           ,[DefaultValue])
select f.id,PTP.ID,  'Entomo_Pop_Census','Entomo_Pop_Census',0,MF.FieldSizeEdit,MF.FieldSizeDisplay,'GridFormEditor',MF.editorClass,MF.FormRender,MF.FormOrder,'',PTF.ID,MF.Validators,MF.displayClass,MF.EditClass,MF.Status,MF.Locked,MF.DefaultValue
from FrontModules F JOIN ProtocoleType PTP  ON PTP.name='Entomo population' JOIN Protocoletype PTF ON PTF.name='Entomo_Pop_Census'
JOIN ModuleForms MF ON MF.module_id = f.id and MF.Name ='Release Individual'
where f.Name='ObservationForm'


INSERT INTO [dbo].[ModuleForms]
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
           ,[Locked]
           ,[DefaultValue])
select F.id,PT.ID,MF.Name, CASE WHEN MF.Name ='Sampled' THEN 'Collected' ELSE MF.Label END,0,CASE WHEN MF.Name ='Taxon' THEN 12 WHEN MF.Name in ('Sampled','identity_sure') THEN 2 ELSE 6 END,6,MF.InputType,editorClass,2
,CASE MF.Name WHEN  'Taxon' THEN -10 WHEN 'sampled' THEN 4 WHEN 'identity_sure' THEN 7 WHEN 'validator' THEN 9 ELSE 11 END
,NULL,CASE WHEN MF.NAME='Taxon' THEN '226197' ELSE Options END,NULL,NULL,NULL,MF.[Status],1,NULL
from FrontModules F JOIN protocoletype PT ON PT.name ='Entomo_Pop_Census' 
JOIN protocoletype PTB ON PTB.Name ='Phytosociology releve' JOIN ModuleForms MF ON MF.module_id =F.ID AND MF.TypeObj = PTB.ID and MF.name in ('Taxon','sampled','identity_sure','validator','Comments')
where f.Name='ObservationForm'

INSERT INTO [dbo].[ModuleForms]
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
           ,[Locked]
           ,[DefaultValue])
select F.id,PT.ID,'Age', 'Age',0,6,6,'AutocompTreeEditor','form-control',2,-3,NULL,'222957',NULL,NULL,NULL,1,1,NULL
from FrontModules F JOIN protocoletype PT ON PT.name ='Entomo_Pop_Census' 
where f.Name='ObservationForm'


INSERT INTO [dbo].[ModuleForms]
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
           ,[Locked]
           ,[DefaultValue])
select F.id,PT.ID,'Sex', 'Sex',0,6,6,'AutocompTreeEditor','form-control',2,-1,NULL,'222953',NULL,NULL,NULL,1,1,NULL
from FrontModules F JOIN protocoletype PT ON PT.name ='Entomo_Pop_Census' 
where f.Name='ObservationForm'

INSERT INTO [dbo].[ModuleForms]
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
           ,[Locked]
           ,[DefaultValue])
select F.id,PT.ID,'number', 'number',0,4,4,'Number','form-control',2,1,NULL,NULL,NULL,NULL,NULL,1,1,NULL
from FrontModules F JOIN protocoletype PT ON PT.name ='Entomo_Pop_Census' 
where f.Name='ObservationForm'



INSERT INTO [dbo].[ModuleForms]
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
           ,[Locked]
           ,[DefaultValue])
select F.id,PT.ID,'behaviour', 'behaviour',0,6,6,'AutocompTreeEditor','form-control',2,5,NULL,'222975',NULL,NULL,NULL,1,1,NULL
from FrontModules F JOIN protocoletype PT ON PT.name ='Entomo_Pop_Census' 
where f.Name='ObservationForm'




      

