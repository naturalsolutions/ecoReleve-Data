

INSERT INTO [dbo].[MigrationConfigurationProtocoleList]
           (
		   [ProtocoleName]
           ,[TableName])
SELECT t.Name
      ,'TProtocol_'+[Relation]
	--
  FROM [ECWP-eReleveData].[dbo].[TProtocole] p 
  JOIN ProtocoleType t on replace(p.Relation,'_',' ') like t.Name  



INSERT INTO [dbo].[MigrationConfigurationProtocoleContent]
           ([fk_ConfigurationProtocole]
           ,[ColumnName]
           ,[TargetColumnType]
           ,[TargetColumnName])

select ID,'Name_Taxon',1,'Taxon' from [MigrationConfigurationProtocoleList] where ProtocoleName = 'Chiroptera capture'


INSERT INTO [dbo].[MigrationConfigurationProtocoleContent]
           ([fk_ConfigurationProtocole]
           ,[ColumnName]
           ,[TargetColumnType]
           ,[TargetColumnName])

select ID,'Name_Age',1,'Age' from [MigrationConfigurationProtocoleList] where ProtocoleName = 'Chiroptera capture'



INSERT INTO [dbo].[MigrationConfigurationProtocoleContent]
           ([fk_ConfigurationProtocole]
           ,[ColumnName]
           ,[TargetColumnType]
           ,[TargetColumnName])

select ID,'Name_maturity_female',1,'maturity_female' from [MigrationConfigurationProtocoleList] where ProtocoleName = 'Chiroptera capture'


INSERT INTO [dbo].[MigrationConfigurationProtocoleContent]
           ([fk_ConfigurationProtocole]
           ,[ColumnName]
           ,[TargetColumnType]
           ,[TargetColumnName])

select ID,'Name_Rep_Male',1,'reproductive_male_state' from [MigrationConfigurationProtocoleList] where ProtocoleName = 'Chiroptera capture'



INSERT INTO [dbo].[MigrationConfigurationProtocoleContent]
           ([fk_ConfigurationProtocole]
           ,[ColumnName]
           ,[TargetColumnType]
           ,[TargetColumnName])

select ID,'Name_Rep_Female',1,'reproductive_female_state' from [MigrationConfigurationProtocoleList] where ProtocoleName = 'Chiroptera capture'


INSERT INTO [dbo].[MigrationConfigurationProtocoleContent]
           ([fk_ConfigurationProtocole]
           ,[ColumnName]
           ,[TargetColumnType]
           ,[TargetColumnName])

select ID,'Name_Sex',1,'Sex' from [MigrationConfigurationProtocoleList] where ProtocoleName = 'Chiroptera capture'

INSERT INTO [dbo].[MigrationConfigurationProtocoleContent]
           ([fk_ConfigurationProtocole]
           ,[ColumnName]
           ,[TargetColumnType]
           ,[TargetColumnName])

select ID,'Name_Sex',1,'Sex' from [MigrationConfigurationProtocoleList] where ProtocoleName = 'Bird Biometry'


INSERT INTO [dbo].[MigrationConfigurationProtocoleContent]
           ([fk_ConfigurationProtocole]
           ,[ColumnName]
           ,[TargetColumnType]
           ,[TargetColumnName])

select ID,'Name_Age',1,'Age' from [MigrationConfigurationProtocoleList] where ProtocoleName = 'Bird Biometry'


INSERT INTO [dbo].[MigrationConfigurationProtocoleContent]
           ([fk_ConfigurationProtocole]
           ,[ColumnName]
           ,[TargetColumnType]
           ,[TargetColumnName])

select ID,'Name_Impact',1,'Impact' from [MigrationConfigurationProtocoleList] where ProtocoleName = 'Building and Activities'




INSERT INTO [dbo].[MigrationConfigurationProtocoleContent]
           ([fk_ConfigurationProtocole]
           ,[ColumnName]
           ,[TargetColumnType]
           ,[TargetColumnName])

select ID,'Name_Taxon',1,'Taxon' from [MigrationConfigurationProtocoleList] where ProtocoleName = 'Chiroptera detection'


INSERT INTO [dbo].[MigrationConfigurationProtocoleContent]
           ([fk_ConfigurationProtocole]
           ,[ColumnName]
           ,[TargetColumnType]
           ,[TargetColumnName])

select ID,'Name_activity_type',1,'activity_type' from [MigrationConfigurationProtocoleList] where ProtocoleName = 'Chiroptera detection'



INSERT INTO [dbo].[MigrationConfigurationProtocoleContent]
           ([fk_ConfigurationProtocole]
           ,[ColumnName]
           ,[TargetColumnType]
           ,[TargetColumnName])

select ID,'Name_Call_type',1,'Call_type' from [MigrationConfigurationProtocoleList] where ProtocoleName = 'Chiroptera detection'





INSERT INTO [dbo].[MigrationConfigurationProtocoleContent]
           ([fk_ConfigurationProtocole]
           ,[ColumnName]
           ,[TargetColumnType]
           ,[TargetColumnName])

select ID,'name_action_type',1,'action_type' from [MigrationConfigurationProtocoleList] where ProtocoleName = 'Station equipment'




INSERT INTO [dbo].[MigrationConfigurationProtocoleContent]
           ([fk_ConfigurationProtocole]
           ,[ColumnName]
           ,[TargetColumnType]
           ,[TargetColumnName])

select ID,'name_sensor_type',1,'sensor_type' from [MigrationConfigurationProtocoleList] where ProtocoleName = 'Station equipment'


INSERT INTO [dbo].[MigrationConfigurationProtocoleContent]
           ([fk_ConfigurationProtocole]
           ,[ColumnName]
           ,[TargetColumnType]
           ,[TargetColumnName])

select ID,'name_taxon',1,'taxon' from [MigrationConfigurationProtocoleList] where ProtocoleName = 'Release Group'


INSERT INTO [dbo].[MigrationConfigurationProtocoleContent]
           ([fk_ConfigurationProtocole]
           ,[ColumnName]
           ,[TargetColumnType]
           ,[TargetColumnName])

select ID,'name_Release_Method',1,'Release_Method' from [MigrationConfigurationProtocoleList] where ProtocoleName = 'Release Group'



 INSERT INTO [dbo].[MigrationConfigurationProtocoleContent] 
([fk_ConfigurationProtocole] 
,[ColumnName]
,[TargetColumnType]
,[TargetColumnName])
select ID,'Name_Record_type',1,'record_type' from [MigrationConfigurationProtocoleList] where ProtocoleName = 'Chiroptera detection'
GO


 INSERT INTO [dbo].[MigrationConfigurationProtocoleContent] 
([fk_ConfigurationProtocole] 
,[ColumnName]
,[TargetColumnType]
,[TargetColumnName])
select ID,'Name_Exposition',1,'exposition' from [MigrationConfigurationProtocoleList] where ProtocoleName = 'Phytosociology habitat'
GO


 INSERT INTO [dbo].[MigrationConfigurationProtocoleContent] 
([fk_ConfigurationProtocole] 
,[ColumnName]
,[TargetColumnType]
,[TargetColumnName])
select ID,'Name_Habitat2',1,'habitat2' from [MigrationConfigurationProtocoleList] where ProtocoleName = 'Phytosociology habitat'
GO


 INSERT INTO [dbo].[MigrationConfigurationProtocoleContent] 
([fk_ConfigurationProtocole] 
,[ColumnName]
,[TargetColumnType]
,[TargetColumnName])
select ID,'Name_Hydrography',1,'hydrography' from [MigrationConfigurationProtocoleList] where ProtocoleName = 'Phytosociology habitat'
GO


 INSERT INTO [dbo].[MigrationConfigurationProtocoleContent] 
([fk_ConfigurationProtocole] 
,[ColumnName]
,[TargetColumnType]
,[TargetColumnName])
select ID,'Name_micro_habitat',1,'micro_habitat' from [MigrationConfigurationProtocoleList] where ProtocoleName = 'Phytosociology habitat'
GO


 INSERT INTO [dbo].[MigrationConfigurationProtocoleContent] 
([fk_ConfigurationProtocole] 
,[ColumnName]
,[TargetColumnType]
,[TargetColumnName])
select ID,'Name_PH_class',1,'ph_class' from [MigrationConfigurationProtocoleList] where ProtocoleName = 'Phytosociology habitat'
GO


 INSERT INTO [dbo].[MigrationConfigurationProtocoleContent] 
([fk_ConfigurationProtocole] 
,[ColumnName]
,[TargetColumnType]
,[TargetColumnName])
select ID,'Name_Slope_Class',1,'slope_class' from [MigrationConfigurationProtocoleList] where ProtocoleName = 'Phytosociology habitat'
GO


 INSERT INTO [dbo].[MigrationConfigurationProtocoleContent] 
([fk_ConfigurationProtocole] 
,[ColumnName]
,[TargetColumnType]
,[TargetColumnName])
select ID,'Name_soil_texture',1,'soil_texture' from [MigrationConfigurationProtocoleList] where ProtocoleName = 'Phytosociology habitat'
GO


 INSERT INTO [dbo].[MigrationConfigurationProtocoleContent] 
([fk_ConfigurationProtocole] 
,[ColumnName]
,[TargetColumnType]
,[TargetColumnName])
select ID,'Name_Substrat',1,'substrat' from [MigrationConfigurationProtocoleList] where ProtocoleName = 'Phytosociology habitat'
GO


 INSERT INTO [dbo].[MigrationConfigurationProtocoleContent] 
([fk_ConfigurationProtocole] 
,[ColumnName]
,[TargetColumnType]
,[TargetColumnName])
select ID,'Name_Topography',1,'topography' from [MigrationConfigurationProtocoleList] where ProtocoleName = 'Phytosociology habitat'
GO


 INSERT INTO [dbo].[MigrationConfigurationProtocoleContent] 
([fk_ConfigurationProtocole] 
,[ColumnName]
,[TargetColumnType]
,[TargetColumnName])
select ID,'Name_vegetation_series',1,'vegetation_series' from [MigrationConfigurationProtocoleList] where ProtocoleName = 'Phytosociology habitat'
GO


 INSERT INTO [dbo].[MigrationConfigurationProtocoleContent] 
([fk_ConfigurationProtocole] 
,[ColumnName]
,[TargetColumnType]
,[TargetColumnName])
select ID,'Name_Global_Abondance_Dom',1,'global_abondance_dom' from [MigrationConfigurationProtocoleList] where ProtocoleName = 'Phytosociology releve'
GO


 INSERT INTO [dbo].[MigrationConfigurationProtocoleContent] 
([fk_ConfigurationProtocole] 
,[ColumnName]
,[TargetColumnType]
,[TargetColumnName])
select ID,'Name_Global_Sociability',1,'global_sociability' from [MigrationConfigurationProtocoleList] where ProtocoleName = 'Phytosociology releve'
GO


 INSERT INTO [dbo].[MigrationConfigurationProtocoleContent] 
([fk_ConfigurationProtocole] 
,[ColumnName]
,[TargetColumnType]
,[TargetColumnName])
select ID,'Name_Nb_Individuals',1,'nb_individuals' from [MigrationConfigurationProtocoleList] where ProtocoleName = 'Phytosociology releve'
GO


 INSERT INTO [dbo].[MigrationConfigurationProtocoleContent] 
([fk_ConfigurationProtocole] 
,[ColumnName]
,[TargetColumnType]
,[TargetColumnName])
select ID,'Name_Phenology_BBCH1',1,'phenology_BBCH1' from [MigrationConfigurationProtocoleList] where ProtocoleName = 'Phytosociology releve'
GO


 INSERT INTO [dbo].[MigrationConfigurationProtocoleContent] 
([fk_ConfigurationProtocole] 
,[ColumnName]
,[TargetColumnType]
,[TargetColumnName])
select ID,'Name_Phenology_BBCH2',1,'phenology_BBCH2' from [MigrationConfigurationProtocoleList] where ProtocoleName = 'Phytosociology releve'
GO


 INSERT INTO [dbo].[MigrationConfigurationProtocoleContent] 
([fk_ConfigurationProtocole] 
,[ColumnName]
,[TargetColumnType]
,[TargetColumnName])
select ID,'Name_Taxon',1,'taxon' from [MigrationConfigurationProtocoleList] where ProtocoleName = 'Phytosociology releve'
GO


 INSERT INTO [dbo].[MigrationConfigurationProtocoleContent] 
([fk_ConfigurationProtocole] 
,[ColumnName]
,[TargetColumnType]
,[TargetColumnName])
select ID,'Name_Observation_Tool',1,'observation_tool' from [MigrationConfigurationProtocoleList] where ProtocoleName = 'Sighting conditions'
GO


 INSERT INTO [dbo].[MigrationConfigurationProtocoleContent] 
([fk_ConfigurationProtocole] 
,[ColumnName]
,[TargetColumnType]
,[TargetColumnName])
select ID,'Name_Weather',1,'weather' from [MigrationConfigurationProtocoleList] where ProtocoleName = 'Sighting conditions'
GO


 INSERT INTO [dbo].[MigrationConfigurationProtocoleContent] 
([fk_ConfigurationProtocole] 
,[ColumnName]
,[TargetColumnType]
,[TargetColumnName])
select ID,'Name_Wind_Force',1,'wind_force' from [MigrationConfigurationProtocoleList] where ProtocoleName = 'Sighting conditions'
GO


 INSERT INTO [dbo].[MigrationConfigurationProtocoleContent] 
([fk_ConfigurationProtocole] 
,[ColumnName]
,[TargetColumnType]
,[TargetColumnName])
select ID,'Name_Flora_Main_Species_1',1,'flora_main_species_1' from [MigrationConfigurationProtocoleList] where ProtocoleName = 'Simplified habitat'
GO


 INSERT INTO [dbo].[MigrationConfigurationProtocoleContent] 
([fk_ConfigurationProtocole] 
,[ColumnName]
,[TargetColumnType]
,[TargetColumnName])
select ID,'Name_Flora_Main_Species_2',1,'flora_main_species_2' from [MigrationConfigurationProtocoleList] where ProtocoleName = 'Simplified habitat'
GO


 INSERT INTO [dbo].[MigrationConfigurationProtocoleContent] 
([fk_ConfigurationProtocole] 
,[ColumnName]
,[TargetColumnType]
,[TargetColumnName])
select ID,'Name_Flora_Main_Species_3',1,'flora_main_species_3' from [MigrationConfigurationProtocoleList] where ProtocoleName = 'Simplified habitat'
GO


 INSERT INTO [dbo].[MigrationConfigurationProtocoleContent] 
([fk_ConfigurationProtocole] 
,[ColumnName]
,[TargetColumnType]
,[TargetColumnName])
select ID,'Name_Geomorphology',1,'geomorphology' from [MigrationConfigurationProtocoleList] where ProtocoleName = 'Simplified habitat'
GO


 INSERT INTO [dbo].[MigrationConfigurationProtocoleContent] 
([fk_ConfigurationProtocole] 
,[ColumnName]
,[TargetColumnType]
,[TargetColumnName])
select ID,'Name_Habitat',1,'habitat' from [MigrationConfigurationProtocoleList] where ProtocoleName = 'Simplified habitat'
GO


 INSERT INTO [dbo].[MigrationConfigurationProtocoleContent] 
([fk_ConfigurationProtocole] 
,[ColumnName]
,[TargetColumnType]
,[TargetColumnName])
select ID,'Name_Habitat2',1,'habitat2' from [MigrationConfigurationProtocoleList] where ProtocoleName = 'Simplified habitat'
GO


 INSERT INTO [dbo].[MigrationConfigurationProtocoleContent] 
([fk_ConfigurationProtocole] 
,[ColumnName]
,[TargetColumnType]
,[TargetColumnName])
select ID,'Name_Density_bushes',1,'density_bushes' from [MigrationConfigurationProtocoleList] where ProtocoleName = 'Station description'
GO


 INSERT INTO [dbo].[MigrationConfigurationProtocoleContent] 
([fk_ConfigurationProtocole] 
,[ColumnName]
,[TargetColumnType]
,[TargetColumnName])
select ID,'Name_Density_herbs',1,'density_herbs' from [MigrationConfigurationProtocoleList] where ProtocoleName = 'Station description'
GO


 INSERT INTO [dbo].[MigrationConfigurationProtocoleContent] 
([fk_ConfigurationProtocole] 
,[ColumnName]
,[TargetColumnType]
,[TargetColumnName])
select ID,'Name_Density_trees',1,'density_trees' from [MigrationConfigurationProtocoleList] where ProtocoleName = 'Station description'
GO


 INSERT INTO [dbo].[MigrationConfigurationProtocoleContent] 
([fk_ConfigurationProtocole] 
,[ColumnName]
,[TargetColumnType]
,[TargetColumnName])
select ID,'Name_Exposition',1,'exposition' from [MigrationConfigurationProtocoleList] where ProtocoleName = 'Station description'
GO


 INSERT INTO [dbo].[MigrationConfigurationProtocoleContent] 
([fk_ConfigurationProtocole] 
,[ColumnName]
,[TargetColumnType]
,[TargetColumnName])
select ID,'Name_Flora_Main_Species_1',1,'flora_main_species_1' from [MigrationConfigurationProtocoleList] where ProtocoleName = 'Station description'
GO


 INSERT INTO [dbo].[MigrationConfigurationProtocoleContent] 
([fk_ConfigurationProtocole] 
,[ColumnName]
,[TargetColumnType]
,[TargetColumnName])
select ID,'Name_Flora_Main_Species_2',1,'flora_main_species_2' from [MigrationConfigurationProtocoleList] where ProtocoleName = 'Station description'
GO


 INSERT INTO [dbo].[MigrationConfigurationProtocoleContent] 
([fk_ConfigurationProtocole] 
,[ColumnName]
,[TargetColumnType]
,[TargetColumnName])
select ID,'Name_Flora_Main_Species_3',1,'flora_main_species_3' from [MigrationConfigurationProtocoleList] where ProtocoleName = 'Station description'
GO


 INSERT INTO [dbo].[MigrationConfigurationProtocoleContent] 
([fk_ConfigurationProtocole] 
,[ColumnName]
,[TargetColumnType]
,[TargetColumnName])
select ID,'Name_Greeness_bushes',1,'greeness_bushes' from [MigrationConfigurationProtocoleList] where ProtocoleName = 'Station description'
GO


 INSERT INTO [dbo].[MigrationConfigurationProtocoleContent] 
([fk_ConfigurationProtocole] 
,[ColumnName]
,[TargetColumnType]
,[TargetColumnName])
select ID,'Name_Greeness_herbs',1,'greeness_herbs' from [MigrationConfigurationProtocoleList] where ProtocoleName = 'Station description'
GO


 INSERT INTO [dbo].[MigrationConfigurationProtocoleContent] 
([fk_ConfigurationProtocole] 
,[ColumnName]
,[TargetColumnType]
,[TargetColumnName])
select ID,'Name_Greeness_trees',1,'greeness_trees' from [MigrationConfigurationProtocoleList] where ProtocoleName = 'Station description'
GO


 INSERT INTO [dbo].[MigrationConfigurationProtocoleContent] 
([fk_ConfigurationProtocole] 
,[ColumnName]
,[TargetColumnType]
,[TargetColumnName])
select ID,'Name_Moisture',1,'moisture' from [MigrationConfigurationProtocoleList] where ProtocoleName = 'Station description'
GO


 INSERT INTO [dbo].[MigrationConfigurationProtocoleContent] 
([fk_ConfigurationProtocole] 
,[ColumnName]
,[TargetColumnType]
,[TargetColumnName])
select ID,'Name_Slope_Class',1,'slope_class' from [MigrationConfigurationProtocoleList] where ProtocoleName = 'Station description'
GO


 INSERT INTO [dbo].[MigrationConfigurationProtocoleContent] 
([fk_ConfigurationProtocole] 
,[ColumnName]
,[TargetColumnType]
,[TargetColumnName])
select ID,'Name_Substrat',1,'substrat' from [MigrationConfigurationProtocoleList] where ProtocoleName = 'Station description'
GO


 INSERT INTO [dbo].[MigrationConfigurationProtocoleContent] 
([fk_ConfigurationProtocole] 
,[ColumnName]
,[TargetColumnType]
,[TargetColumnName])
select ID,'Name_Topography',1,'topography' from [MigrationConfigurationProtocoleList] where ProtocoleName = 'Station description'
GO


 INSERT INTO [dbo].[MigrationConfigurationProtocoleContent] 
([fk_ConfigurationProtocole] 
,[ColumnName]
,[TargetColumnType]
,[TargetColumnName])
select ID,'name_taxon',1,'taxon' from [MigrationConfigurationProtocoleList] where ProtocoleName = 'Track clue'
GO


 INSERT INTO [dbo].[MigrationConfigurationProtocoleContent] 
([fk_ConfigurationProtocole] 
,[ColumnName]
,[TargetColumnType]
,[TargetColumnName])
select ID,'Name_Track_clue',1,'track_clue' from [MigrationConfigurationProtocoleList] where ProtocoleName = 'Track clue'
GO


 INSERT INTO [dbo].[MigrationConfigurationProtocoleContent] 
([fk_ConfigurationProtocole] 
,[ColumnName]
,[TargetColumnType]
,[TargetColumnName])
select ID,'Name_Behaviour',1,'behaviour' from [MigrationConfigurationProtocoleList] where ProtocoleName = 'Vertebrate group'
GO


 INSERT INTO [dbo].[MigrationConfigurationProtocoleContent] 
([fk_ConfigurationProtocole] 
,[ColumnName]
,[TargetColumnType]
,[TargetColumnName])
select ID,'Name_Taxon',1,'taxon' from [MigrationConfigurationProtocoleList] where ProtocoleName = 'Vertebrate group'
GO

 INSERT INTO [dbo].[MigrationConfigurationProtocoleContent] 
([fk_ConfigurationProtocole] 
,[ColumnName]
,[TargetColumnType]
,[TargetColumnName])
select ID,'name_age',1,'age' from [MigrationConfigurationProtocoleList] where ProtocoleName = 'Vertebrate individual'
GO




 INSERT INTO [dbo].[MigrationConfigurationProtocoleContent] 
([fk_ConfigurationProtocole] 
,[ColumnName]
,[TargetColumnType]
,[TargetColumnName])
select ID,'Name_Behaviour',1,'behaviour' from [MigrationConfigurationProtocoleList] where ProtocoleName = 'Vertebrate individual'
GO


 INSERT INTO [dbo].[MigrationConfigurationProtocoleContent] 
([fk_ConfigurationProtocole] 
,[ColumnName]
,[TargetColumnType]
,[TargetColumnName])
select ID,'Name_Posture',1,'posture' from [MigrationConfigurationProtocoleList] where ProtocoleName = 'Vertebrate individual'
GO


 INSERT INTO [dbo].[MigrationConfigurationProtocoleContent] 
([fk_ConfigurationProtocole] 
,[ColumnName]
,[TargetColumnType]
,[TargetColumnName])
select ID,'name_sex',1,'sex' from [MigrationConfigurationProtocoleList] where ProtocoleName = 'Vertebrate individual'
GO


 INSERT INTO [dbo].[MigrationConfigurationProtocoleContent] 
([fk_ConfigurationProtocole] 
,[ColumnName]
,[TargetColumnType]
,[TargetColumnName])
select ID,'Name_Death_Reason',1,'death_reason' from [MigrationConfigurationProtocoleList] where ProtocoleName = 'Vertebrate individual death'
GO


 INSERT INTO [dbo].[MigrationConfigurationProtocoleContent] 
([fk_ConfigurationProtocole] 
,[ColumnName]
,[TargetColumnType]
,[TargetColumnName])
select ID,'Name_Death_Time',1,'death_time' from [MigrationConfigurationProtocoleList] where ProtocoleName = 'Vertebrate individual death'
GO


 INSERT INTO [dbo].[MigrationConfigurationProtocoleContent] 
([fk_ConfigurationProtocole] 
,[ColumnName]
,[TargetColumnType]
,[TargetColumnName])
select ID,'Name_Remains',1,'remains' from [MigrationConfigurationProtocoleList] where ProtocoleName = 'Vertebrate individual death'
GO


 INSERT INTO [dbo].[MigrationConfigurationProtocoleContent] 
([fk_ConfigurationProtocole] 
,[ColumnName]
,[TargetColumnType]
,[TargetColumnName])
select ID,'Name_Taxon',1,'taxon' from [MigrationConfigurationProtocoleList] where ProtocoleName = 'Vertebrate individual death'
GO


