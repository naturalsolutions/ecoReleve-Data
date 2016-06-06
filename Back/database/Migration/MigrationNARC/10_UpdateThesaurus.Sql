

/***************************************************************** Thesaurus Protocole **********************************************/

truncate table UPDATEDThesaurus

CREATE index IX_TTopic_Name on THESAURUS.dbo.TTOPIC(TTop_Name)

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
		(	(T.TTop_Name = Th.ValueString or t.TTop_FullPath = Th.ValueString) and T.TTop_Type = CASE WHEN D.TTop_Type in ('TOP Concept') THEN D.TTop_Name ELSE D.TTop_Type END) 
WHERE Th.FullPath = ''
AND ValueString IS NOT NULL and NOT EXISTS (Select * 
												from THESAURUS.dbo.TTopic T2 
												where T2.TTop_PK_ID <> T.TTop_PK_ID 
												AND  ( T2.TTop_Name = Th.ValueString and T2.TTop_Type = CASE WHEN D.TTop_Type = 'TOP Concept' THEN D.TTop_Name ELSE D.TTop_Type END 
													)
												)



UPDATE Th
SET FullPath = T.TTop_FullPath
--select *
FROM #TermeThesaurus Th
JOIN THESAURUS.dbo.TTopic D on D.TTop_PK_ID = Th.StartNodeId
JOIN THESAURUS.dbo.TTopic T on 
		(	 T.TTop_Type = CASE WHEN D.TTop_Type in ('TOP Concept') THEN D.TTop_Name ELSE D.TTop_Type END) 
JOIN THESAURUS.dbo.TTopicLibelle Lb ON Lb.TLib_FK_TTop_ID = t.TTop_PK_ID AND Lb.TLib_FK_TLan_ID ='en' and (Lb.TLib_Name = TH.ValueString or Lb.TLib_FullPath = Th.ValueString)
WHERE th.FullPath = '' 
AND Th.ValueString IS NOT NULL  AND NOT EXISTS (Select * 
												from THESAURUS.dbo.TTopic T2 
												JOIN THESAURUS.dbo.TTopicLibelle Lb2 ON Lb2.TLib_FK_TTop_ID = t2.TTop_PK_ID AND Lb2.TLib_FK_TLan_ID ='en' and (Lb2.TLib_Name = TH.ValueString )
												where T2.TTop_PK_ID <> T.TTop_PK_ID 
												AND  ( Lb.TLib_Name = TH.ValueString and T2.TTop_Type = CASE WHEN D.TTop_Type = 'TOP Concept' THEN D.TTop_Name ELSE D.TTop_Type END 
													)
												)



-------------------- MAUVAIS NOEUD DE DEPART 


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

select distinct V.ValueString,PT.name Protocole, P.Name NOmPropriete, Th.StartNodeId , CASE WHEN T.TTop_Type = 'TOP Concept' THEN T.TTop_Name ELSE T.TTop_Type END TopConcept
from #TermeThesaurus Th 
JOIN ObservationDynPropValue V on V.ValueString = th.ValueString 
JOIN ObservationDynProp P on Th.FK_ObservationDynProp = p.ID 
JOIN Observation O on v.FK_Observation = o.id
JOIN ProtocoleType PT on PT.ID = o.FK_ProtocoleType
LEFT JOIN THESAURUS.dbo.TTopic T on T.TTop_PK_ID = th.StartNodeId
WHERE  Th.FullPath =''
order by Pt.Name, V.ValueString




-- UPDATE FROM Table
UPDATE V
 SET ValueString =T.FullPath
 -- select TOP 10 *
from [dbo].[ObservationDynPropValue] V 
JOIN  #TermeThesaurus T on v.FK_ObservationDynProp = T.FK_ObservationDynProp and T.ValueString = V.ValueString and T.FullPath <> ''





	/***************************************************************** Thesaurus Individu  **********************************************/


IF object_id('tempdb..#TermeThesaurus') IS NOT NULL
			DROP TABLE #TermeThesaurus


select distinct ValueString,convert(int,F.Options) StartNodeId,V.FK_IndividualDynProp, convert(varchar(255),'') FullPath
into #TermeThesaurus
from [dbo].[IndividualDynPropValue] V 
JOIN IndividualDynProp P on V.FK_IndividualDynProp = p.ID
JOIN Individual  O on V.FK_Individual = O.ID
JOIN  ModuleForms F on F.Name = p.Name and module_id=9 and F.InputType = 'AutocompTreeEditor'
WHERE V.ValueString IS NOT NULL and V.ValueString <> ''

CREATE UNIQUE INDEX UQ_TempTermeThesaurus_ValueString on #TermeThesaurus(ValueString,FK_IndividualDynProp,StartNodeId)

select * from #TermeThesaurus

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
		(	 T.TTop_Type = CASE WHEN D.TTop_Type in ('TOP Concept') THEN D.TTop_Name ELSE D.TTop_Type END) 
JOIN THESAURUS.dbo.TTopicLibelle Lb ON Lb.TLib_FK_TTop_ID = t.TTop_PK_ID AND Lb.TLib_FK_TLan_ID ='en' and Lb.TLib_Name = TH.ValueString
WHERE th.FullPath = '' 
AND Th.ValueString IS NOT NULL  AND NOT EXISTS (Select * 
												from THESAURUS.dbo.TTopic T2 
												JOIN THESAURUS.dbo.TTopicLibelle Lb2 ON Lb2.TLib_FK_TTop_ID = t2.TTop_PK_ID AND Lb2.TLib_FK_TLan_ID ='en' and Lb2.TLib_Name = TH.ValueString
												where T2.TTop_PK_ID <> T.TTop_PK_ID 
												AND  ( Lb.TLib_Name = TH.ValueString and T2.TTop_Type = CASE WHEN D.TTop_Type = 'TOP Concept' THEN D.TTop_Name ELSE D.TTop_Type END 
													)
												)


-- Pas de correspondance 
select distinct V.ValueString,Th.StartNodeId , CASE WHEN T.TTop_Type = 'TOP Concept' THEN T.TTop_Name ELSE T.TTop_Type END TopConcept,p.Name NomProp
from #TermeThesaurus Th 
JOIN IndividualDynPropValue V on V.ValueString = th.ValueString 
JOIN IndividualDynProp P on Th.FK_IndividualDynProp = p.ID 
JOIN Individual O on v.FK_Individual = o.id
LEFT JOIN THESAURUS.dbo.TTopic T on T.TTop_PK_ID = th.StartNodeId
WHERE FullPath =''
union all
(

select  distinct i.Age,222957, CASE WHEN T.TTop_Type = 'TOP Concept' THEN T.TTop_Name ELSE T.TTop_Type END TopConcept ,'Age' NomProp
from Individual I JOIN THESAURUS.dbo.TTopic T on T.TTop_PK_ID = 222957
WHERE i.Age IS NOT NULL 
AND NOT EXISTS (
	select * 
	from THESAURUS.dbo.TTopic T2 JOIN THESAURUS.dbo.TTopicLibelle Lb ON Lb.TLib_FK_TTop_ID = t2.TTop_PK_ID  and LB.TLib_FK_TLan_ID = 'en'
	where TTop_ParentID=222957 and  (i.Age = T2.TTop_Name  or i.Age = LB.TLib_Name)

	)
union all
select  distinct i.Species,2001555, 'Vertébrés','Species' NomProp
from Individual I JOIN THESAURUS.dbo.TTopic T on T.TTop_PK_ID = 222957
WHERE i.Species IS NOT NULL 
AND NOT EXISTS (
	select * 
	from THESAURUS.dbo.TTopic T2 JOIN THESAURUS.dbo.TTopicLibelle Lb ON Lb.TLib_FK_TTop_ID = t2.TTop_PK_ID  and LB.TLib_FK_TLan_ID = 'en'
	where TTop_Type ='Vertébrés' and  (i.Species = T2.TTop_Name  or i.Species = LB.TLib_Name)

	)
)



-- UPDATE FROM Table
UPDATE V
 SET ValueString =T.FullPath
 -- select TOP 10 *
from [dbo].[IndividualDynPropValue] V 
JOIN  #TermeThesaurus T on v.FK_IndividualDynProp = T.FK_IndividualDynProp and T.ValueString = V.ValueString and T.FullPath <> ''


UPDATE I
 SET Age =T.TTop_FullPath
 -- select *
from [dbo].[Individual] I 
JOIN THESAURUS.dbo.TTopic T ON T.TTop_ParentID=222957
JOIN THESAURUS.dbo.TTopicLibelle Lb ON Lb.TLib_FK_TTop_ID = T.TTop_PK_ID  and LB.TLib_FK_TLan_ID = 'en'
where  (i.Age = T.TTop_Name  or i.Age = LB.TLib_Name) and i.Age IS NOT NULL

UPDATE I
 SET Species =T.TTop_FullPath
 -- select *
from [dbo].[Individual] I 
JOIN THESAURUS.dbo.TTopic T ON T.TTop_Type ='Vertébrés'
JOIN THESAURUS.dbo.TTopicLibelle Lb ON Lb.TLib_FK_TTop_ID = T.TTop_PK_ID  and LB.TLib_FK_TLan_ID = 'en'
where  (i.Species = T.TTop_Name  or i.Species = LB.TLib_Name) and i.Species IS NOT NULL



	/***************************************************************** Thesaurus Monitored Site   **********************************************/




-- Pas de correspondance 

select  distinct M.Category,223070, 'types de sites suivis' TopConcept ,'Category' NomProp
from MonitoredSite M 
WHERE M.Category IS NOT NULL 
AND  NOT EXISTS (
	select * 
	from THESAURUS.dbo.TTopic T JOIN THESAURUS.dbo.TTopicLibelle Lb ON Lb.TLib_FK_TTop_ID = t.TTop_PK_ID  and LB.TLib_FK_TLan_ID = 'en'
	where T.TTop_ParentID=223070 and (m.Category = Lb.TLib_Name  or m.Category = t.TTop_Name)
	)



-- UPDATE FROM Table

UPDATE M
 SET Category =T.TTop_FullPath
 -- select *
from [dbo].MonitoredSite M
JOIN THESAURUS.dbo.TTopic T ON T.TTop_ParentID=223070
JOIN THESAURUS.dbo.TTopicLibelle Lb ON Lb.TLib_FK_TTop_ID = T.TTop_PK_ID  and LB.TLib_FK_TLan_ID = 'en'
where  (M.Category = T.TTop_Name  or M.Category = LB.TLib_Name) and M.Category IS NOT NULL


/***************************************************************** Thesaurus Sensors   **********************************************/



IF object_id('tempdb..#TermeThesaurus') IS NOT NULL
			DROP TABLE #TermeThesaurus


select distinct ValueString,convert(int,F.Options) StartNodeId,V.FK_SensorDynProp, convert(varchar(255),'') FullPath
into #TermeThesaurus
from [dbo].[SensorDynPropValue] V 
JOIN SensorDynProp P on V.FK_SensorDynProp = p.ID
JOIN Sensor  O on V.FK_Sensor = O.ID
JOIN  ModuleForms F on F.Name = p.Name and module_id=16 and F.InputType = 'AutocompTreeEditor'
WHERE V.ValueString IS NOT NULL and V.ValueString <> ''

CREATE UNIQUE INDEX UQ_TempTermeThesaurus_ValueString on #TermeThesaurus(ValueString,FK_SensorDynProp,StartNodeId)

select * from #TermeThesaurus

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
		(	 T.TTop_Type = CASE WHEN D.TTop_Type in ('TOP Concept') THEN D.TTop_Name ELSE D.TTop_Type END) 
JOIN THESAURUS.dbo.TTopicLibelle Lb ON Lb.TLib_FK_TTop_ID = t.TTop_PK_ID AND Lb.TLib_FK_TLan_ID ='en' and Lb.TLib_Name = TH.ValueString
WHERE th.FullPath = '' 
AND Th.ValueString IS NOT NULL  AND NOT EXISTS (Select * 
												from THESAURUS.dbo.TTopic T2 
												JOIN THESAURUS.dbo.TTopicLibelle Lb2 ON Lb2.TLib_FK_TTop_ID = t2.TTop_PK_ID AND Lb2.TLib_FK_TLan_ID ='en' and Lb2.TLib_Name = TH.ValueString
												where T2.TTop_PK_ID <> T.TTop_PK_ID 
												AND  ( Lb.TLib_Name = TH.ValueString and T2.TTop_Type = CASE WHEN D.TTop_Type = 'TOP Concept' THEN D.TTop_Name ELSE D.TTop_Type END 
													)
												)


-- Pas de correspondance 
select distinct V.ValueString,Th.StartNodeId , CASE WHEN T.TTop_Type = 'TOP Concept' THEN T.TTop_Name ELSE T.TTop_Type END TopConcept,p.Name NomProp
from #TermeThesaurus Th 
JOIN SensorDynPropValue V on V.ValueString = th.ValueString 
JOIN SensorDynProp P on Th.FK_SensorDynProp = p.ID 
JOIN Sensor O on v.FK_Sensor = o.id
LEFT JOIN THESAURUS.dbo.TTopic T on T.TTop_PK_ID = th.StartNodeId
WHERE FullPath =''
union all
(

select  distinct S.Model,204114, 'modèles d''émetteur' ,'Model' NomProp
from Sensor S JOIN THESAURUS.dbo.TTopic T on T.TTop_PK_ID = 222957
WHERE S.model IS NOT NULL 
AND NOT EXISTS (
	select * 
	from THESAURUS.dbo.TTopic T2 JOIN THESAURUS.dbo.TTopicLibelle Lb ON Lb.TLib_FK_TTop_ID = t2.TTop_PK_ID  and LB.TLib_FK_TLan_ID = 'en'
	where T2.TTop_Type='modèles d''émetteur' and  (S.model = T2.TTop_Name  or S.model = LB.TLib_Name)

	)
union all
select  distinct S.Compagny,1204132, 'fabricants','Compagny' NomProp
from Sensor S JOIN THESAURUS.dbo.TTopic T on T.TTop_PK_ID = 222957
WHERE S.Compagny IS NOT NULL 
AND NOT EXISTS (
	select * 
	from THESAURUS.dbo.TTopic T2 JOIN THESAURUS.dbo.TTopicLibelle Lb ON Lb.TLib_FK_TTop_ID = t2.TTop_PK_ID  and LB.TLib_FK_TLan_ID = 'en'
	where T2.TTop_Type='fabricants' and  (S.Compagny = T2.TTop_Name  or S.Compagny = LB.TLib_Name)

	)
)



-- UPDATE FROM Table
UPDATE V
 SET ValueString =T.FullPath
 -- select TOP 10 *
from [dbo].[SensorDynPropValue] V 
JOIN  #TermeThesaurus T on v.FK_SensorDynProp = T.FK_SensorDynProp and T.ValueString = V.ValueString and T.FullPath <> ''


UPDATE S
 SET Model =T.TTop_FullPath
 -- select *
from [dbo].[Sensor] S
JOIN THESAURUS.dbo.TTopic T ON T.TTop_Type='modèles d''émetteur'
JOIN THESAURUS.dbo.TTopicLibelle Lb ON Lb.TLib_FK_TTop_ID = T.TTop_PK_ID  and LB.TLib_FK_TLan_ID = 'en'
where  (S.Model = T.TTop_Name  or S.Model = LB.TLib_Name) and S.Model IS NOT NULL

UPDATE S
 SET Compagny =T.TTop_FullPath
 -- select *
from [dbo].[Sensor] S
JOIN THESAURUS.dbo.TTopic T ON T.TTop_Type ='fabricants'
JOIN THESAURUS.dbo.TTopicLibelle Lb ON Lb.TLib_FK_TTop_ID = T.TTop_PK_ID  and LB.TLib_FK_TLan_ID = 'en'
where  (S.Compagny = T.TTop_Name  or s.Compagny = LB.TLib_Name) and s.Compagny IS NOT NULL

