truncate table UPDATEDThesaurus


--ONe shoot : CREATE INDEX IX_ObservationDynPropValue_ValueString ON ObservationDynPropValue(ValueString) INCLUDE (FK_ObservationDynProp,fk_observation)


/* Insert Thesaural terms for Observations */
--------------------------------------------------------------------------------------------------------------------------------------------
IF object_id('tempdb..#TermeThesaurus') IS NOT NULL
			DROP TABLE #TermeThesaurus


/*Inset Thesaural terms for Individuals */
---------------------------------------------------------------------------------------------------------------------------------------------

select distinct ValueString as Value,convert(int,F.Options) StartNodeId,convert(varchar(50),V.FK_IndividualDynProp) as Prop, convert(varchar(255),'') FullPath
into #TermeThesaurus
from [dbo].[IndividualDynPropValue] V 
JOIN IndividualDynProp P on V.FK_IndividualDynProp = p.ID
JOIN Individual  O on V.FK_Individual = O.ID
JOIN  ModuleForms F on F.Name = p.Name and (F.TypeObj IS NULL OR  o.FK_IndividualType = F.TypeObj) and module_id=9 and F.InputType = 'AutocompTreeEditor'
WHERE V.ValueString IS NOT NULL and V.ValueString <> ''

--DECLARE @toto table (colName varchar(100),name varchar(100))

--INSERT INTO @toto
--select 
--    c.name as colName,o.name
--    from sys.columns c
--    join sys.objects o on c.object_id=o.object_id
--	WHERE  o.name = 'Individual'

INSERT INTO #TermeThesaurus
SELECT distinct p.value,convert(int,F.Options) StartNodeId,p.colName, convert(varchar(255),'') FullPath
FROM Individual I
unpivot (
	 value
	for colName in  (Age,species)
	
) p
JOIN  ModuleForms F 
	on F.Name = p.colName and module_id=9 and F.InputType = 'AutocompTreeEditor'

select * from #TermeThesaurus
where Prop in ('Age','Species')


/*Update Thesaural terms correspondance */
---------------------------------------------------------------------------------------------------------------------------------------------

CREATE UNIQUE INDEX UQ_TempTermeThesaurus_ValueString on #TermeThesaurus(Value,Prop,StartNodeId)


-- Correspondance FR
UPDATE Th
SET FullPath = T.TTop_FullPath
-- select *
FROM #TermeThesaurus Th
JOIN THESAURUS.dbo.TTopic D on D.TTop_PK_ID = Th.StartNodeId
JOIN THESAURUS.dbo.TTopic T on 
		(	T.TTop_Name = Th.Value and T.TTop_Type = CASE WHEN D.TTop_Type in ('TOP Concept') THEN D.TTop_Name ELSE D.TTop_Type END) 
WHERE Value IS NOT NULL and NOT EXISTS (Select * 
												from THESAURUS.dbo.TTopic T2 
												where T2.TTop_PK_ID <> T.TTop_PK_ID 
												AND  ( T2.TTop_Name = Th.Value and T2.TTop_Type = CASE WHEN D.TTop_Type = 'TOP Concept' THEN D.TTop_Name ELSE D.TTop_Type END 
													)
												)
AND Th.FullPath = ''


UPDATE Th
SET FullPath = T.TTop_FullPath
--select *
FROM #TermeThesaurus Th
JOIN THESAURUS.dbo.TTopic D on D.TTop_PK_ID = Th.StartNodeId
JOIN THESAURUS.dbo.TTopic T on 
		(	T.TTop_NameEn = Th.Value and T.TTop_Type = CASE WHEN D.TTop_Type in ('TOP Concept') THEN D.TTop_Name ELSE D.TTop_Type END) 
WHERE Th.Value IS NOT NULL  AND NOT EXISTS (Select * 
												from THESAURUS.dbo.TTopic T2 
												where T2.TTop_PK_ID <> T.TTop_PK_ID 
												AND  ( T2.TTop_NameEn = Th.Value and T2.TTop_Type = CASE WHEN D.TTop_Type = 'TOP Concept' THEN D.TTop_Name ELSE D.TTop_Type END 
													)
												)
and th.FullPath = ''


/*  ambiguïté*/ 
-------------------------------------------------------------------------------------------------------------------------------------
/*
select *
from [dbo].[IndividualDynPropValue] V JOIN Individual  O on V.FK_Individual = O.ID
JOIN IndividualDynProp P on V.FK_IndividualDynProp = p.ID
JOIN  ModuleForms F on F.Name = p.Name and (F.TypeObj IS NULL OR  o.FK_IndividualType = F.TypeObj) and module_id=1 and F.InputType = 'AutocompTreeEditor'
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


/*MAUVAIS NOEUD DE DEPART && Aucune Correspondance*/
---------------------------------------------------------------------------------------------------------------------------------------------------------
 
---- Mauvais noeud de départ
--select * from #TermeThesaurus T 
--WHERE NOT EXISTS (select * from THESAURUS.dbo.TTopic Th where Th.TTop_PK_ID = T.StartNodeId)
--and FullPath =''

---- correspondance pour mauvais noeud de départ
--select th.Value,T.TTop_Name,th.StartNodeId,p.Name,TC.TTop_PK_ID,tc.TTop_Name 
--from #TermeThesaurus Th JOIN IndividualDynProp P on Th.Prop = p.ID 
--JOIN THESAURUS.dbo.TTopic T on th.Value = T.TTop_Name JOIN THESAURUS.dbo.TTopic TC on TC.TTop_Name = T.TTop_Type
--where FullPath =''
--order by th.Value

select distinct th.Value,T.TTop_Name,th.StartNodeId,p.Name DYnPropName,TC.TTop_PK_ID TOPConceptID,tc.TTop_Name TopConceptName, PT.Name Individual, TCW.TTop_Name MauvaisTTOpConcept
from #TermeThesaurus Th 
JOIN IndividualDynPropValue V on V.ValueString = th.Value  and v.FK_IndividualDynProp = th.Prop and  th.Prop not in ('Species','Age')
JOIN IndividualDynProp P on Th.Prop = p.ID 
JOIN THESAURUS.dbo.TTopic T on th.Value = T.TTop_Name 
JOIN THESAURUS.dbo.TTopic TC on TC.TTop_Name = T.TTop_Type
JOIN Individual O on v.FK_Individual = o.id
JOIN IndividualType PT on PT.ID = o.FK_IndividualType
LEFT JOIN THESAURUS.dbo.TTopic TCW on TCW.TTop_PK_ID = Th.StartNodeId
where FullPath ='' 
order by Pt.Name, DYnPropName,th.Value

------AUCUNE CORRESPONDANCE



select distinct o.ID,V.ValueString,PT.name Individual,Th.StartNodeId , CASE WHEN T.TTop_Type = 'TOP Concept' THEN T.TTop_Name ELSE T.TTop_Type END TopConcept
from #TermeThesaurus Th 
JOIN IndividualDynPropValue V on V.ValueString = th.Value 
JOIN IndividualDynProp P on Th.Prop = p.ID and  th.Prop not in ('Species','Age')
JOIN Individual O on v.FK_Individual = o.id
JOIN IndividualType PT on PT.ID = o.FK_IndividualType
LEFT JOIN THESAURUS.dbo.TTopic T on T.TTop_PK_ID = th.StartNodeId
WHERE NOT EXISTS ( select * from THESAURUS.dbo.TTopic T where  th.Value = T.TTop_Name  )
and FullPath =''
order by Pt.Name, V.ValueString


select * from  #TermeThesaurus
Where  isnull(FullPath,'') = ''
and Prop = '19'


/* UPDATE Individuals FROM Table Thesaural correspondance*/ 
---------------------------------------------------------------------------------------------------------------------------------------------------------
UPDATE V
 SET ValueString =T.FullPath
 --OUTPUT inserted.ID into UPDATEDThesaurus
 -- select  *
from [dbo].[IndividualDynPropValue] V 
JOIN  #TermeThesaurus T on v.FK_IndividualDynProp = t.Prop and t.Prop not in ('Species','Age') and T.Value = V.ValueString and T.FullPath <> ''
	AND V.ID not in (select fk_observationdynpropvalue from UPDATEDThesaurus OT )


update I set i.Age = ta.Fullpath, i.Species = ts.FullPath
--select top 10 * 
FROM Individual i 
JOIN #TermeThesaurus ts ON ts.Prop = 'Species' and ts.value = i.species 
JOIN #TermeThesaurus ta ON ta.Prop = 'Age' and ta.value = i.age  



select  *
from [dbo].[IndividualDynPropValue] V 
JOIN  #TermeThesaurus T on v.FK_IndividualDynProp = T.Prop and t.Prop not in ('Species','Age') and T.Value = V.ValueString and T.FullPath <> ''
