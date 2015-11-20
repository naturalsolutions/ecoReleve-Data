CREATE INDEX IX_Observation_FK_Individual ON Observation (FK_Individual)

CREATE INDEX IX_Individual_Location_Fk_Individual on [dbo].[Individual_Location](Fk_Individual) INCLUDE ([DATE])

CREATE INDEX IX_Individual_Location_DATE_fk_individual on [dbo].[Individual_Location](DATE,Fk_Individual) 