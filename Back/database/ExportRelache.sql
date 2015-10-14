DECLARE @InList ListOfIDs

/*
select i.TInd_StatusSortie, i.* from TProtocole P 
JOIn TSaisie S on s.TSai_FK_TPro_ID = p.TPro_PK_ID
JOIN TIndividus I on i.TInd_PK_ID = s.TSai_FK_TInd_ID
where P.TPro_Titre like '%Morphological evaluation%' and TInd_StatusSortie = 'Relâché'
and TInd_DateSortie > GETDATE()-200
*/

insert into @InList
select I.TInd_PK_ID from [NARC_TRACK_MACQ].dbo.TIndividus I
WHERE I.TInd_StatusSortie = 'Relâché'
and TInd_DateSortie > GETDATE()-180


/*insert into @InList
select distinct TInd_PK_ID from TIndividus
where (TInd_BagueID IS NOT NULL AND TInd_BagueID not like '%#') 
*/
exec pr_MessageExportIndividu @InList,'Relaché'

--exec MessageSendDataToDest