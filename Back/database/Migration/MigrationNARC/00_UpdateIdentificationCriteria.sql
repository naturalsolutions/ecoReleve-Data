--select len(replace(replace(replace([Identification_criteria],'TCaracThes_',''),'[id',''),']','')),replace(replace(replace([Identification_criteria],'TCaracThes_',''),'[id',''),']',''),D.* 
--from [dbo].[TProtocol_Vertebrate_Individual_Death] D
BEGIN TRAN

UPDATE TProtocol_Vertebrate_Individual_Death
SET [Identification_criteria] = replace(replace(replace([Identification_criteria],'TCaracThes_',''),'[id',''),']','')
where len([Identification_criteria]) > 255 or len(Comments) > 255

COMMIT TRAN



UPDATE [TProtocol_Capture_Individual]
SET [Identification_criteria] = replace(replace(replace([Identification_criteria],'TCaracThes_',''),'[id',''),']','')
--select len(replace(replace(replace([Identification_criteria],'TCaracThes_',''),'[id',''),']','')),replace(replace(replace([Identification_criteria],'TCaracThes_',''),'[id',''),']',''),D.* 
--from [dbo].[TProtocol_Capture_Individual] D
where len([Identification_criteria]) > 255 



UPDATE [TProtocol_Nest_Description]
SET [Identification_criteria] = replace(replace(replace([Identification_criteria],'TCaracThes_',''),'[id',''),']','')
--select len(replace(replace(replace([Identification_criteria],'TCaracThes_',''),'[id',''),']','')),replace(replace(replace([Identification_criteria],'TCaracThes_',''),'[id',''),']',''),D.*  from [dbo].[TProtocol_Nest_Description] D
where len([Identification_criteria]) > 255 
