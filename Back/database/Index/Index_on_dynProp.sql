CREATE INDEX IX_IndividualDynPropValue_Fk_Individual_autres ON [IndividualDynPropValue]
([FK_Individual],[FK_IndividualDynProp],[StartDate]
)

CREATE INDEX IX_ObservationDynPropValue_Fk_Observation_autres ON [ObservationDynPropValue]
([FK_Observation],[FK_ObservationDynProp],[StartDate]
)

CREATE INDEX IX_StationDynPropValue_Fk_Station_autres ON [StationDynPropValue]
([FK_Station],[FK_StationDynProp],[StartDate]
)

CREATE INDEX IX_MonitoredSiteDynPropValue_Fk_MonitoredSite_autres ON [MonitoredSiteDynPropValue]
([FK_MonitoredSite],[FK_MonitoredSiteDynProp],[StartDate]
)