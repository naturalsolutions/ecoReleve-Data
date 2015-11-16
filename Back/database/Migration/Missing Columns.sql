select o.name tableName ,c.name columnname , DP.Name ObservationDynPropName
from [ECWP-eReleveData].dbo.sysobjects O 
JOIN [ECWP-eReleveData].dbo.syscolumns C on c.id = o.id 
JOIN  NewModelERD.[dbo].[MigrationConfigurationProtocoleList] PL on o.name = PL.TableName
LEFT  JOIN  NewModelERD.[dbo].MigrationConfigurationProtocoleContent PC on PC.fk_ConfigurationProtocole = PL.ID AND  c.name = PC.ColumnName
LEFT JOIN NewModelERD.[dbo].ObservationDynProp DP ON DP.Name =  replace(c.name,'_Name','')
where o.type='U' and o.name like 'TProtocol_%'
and o.name not in ('TProtocole','TProtocol_ArgosDataArgos')
and c.name not in ('FK_TInd_ID','FK_TSta_ID','pk','Comments','ind_id')
and c.name not like 'id_%'
AND  NOT EXISTS (select *  
				from sysobjects O2 
				JOIN syscolumns C2 on c2.id = o2.id
				WHERE o2.name = o.name and c2.name = isnull(PC.TargetColumnName,c.name)
				)
order by o.name,c.name


select PT.Name,P.Name,p.TypeProp
from NewModelERD.[dbo].ProtocoleType PT 
JOIN NewModelERD.[dbo].ProtocoleType_ObservationDynProp C ON C.FK_ProtocoleType =PT.ID 
JOIN NewModelERD.[dbo].ObservationDynProp P on C.FK_ObservationDynProp = P.ID
ORDER by PT.Name,P.Name


select o.name from [ECWP-eReleveData].dbo.sysobjects o 
where  type='U' and o.name like 'TProtocol%' 
and   not exists (select * from  sysobjects o2 where o2.name = o.name and type='U')
and o.name not in ('TProtocole','TProtocol_ArgosDataArgos','TProtocol_ArgosDataGPS')



select 
' INSERT INTO [dbo].[MigrationConfigurationProtocoleContent] ' + char(10) +
           '([fk_ConfigurationProtocole] ' + char(10) +
           ',[ColumnName]'  + char(10) +
           ',[TargetColumnType]'  + char(10) +
           ',[TargetColumnName])'  + char(10) +

			'select ID,''' + c.name + ''',1,''' +  DP.name + ''' from [MigrationConfigurationProtocoleList] where ProtocoleName = ''' + PL.ProtocoleName + '''' + char(10) + 'GO' + char(10) + char(10)
from [ECWP-eReleveData].dbo.sysobjects O 
JOIN [ECWP-eReleveData].dbo.syscolumns C on c.id = o.id 
JOIN  NewModelERD.[dbo].[MigrationConfigurationProtocoleList] PL on o.name = PL.TableName
JOIN NewModelERD.[dbo].ObservationDynProp DP ON 'Name_' + DP.Name =   c.name
where o.type='U' and o.name like 'TProtocol_%'
and not exists (select * from   NewModelERD.[dbo].MigrationConfigurationProtocoleContent PC where PC.fk_ConfigurationProtocole = PL.ID AND  c.name = PC.ColumnName )
ORDER BY PL.ProtocoleName,c.name
