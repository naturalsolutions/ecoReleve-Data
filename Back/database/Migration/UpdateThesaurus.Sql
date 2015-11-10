



-- ambiguïté
select *
from [dbo].[ObservationDynPropValue] V JOIN Observation  O on V.FK_Observation = O.ID
JOIN ObservationDynProp P on V.FK_ObservationDynProp = p.ID
JOIN  ModuleForms F on F.Name = p.Name and (F.TypeObj IS NULL OR  o.FK_ProtocoleType = F.TypeObj) and module_id=1 and F.InputType = 'AutocompTreeEditor'
JOIN THESAURUS.dbo.TTopic D on D.TTop_PK_ID = F.Options
JOIN THESAURUS.dbo.TTopic T on 
		(	T.TTop_Name = V.ValueString and T.TTop_Type = CASE WHEN D.TTop_Type in ('TOP Concept') THEN D.TTop_Name ELSE D.TTop_Type END) 
		or (T.TTop_NameEn = V.ValueString and T.TTop_Type = CASE WHEN D.TTop_Type in ('TOP Concept') THEN D.TTop_Name ELSE D.TTop_Type END )
WHERE ValueString IS NOT NULL and NOT EXISTS (Select * 
												from THESAURUS.dbo.TTopic T2 
												where T2.TTop_PK_ID <> T.TTop_PK_ID 
												AND  ( T2.TTop_Name = V.ValueString and T2.TTop_Type = CASE WHEN D.TTop_Type = 'TOP Concept' THEN D.TTop_Name ELSE D.TTop_Type END 
													or T2.TTop_NameEn = V.ValueString and T2.TTop_Type = CASE WHEN D.TTop_Type = 'TOP Concept' THEN D.TTop_Name ELSE D.TTop_Type END)
												)
-- Pas de correspondance
select *
from [dbo].[ObservationDynPropValue] V 
JOIN Observation  O on V.FK_Observation = O.ID
JOIN ObservationDynProp P on V.FK_ObservationDynProp = p.ID
JOIN  ModuleForms F on F.Name = p.Name and (F.TypeObj IS NULL OR  o.FK_ProtocoleType = F.TypeObj) and module_id=1 and F.InputType = 'AutocompTreeEditor'
JOIN THESAURUS.dbo.TTopic D on D.TTop_PK_ID = F.Options
WHERE ValueString IS NOT NULL 
and  NOT EXISTS (Select * 
			from  THESAURUS.dbo.TTopic T where
		(	T.TTop_Name = V.ValueString and T.TTop_Type = CASE WHEN D.TTop_Type in ('TOP Concept') THEN D.TTop_Name ELSE D.TTop_Type END) 
		)
AND  NOT EXISTS (Select * 
			from  THESAURUS.dbo.TTopic T where
		(	T.TTop_NameEn = V.ValueString and T.TTop_Type = CASE WHEN D.TTop_Type in ('TOP Concept') THEN D.TTop_Name ELSE D.TTop_Type END) 
		)


-- Pas de correspondance EN
select V.*
from [dbo].[ObservationDynPropValue] V 
JOIN Observation  O on V.FK_Observation = O.ID
JOIN ObservationDynProp P on V.FK_ObservationDynProp = p.ID
JOIN  ModuleForms F on F.Name = p.Name and (F.TypeObj IS NULL OR  o.FK_ProtocoleType = F.TypeObj) and module_id=1 and F.InputType = 'AutocompTreeEditor'
JOIN THESAURUS.dbo.TTopic D on D.TTop_PK_ID = F.Options
WHERE ValueString IS NOT NULL and  
NOT EXISTS (Select * 
			from  THESAURUS.dbo.TTopic T where
		(	T.TTop_Name = V.ValueString and T.TTop_Type = CASE WHEN D.TTop_Type in ('TOP Concept') THEN D.TTop_Name ELSE D.TTop_Type END) 
		)




-- UPDATE FROM FR
UPDATE V
 SET ValueString =T.TTop_FullPath
 -- select TOP 10 *
from [dbo].[ObservationDynPropValue] V JOIN Observation  O on V.FK_Observation = O.ID
JOIN ObservationDynProp P on V.FK_ObservationDynProp = p.ID
JOIN  ModuleForms F on F.Name = p.Name and (F.TypeObj IS NULL OR  o.FK_ProtocoleType = F.TypeObj) and module_id=1 and F.InputType = 'AutocompTreeEditor'
JOIN THESAURUS.dbo.TTopic D on D.TTop_PK_ID = F.Options
JOIN THESAURUS.dbo.TTopic T on 
		(	T.TTop_Name = V.ValueString and T.TTop_Type = CASE WHEN D.TTop_Type in ('TOP Concept') THEN D.TTop_Name ELSE D.TTop_Type END) 
WHERE ValueString IS NOT NULL and NOT EXISTS (Select * 
												from THESAURUS.dbo.TTopic T2 
												where T2.TTop_PK_ID <> T.TTop_PK_ID 
												AND  ( T2.TTop_Name = V.ValueString and T2.TTop_Type = CASE WHEN D.TTop_Type = 'TOP Concept' THEN D.TTop_Name ELSE D.TTop_Type END 
													)
												)


UPDATE V
 SET ValueString =T.TTop_FullPath
 -- select TOP 10 *
from [dbo].[ObservationDynPropValue] V JOIN Observation  O on V.FK_Observation = O.ID
JOIN ObservationDynProp P on V.FK_ObservationDynProp = p.ID
JOIN  ModuleForms F on F.Name = p.Name and (F.TypeObj IS NULL OR  o.FK_ProtocoleType = F.TypeObj) and module_id=1 and F.InputType = 'AutocompTreeEditor'
JOIN THESAURUS.dbo.TTopic D on D.TTop_PK_ID = F.Options
JOIN THESAURUS.dbo.TTopic T on 
		(	T.TTop_NameEn = V.ValueString and T.TTop_Type = CASE WHEN D.TTop_Type in ('TOP Concept') THEN D.TTop_Name ELSE D.TTop_Type END) 
WHERE ValueString IS NOT NULL and NOT EXISTS (Select * 
												from THESAURUS.dbo.TTopic T2 
												where T2.TTop_PK_ID <> T.TTop_PK_ID 
												AND  ( T2.TTop_NameEn = V.ValueString and T2.TTop_Type = CASE WHEN D.TTop_Type = 'TOP Concept' THEN D.TTop_Name ELSE D.TTop_Type END 
													)
												)


select * from [SERVEUR2008\SQLSERVER2008].THESAURUS.dbo.TTopic 
where TTop_PK_ID=222953