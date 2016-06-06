
--- EXECUTER LES SCRIPTS GetProvenanceERD,TableEchangeSend,MessageSendDataToDest

CREATE VIEW ExistingSampleEntomoECol AS
select convert(int,replace(Original_Id,dbo.GetProvenance() + '_','')) ID
from [ECollectionEntomo].dbo.Samples
where Original_Id like (dbo.GetProvenance() + '%')

