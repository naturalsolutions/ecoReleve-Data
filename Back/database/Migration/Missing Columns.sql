select o.name tableName ,c.name columnname , DP.Name ObservationDynPropName
from [ECWP-eReleveData].dbo.sysobjects O 
JOIN [ECWP-eReleveData].dbo.syscolumns C on c.id = o.id 
JOIN  [EcoReleve_ECWP].[dbo].[MigrationConfigurationProtocoleList] PL on o.name = PL.TableName
LEFT  JOIN  [EcoReleve_ECWP].[dbo].MigrationConfigurationProtocoleContent PC on PC.fk_ConfigurationProtocole = PL.ID AND  c.name = PC.ColumnName
LEFT JOIN [EcoReleve_ECWP].[dbo].ObservationDynProp DP ON DP.Name =  replace(c.name,'Name_','') 
where o.type='U' and o.name like 'TProtocol_%'
and o.name not in ('TProtocole','TProtocol_ArgosDataArgos')
and c.name not in ('FK_TInd_ID','FK_TSta_ID','pk','Comments','ind_id','fk_group')
and c.name not like 'id_%'
AND  NOT EXISTS (select *  
				from sysobjects O2 
				JOIN syscolumns C2 on c2.id = o2.id
				WHERE o2.name = o.name and c2.name = isnull(PC.TargetColumnName,c.name)
				)
order by o.name,c.name


--- Insertion des propriétés dynamiques 
INSERT INTO EcoReleve_ECWP.dbo.ObservationDynProp
(Name,TypeProp)
select replace(c.name,'Name_','') 
	, CASE WHEN c.name in ('Bird_collected','Element_Nb','Obs_duration_old') THEN 'Integer'  
	WHEN c.name in ('Feather_Black_Display','Feather_Black_White','Feather_Occipital','Feather_White_Display','Half_Culmen','Sternum','Tail','Toe_middle_length','Toe_middle_width','Toe_middle_width_max','Toe_middle_width_min','Flutter_0_max','Width') 
			THEN 'Float' 
	WHEN c.name in ('observation_time') THEN 'Date'
	ELSE 'String' END
from [ECWP-eReleveData].dbo.sysobjects O 
JOIN [ECWP-eReleveData].dbo.syscolumns C on c.id = o.id 
JOIN  [EcoReleve_ECWP].[dbo].[MigrationConfigurationProtocoleList] PL on o.name = PL.TableName
LEFT  JOIN  [EcoReleve_ECWP].[dbo].MigrationConfigurationProtocoleContent PC on PC.fk_ConfigurationProtocole = PL.ID AND  c.name = PC.ColumnName
LEFT JOIN [EcoReleve_ECWP].[dbo].ObservationDynProp DP ON DP.Name =  replace(c.name,'Name_','')
where o.type='U' and o.name like 'TProtocol_%'
and o.name not in ('TProtocole','TProtocol_ArgosDataArgos')
and c.name not in ('FK_TInd_ID','FK_TSta_ID','pk','Comments','ind_id','fk_group')
and c.name not like 'id_%'
AND  NOT EXISTS (select *  
				from sysobjects O2 
				JOIN syscolumns C2 on c2.id = o2.id
				WHERE o2.name = o.name and c2.name = isnull(PC.TargetColumnName,c.name)
				)
AND DP.name IS NULL
order by o.name,c.name


-- INsertion des liens pour les propriétés dynamiques

INSERT INTO [EcoReleve_ECWP].[dbo].[ProtocoleType_ObservationDynProp]
           ([Required]
           ,[FK_ProtocoleType]
           ,[FK_ObservationDynProp]
           ,[Locked])

select 1,PT.id,Dp.ID,0
from [ECWP-eReleveData].dbo.sysobjects O 
JOIN [ECWP-eReleveData].dbo.syscolumns C on c.id = o.id 
JOIN  [EcoReleve_ECWP].[dbo].[MigrationConfigurationProtocoleList] PL on o.name = PL.TableName
JOIN [EcoReleve_ECWP].[dbo].ProtocoleType PT on PL.ProtocoleName = PT.Name
LEFT  JOIN  [EcoReleve_ECWP].[dbo].MigrationConfigurationProtocoleContent PC on PC.fk_ConfigurationProtocole = PL.ID AND  c.name = PC.ColumnName
JOIN [EcoReleve_ECWP].[dbo].ObservationDynProp DP ON DP.Name =  replace(c.name,'Name_','')
where o.type='U' and o.name like 'TProtocol_%'
and o.name not in ('TProtocole','TProtocol_ArgosDataArgos')
and c.name not in ('FK_TInd_ID','FK_TSta_ID','pk','Comments','ind_id','fk_group')
and c.name not like 'id_%'
AND  NOT EXISTS (select *  
				from sysobjects O2 
				JOIN syscolumns C2 on c2.id = o2.id
				WHERE o2.name = o.name and c2.name = isnull(PC.TargetColumnName,c.name)
				)
order by o.name,c.name




select PT.Name,P.Name,p.TypeProp
from [EcoReleve_ECWP].[dbo].ProtocoleType PT 
JOIN [EcoReleve_ECWP].[dbo].ProtocoleType_ObservationDynProp C ON C.FK_ProtocoleType =PT.ID 
JOIN [EcoReleve_ECWP].[dbo].ObservationDynProp P on C.FK_ObservationDynProp = P.ID
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
JOIN  [EcoReleve_ECWP].[dbo].[MigrationConfigurationProtocoleList] PL on o.name = PL.TableName
JOIN [EcoReleve_ECWP].[dbo].ObservationDynProp DP ON 'Name_' + DP.Name =   c.name
where o.type='U' and o.name like 'TProtocol_%'
and not exists (select * from   [EcoReleve_ECWP].[dbo].MigrationConfigurationProtocoleContent PC where PC.fk_ConfigurationProtocole = PL.ID AND  c.name = PC.ColumnName )
ORDER BY PL.ProtocoleName,c.name
