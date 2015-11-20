

truncate table UPDATEDThesaurus


--ONe shoot : CREATE INDEX IX_ObservationDynPropValue_ValueString ON ObservationDynPropValue(ValueString) INCLUDE (FK_ObservationDynProp,fk_observation)

IF object_id('tempdb..#TermeThesaurus') IS NOT NULL
			DROP TABLE #TermeThesaurus


select distinct ValueString,convert(int,F.Options) StartNodeId,V.FK_ObservationDynProp, convert(varchar(255),'') FullPath
into #TermeThesaurus
from [dbo].[ObservationDynPropValue] V 
JOIN ObservationDynProp P on V.FK_ObservationDynProp = p.ID
JOIN Observation  O on V.FK_Observation = O.ID
JOIN  ModuleForms F on F.Name = p.Name and (F.TypeObj IS NULL OR  o.FK_ProtocoleType = F.TypeObj) and module_id=1 and F.InputType = 'AutocompTreeEditor'
WHERE V.ValueString IS NOT NULL and V.ValueString <> ''


CREATE UNIQUE INDEX UQ_TempTermeThesaurus_ValueString on #TermeThesaurus(ValueString,FK_ObservationDynProp,StartNodeId)


-- Correspondance FR
UPDATE Th
SET FullPath = T.TTop_FullPath
-- select *
FROM #TermeThesaurus Th
JOIN THESAURUS.dbo.TTopic D on D.TTop_PK_ID = Th.StartNodeId
JOIN THESAURUS.dbo.TTopic T on 
		(	T.TTop_Name = Th.ValueString and T.TTop_Type = CASE WHEN D.TTop_Type in ('TOP Concept') THEN D.TTop_Name ELSE D.TTop_Type END) 
WHERE ValueString IS NOT NULL and NOT EXISTS (Select * 
												from THESAURUS.dbo.TTopic T2 
												where T2.TTop_PK_ID <> T.TTop_PK_ID 
												AND  ( T2.TTop_Name = Th.ValueString and T2.TTop_Type = CASE WHEN D.TTop_Type = 'TOP Concept' THEN D.TTop_Name ELSE D.TTop_Type END 
													)
												)
AND Th.FullPath = ''


UPDATE Th
SET FullPath = T.TTop_FullPath
--select *
FROM #TermeThesaurus Th
JOIN THESAURUS.dbo.TTopic D on D.TTop_PK_ID = Th.StartNodeId
JOIN THESAURUS.dbo.TTopic T on 
		(	T.TTop_NameEn = Th.ValueString and T.TTop_Type = CASE WHEN D.TTop_Type in ('TOP Concept') THEN D.TTop_Name ELSE D.TTop_Type END) 
WHERE Th.ValueString IS NOT NULL  AND NOT EXISTS (Select * 
												from THESAURUS.dbo.TTopic T2 
												where T2.TTop_PK_ID <> T.TTop_PK_ID 
												AND  ( T2.TTop_NameEn = Th.ValueString and T2.TTop_Type = CASE WHEN D.TTop_Type = 'TOP Concept' THEN D.TTop_Name ELSE D.TTop_Type END 
													)
												)
and th.FullPath = ''




-- ambiguïté

/*
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
												)*/

-------------------- MAUVAIS NOEUD DE DEPART 

 
-- Mauvais noeud de départ
select * from #TermeThesaurus T 
WHERE NOT EXISTS (select * from THESAURUS.dbo.TTopic Th where Th.TTop_PK_ID = T.StartNodeId)
and FullPath =''

-- correspondance pour mauvais noeud de départ
select th.ValueString,T.TTop_Name,th.StartNodeId,p.Name,TC.TTop_PK_ID,tc.TTop_Name 
from #TermeThesaurus Th JOIN ObservationDynProp P on Th.FK_ObservationDynProp = p.ID 
JOIN THESAURUS.dbo.TTopic T on th.ValueString = T.TTop_Name JOIN THESAURUS.dbo.TTopic TC on TC.TTop_Name = T.TTop_Type
where FullPath =''
order by th.ValueString

select distinct th.ValueString,T.TTop_Name,th.StartNodeId,p.Name DYnPropName,TC.TTop_PK_ID TOPConceptID,tc.TTop_Name TopConceptName, PT.Name Protocole, TCW.TTop_Name MauvaisTTOpConcept
from #TermeThesaurus Th 
JOIN ObservationDynPropValue V on V.ValueString = th.ValueString  and v.FK_ObservationDynProp = th.FK_ObservationDynProp
JOIN ObservationDynProp P on Th.FK_ObservationDynProp = p.ID 
JOIN THESAURUS.dbo.TTopic T on th.ValueString = T.TTop_Name 
JOIN THESAURUS.dbo.TTopic TC on TC.TTop_Name = T.TTop_Type
JOIN Observation O on v.FK_Observation = o.id
JOIN ProtocoleType PT on PT.ID = o.FK_ProtocoleType
LEFT JOIN THESAURUS.dbo.TTopic TCW on TCW.TTop_PK_ID = Th.StartNodeId
where FullPath =''
order by Pt.Name, DYnPropName,th.ValueString




------------------------------------------  AUCUNE CORRESPONDANCE

select distinct V.ValueString,PT.name Protocole,Th.StartNodeId , CASE WHEN T.TTop_Type = 'TOP Concept' THEN T.TTop_Name ELSE T.TTop_Type END TopConcept
from #TermeThesaurus Th 
JOIN ObservationDynPropValue V on V.ValueString = th.ValueString 
JOIN ObservationDynProp P on Th.FK_ObservationDynProp = p.ID 
JOIN Observation O on v.FK_Observation = o.id
JOIN ProtocoleType PT on PT.ID = o.FK_ProtocoleType
LEFT JOIN THESAURUS.dbo.TTopic T on T.TTop_PK_ID = th.StartNodeId
WHERE NOT EXISTS ( select * from THESAURUS.dbo.TTopic T where  th.ValueString = T.TTop_Name  )
and FullPath =''
order by Pt.Name, V.ValueString






-- UPDATE FROM Table
UPDATE V
 SET ValueString =T.FullPath
 OUTPUT inserted.ID into UPDATEDThesaurus
 -- select TOP 10 *
from [dbo].[ObservationDynPropValue] V 
JOIN  #TermeThesaurus T on v.FK_ObservationDynProp = V.FK_ObservationDynProp and T.ValueString = V.ValueString and T.FullPath <> ''
	AND V.ID not in (select fk_observationdynpropvalue from UPDATEDThesaurus OT )




