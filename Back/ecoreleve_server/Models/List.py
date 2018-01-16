from sqlalchemy import (
    and_,
    func,
    select,
    exists,
    join,
    cast,
    not_,
    or_,
    DATE,
    outerjoin)
from sqlalchemy.orm import aliased
from ..GenericObjets.ListObjectWithDynProp import ListObjectWithDynProp
from ..Models import (
    Observation,
    Station,
    Station_FieldWorker,
    User,
    Individual,
    Base,
    Equipment,
    Sensor,
    SensorType,
    MonitoredSite,
    Import,
    ArgosEngineering,
    ArgosGps,
    GPX,
    Gsm,
    GsmEngineering,
    Rfid
)
from ..utils import Eval
from collections import OrderedDict
from datetime import datetime
from ..utils.datetime import parse
from ..utils.generator import Generator
from sqlalchemy.sql.expression import union_all


eval_ = Eval()


class StationList(ListObjectWithDynProp):
    ''' this class extend ListObjectWithDynProp, it's used to filter stations '''

    def __init__(self, frontModule, typeObj=None, startDate=None,
                 history=False, historyView=None):
        super().__init__(Station, frontModule, startDate)

    def WhereInJoinTable(self, query, criteriaObj):
        ''' Override parent function to include management of Observation/Protocols and fieldWorkers '''
        query = super().WhereInJoinTable(query, criteriaObj)
        curProp = criteriaObj['Column']

        if curProp == 'FK_ProtocoleType':
            o = aliased(Observation)
            subSelect = select([o.ID]
                               ).where(
                and_(Station.ID == o.FK_Station,
                     eval_.eval_binary_expr(o.FK_ProtocoleType, criteriaObj['Operator'],
                                            criteriaObj['Value'])))
            query = query.where(exists(subSelect))

        if curProp == 'Species':
            obsValTable = Base.metadata.tables['ObservationDynPropValuesNow']
            o2 = aliased(Observation)
            s2 = aliased(Station)

            joinStaObs = join(s2, o2, s2.ID == o2.FK_Station)

            operator = criteriaObj['Operator']
            if 'not' in criteriaObj['Operator']:
                operator = operator.replace('not ', '').replace(' not', '')

            existInd = select([Individual.ID]
                              ).where(and_(o2.FK_Individual == Individual.ID,
                                           eval_.eval_binary_expr(Individual.Species, operator, criteriaObj['Value']))
                                      )

            existObs = select([obsValTable.c['ID']]
                              ).where(and_(obsValTable.c['FK_Observation'] == o2.ID,
                                           and_(or_(obsValTable.c['Name'].like('%taxon'), obsValTable.c['Name'].like('%species%')),
                                                eval_.eval_binary_expr(obsValTable.c['ValueString'], operator, criteriaObj['Value']))
                                           )
                                      )

            selectCommon = select([s2.ID]).select_from(joinStaObs)

            selectInd = selectCommon.where(exists(existInd))
            selectObs = selectCommon.where(exists(existObs))

            unionQuery = union_all(selectInd, selectObs)
            if 'not' in criteriaObj['Operator']:
                query = query.where(~Station.ID.in_(unionQuery))
            else:
                query = query.where(Station.ID.in_(unionQuery))

        if curProp == 'FK_Individual':
            if criteriaObj['Operator'].lower() in ['is null', 'is not null']:
                subSelect = select([Observation]).where(
                    and_(Station.ID == Observation.FK_Station,
                         Observation.__table__.c[curProp] != None)
                )
                if criteriaObj['Operator'].lower() == 'is':
                    query = query.where(~exists(subSelect))
                else:
                    query = query.where(exists(subSelect))

            else:
                subSelect = select([Observation]
                                   ).where(
                    and_(Station.ID == Observation.FK_Station,
                         eval_.eval_binary_expr(Observation.__table__.c[curProp],
                                                criteriaObj['Operator'],
                                                criteriaObj['Value'])))
                query = query.where(exists(subSelect))

        if curProp == 'FK_FieldWorker':
            joinTable = join(Station_FieldWorker, User, Station_FieldWorker.FK_FieldWorker == User.id)
            subSelect = select([Station_FieldWorker]
                               ).select_from(joinTable).where(
                and_(Station.ID == Station_FieldWorker.FK_Station,
                     eval_.eval_binary_expr(User.__table__.c['Login'],
                                            criteriaObj['Operator'],
                                            criteriaObj['Value'])))
            query = query.where(exists(subSelect))

        if curProp == 'LastImported':
            st = aliased(Station)
            subSelect2 = select([st]).where(
                cast(st.creationDate, DATE) > cast(Station.creationDate, DATE))
            query = query.where(~exists(subSelect2))

        return query

    def GetFlatDataList(self, searchInfo=None, getFieldWorkers=True):
        ''' Override parent function to include
        management of Observation/Protocols and fieldWorkers '''
        fullQueryJoinOrdered = self.GetFullQuery(searchInfo)
        result = self.session.execute(fullQueryJoinOrdered).fetchall()
        data = []

        for row in result:
            row = OrderedDict(row)
            data.append(row)
        return data

    def countQuery(self, criteria=None):
        query = super().countQuery(criteria)
        for obj in criteria:
            if obj['Column'] in ['FK_ProtocoleType', 'FK_FieldWorker',
                                 'LastImported', 'FK_Individual', 'Species']:
                query = self.WhereInJoinTable(query, obj)
        return query


class IndividualList(ListObjectWithDynProp):

    def __init__(self, frontModule, typeObj=None, startDate=None,
                 history=False, historyView=None):
        super().__init__(Individual, frontModule, typeObj=typeObj,
                         startDate=startDate, history=history)

    def GetJoinTable(self, searchInfo):
        startDate = datetime.now()
        if self.startDate:
            startDate = self.startDate

        StatusTable = Base.metadata.tables['IndividualStatus']
        EquipmentTable = Base.metadata.tables['IndividualEquipment']

        joinTable = super().GetJoinTable(searchInfo)

        releaseFilter = list(
            filter(lambda x: x['Column'] == 'LastImported', searchInfo['criteria']))
        if len(releaseFilter) > 0:
            return joinTable

        joinTable = outerjoin(joinTable, StatusTable, StatusTable.c[
                              'FK_Individual'] == Individual.ID)

        self.selectable.append(StatusTable.c['Status_'].label('Status_'))

        joinTable = outerjoin(joinTable, EquipmentTable,
                              and_(Individual.ID == EquipmentTable.c['FK_Individual'],
                                   and_(or_(EquipmentTable.c['EndDate'] >= startDate,
                                            EquipmentTable.c['EndDate'] == None),
                                        EquipmentTable.c['StartDate'] <= startDate)))

        joinTable = outerjoin(joinTable, Sensor,
                              Sensor.ID == EquipmentTable.c['FK_Sensor'])
        joinTable = outerjoin(joinTable, SensorType,
                              Sensor.FK_SensorType == SensorType.ID)

        self.selectable.append(Sensor.UnicIdentifier.label('FK_Sensor'))
        self.selectable.append(SensorType.Name.label('FK_SensorType'))
        self.selectable.append(Sensor.Model.label('FK_SensorModel'))

        return joinTable

    def WhereInJoinTable(self, query, criteriaObj):
        query = super().WhereInJoinTable(query, criteriaObj)
        curProp = criteriaObj['Column']
        if curProp == 'LastImported':
            subSelect = select([Observation]).where(
                Observation.FK_Individual == Individual.ID)
            query = query.where(
                and_(~exists(subSelect), Individual.Original_ID.like('TRACK_%')))

        if curProp == 'FK_Sensor':
            if self.history:
                query = self.whereInEquipement(query, [criteriaObj])
            else:
                query = query.where(eval_.eval_binary_expr(
                    Sensor.UnicIdentifier, criteriaObj['Operator'], criteriaObj['Value']))

        if curProp == 'FK_SensorType':
            if self.history:
                query = self.whereInEquipement(query, [criteriaObj])
            else:
                query = query.where(eval_.eval_binary_expr(
                    Sensor.FK_SensorType, criteriaObj['Operator'], criteriaObj['Value']))

        if curProp == 'Status_':
            StatusTable = Base.metadata.tables['IndividualStatus']
            query = query.where(eval_.eval_binary_expr(
                StatusTable.c['Status_'], criteriaObj['Operator'], criteriaObj['Value']))

        return query

    def countQuery(self, criteria=None):
        query = super().countQuery(criteria)

        for obj in criteria:
            if obj['Column'] in ['LastImported']:
                query = self.WhereInJoinTable(query, obj)

            if obj['Column'] == 'Status_':
                StatusTable = Base.metadata.tables['IndividualStatus']
                existsQueryStatus = select([StatusTable.c['FK_Individual']]
                                           ).where(and_(Individual.ID == StatusTable.c['FK_Individual'],
                                                        eval_.eval_binary_expr(StatusTable.c['Status_'],
                                                                               obj['Operator'],
                                                                               obj['Value'])))
                query = query.where(exists(existsQueryStatus))

            if obj['Column'] == 'frequency':
                query = self.whereInEquipementVHF(query, criteria)

            if obj['Column'] in ['FK_Sensor', 'FK_SensorType']:
                query = self.whereInEquipement(query, criteria)

        return query

    def GetFullQuery(self, searchInfo=None):
        ''' return the full query to execute '''
        if searchInfo is None or 'criteria' not in searchInfo:
            searchInfo['criteria'] = []

        self.addObjectTypeParams(searchInfo)
        joinTable = self.GetJoinTable(searchInfo)
        fullQueryJoin = select(self.selectable).select_from(joinTable)

        if len(list(filter(lambda x: 'frequency' == x['Column'], searchInfo['criteria']))) > 0:
            fullQueryJoin = self.whereInEquipementVHF(
                fullQueryJoin, searchInfo['criteria'])

        for obj in searchInfo['criteria']:
            fullQueryJoin = self.WhereInJoinTable(fullQueryJoin, obj)

        fullQueryJoinOrdered = self.OderByAndLimit(fullQueryJoin, searchInfo)
        return fullQueryJoinOrdered

    def whereInEquipementVHF(self, fullQueryJoin, criteria):
        startDate = datetime.now()

        if self.startDate:
            startDate = self.startDate

        freqObj = list(filter(lambda x: 'frequency' ==
                              x['Column'], criteria))[0]
        freq = freqObj['Value']
        e2 = aliased(Equipment)
        vs = Base.metadata.tables['SensorDynPropValuesNow']
        joinTableExist = join(
            Equipment, Sensor, Equipment.FK_Sensor == Sensor.ID)
        joinTableExist = join(joinTableExist, vs, vs.c[
                              'FK_Sensor'] == Sensor.ID)

        if self.history:
            queryExist = select([e2]).where(
                Equipment.FK_Individual == e2.FK_Individual)
            fullQueryExist = select([Equipment.FK_Individual]).select_from(
                joinTableExist).where(Equipment.FK_Individual == Individual.ID)
            fullQueryExist = fullQueryExist.where(
                and_(vs.c['FK_SensorDynProp'] == 9, Sensor.FK_SensorType == 4))

        else:
            queryExist = select([e2]).where(
                and_(Equipment.FK_Individual == e2.FK_Individual,
                     and_(e2.StartDate > Equipment.StartDate, e2.StartDate < startDate)))

            fullQueryExist = select(
                [Equipment.FK_Individual]).select_from(joinTableExist)
            fullQueryExist = fullQueryExist.where(and_(
                ~exists(queryExist), and_(vs.c['FK_SensorDynProp'] == 9,
                                          and_(Sensor.FK_SensorType == 4,
                                               and_(Equipment.Deploy == 1,
                                                    and_(Equipment.StartDate < startDate,
                                                         Equipment.FK_Individual == Individual.ID)
                                                    )))))

        if freqObj['Operator'].lower() in ['is null'] and freqObj['Value'].lower() == 'null':
            fullQueryJoin = fullQueryJoin.where(~exists(fullQueryExist))
        else:
            fullQueryExist = fullQueryExist.where(eval_.eval_binary_expr(
                vs.c['ValueInt'], freqObj['Operator'], freq))
            fullQueryJoin = fullQueryJoin.where(exists(fullQueryExist))

        return fullQueryJoin

    def whereInEquipement(self, fullQueryJoin, criteria):
        sensorObj = list(
            filter(lambda x: x['Column'] in ['FK_Sensor', 'FK_SensorType'], criteria))[0]
        sensor = sensorObj['Value']
        criteria_column =  sensorObj['Column']

        if criteria_column == 'FK_Sensor':
            criteria_column = Sensor.UnicIdentifier
        if criteria_column == 'FK_SensorType':
            criteria_column = Sensor.FK_SensorType

        table = Base.metadata.tables['IndividualEquipment']
        joinTable = outerjoin(table, Sensor, table.c['FK_Sensor'] == Sensor.ID)
        joinTable = outerjoin(joinTable, SensorType, Sensor.FK_SensorType == SensorType.ID)
        startDate = datetime.now()

        if self.startDate:
            startDate = self.startDate

        subSelect = select([table.c['FK_Individual']]
                           ).select_from(joinTable
                                         ).where(
            Individual.ID == table.c[
                'FK_Individual']
        ).where(table.c['StartDate'] <= startDate)

        if sensorObj['Operator'].lower() in ['is null', 'is not null']:
            if not self.history:
                subSelect = subSelect.where(
                    or_(table.c['EndDate'] >= startDate, table.c['EndDate'] == None))

        else:
            subSelect = subSelect.where(eval_.eval_binary_expr(
                criteria_column, sensorObj['Operator'], sensor))
            if not self.history:
                subSelect = subSelect.where(
                    or_(table.c['EndDate'] >= startDate, table.c['EndDate'] == None))

        if 'is not' in sensorObj['Operator'].lower():
            if sensorObj['Operator'].lower() == 'is not null':
                fullQueryJoin = fullQueryJoin.where(exists(subSelect))
            else:
                fullQueryJoin = fullQueryJoin.where(~exists(subSelect))
        else:
            if sensorObj['Operator'].lower() == 'is null':
                fullQueryJoin = fullQueryJoin.where(~exists(subSelect))
            else:
                fullQueryJoin = fullQueryJoin.where(exists(subSelect))
        return fullQueryJoin


class IndivLocationList(Generator):

    def __init__(self, SessionMaker, id_=None):
        allLocIndiv = Base.metadata.tables['allIndivLocationWithStations']
        IndivLoc = select(allLocIndiv.c
                          ).where(
            allLocIndiv.c['FK_Individual'] == id_
        ).cte()
        super().__init__(IndivLoc, SessionMaker)


class SensorList(ListObjectWithDynProp):

    def __init__(self, frontModule, typeObj=None, startDate=None,
                 history=False, historyView=None):
        super().__init__(Sensor, frontModule, startDate)

    def GetJoinTable(self, searchInfo):
        curEquipmentTable = Base.metadata.tables['CurrentlySensorEquiped']
        MonitoredSiteTable = Base.metadata.tables['MonitoredSite']
        joinTable = super().GetJoinTable(searchInfo)

        joinTable = outerjoin(joinTable,
                              curEquipmentTable,
                              curEquipmentTable.c['FK_Sensor'] == Sensor.ID)

        joinTable = outerjoin(
            joinTable,
            MonitoredSite,
            MonitoredSiteTable.c['ID'] == curEquipmentTable.c[
                'FK_MonitoredSite'])

        self.selectable.append(MonitoredSiteTable.c[
                               'Name'].label('FK_MonitoredSiteName'))
        self.selectable.append(curEquipmentTable.c[
                               'FK_Individual'].label('FK_Individual'))

        return joinTable

    def WhereInJoinTable(self, query, criteriaObj):
        query = super().WhereInJoinTable(query, criteriaObj)
        curProp = criteriaObj['Column']
        if 'available' in curProp.lower():
            date = criteriaObj['Value']
            try:
                date = parse(date.replace(' ', ''))
            except:
                pass
            e = aliased(Equipment)
            e2 = aliased(Equipment)
            e3 = aliased(Equipment)

            subQueryEquip = select([e2]).where(
                and_(e.FK_Sensor == e2.FK_Sensor,
                     and_(e.StartDate < e2.StartDate, e2.StartDate <= date)))

            querySensor = select([e]).where(
                and_(e.StartDate <= date,
                     and_(e.Deploy == 0,
                          and_(Sensor.ID == e.FK_Sensor,
                               not_(exists(subQueryEquip)))
                          )
                     ))

            subQueryNotEquip = select([e3]).where(
                and_(Sensor.ID == e3.FK_Sensor,
                     e3.StartDate < date))

            if criteriaObj['Operator'].lower() != 'is not':
                query = query.where(or_(exists(querySensor),
                                        not_(exists(subQueryNotEquip))))
            else:
                query = query.where(or_(not_(exists(querySensor)),
                                        not_(exists(subQueryNotEquip))))

        if 'FK_MonitoredSiteName' == curProp:
            MonitoredSiteTable = Base.metadata.tables['MonitoredSite']
            val = criteriaObj['Value']
            query = query.where(eval_.eval_binary_expr(
                MonitoredSiteTable.c['Name'], criteriaObj['Operator'], val))

        if 'FK_Individual' == curProp:
            curEquipmentTable = Base.metadata.tables['CurrentlySensorEquiped']
            val = criteriaObj['Value']
            query = query.where(eval_.eval_binary_expr(
                curEquipmentTable.c['FK_Individual'],
                criteriaObj['Operator'],
                val))
        return query

    def countQuery(self, criteria=None):
        query = super().countQuery(criteria)

        curEquipmentTable = Base.metadata.tables['CurrentlySensorEquiped']
        MonitoredSiteTable = Base.metadata.tables['MonitoredSite']
        joinTable = outerjoin(
            curEquipmentTable,
            MonitoredSite,
            MonitoredSiteTable.c['ID'] == curEquipmentTable.c['FK_MonitoredSite'])

        for obj in criteria:
            if 'available' in obj['Column']:
                query = self.WhereInJoinTable(query, obj)

            if (obj['Column'] in ['FK_MonitoredSiteName', 'FK_Individual']
                    and obj['Operator'] not in ['is null', 'is not null']):

                queryExist = select(curEquipmentTable.c
                                    ).select_from(joinTable
                                                  ).where(Sensor.ID == curEquipmentTable.c['FK_Sensor'])

                if obj['Column'] == 'FK_MonitoredSiteName':
                    queryExist = queryExist.where(eval_.eval_binary_expr(
                        MonitoredSiteTable.c['Name'],
                        obj['Operator'],
                        obj['Value']))

                if obj['Column'] == 'FK_Individual':
                    queryExist = queryExist.where(eval_.eval_binary_expr(
                        curEquipmentTable.c['FK_Individual'],
                        obj['Operator'],
                        obj['Value']))
                query = query.where(exists(queryExist))

            if (obj['Column'] in ['FK_MonitoredSiteName', 'FK_Individual']
                    and obj['Operator'] in ['is null', 'is not null']):
                queryExist = select(curEquipmentTable.c
                                    ).select_from(joinTable
                                                  ).where(Sensor.ID == curEquipmentTable.c['FK_Sensor'])

                if obj['Column'] == 'FK_Individual':
                    queryExist = queryExist.where(
                        and_(Sensor.ID == curEquipmentTable.c['FK_Sensor'],
                             curEquipmentTable.c['FK_Individual'] != None))

                if obj['Column'] == 'FK_MonitoredSiteName':
                    queryExist = queryExist.where(
                        and_(Sensor.ID == curEquipmentTable.c['FK_Sensor'],
                             curEquipmentTable.c['FK_MonitoredSite'] != None))

                if 'not' in obj['Operator']:
                    query = query.where(exists(queryExist))
                else:
                    query = query.where(not_(exists(queryExist)))
        return query


class MonitoredSiteList(ListObjectWithDynProp):

    def __init__(self, frontModule, typeObj=None,
                 View=None, startDate=None, history=False):
        if not View:
            View = Base.metadata.tables['MonitoredSitePositionsNow']
        super().__init__(MonitoredSite, frontModule, typeObj=typeObj, View=View)

    def GetJoinTable(self, searchInfo):
        EquipmentTable = Base.metadata.tables['MonitoredSiteEquipment']

        joinTable = super().GetJoinTable(searchInfo)

        joinTable = outerjoin(
            joinTable,
            EquipmentTable,
            and_(MonitoredSite.ID == EquipmentTable.c['FK_MonitoredSite'],
                 or_(EquipmentTable.c['EndDate'] == None,
                     EquipmentTable.c['EndDate'] >= func.now())))

        joinTable = outerjoin(
            joinTable,
            Sensor,
            Sensor.ID == EquipmentTable.c['FK_Sensor'])
        joinTable = outerjoin(
            joinTable,
            SensorType,
            Sensor.FK_SensorType == SensorType.ID)

        self.selectable.append(Sensor.UnicIdentifier.label('FK_Sensor'))
        self.selectable.append(SensorType.Name.label('FK_SensorType'))
        self.selectable.append(Sensor.Model.label('FK_SensorModel'))

        return joinTable

    def WhereInJoinTable(self, query, criteriaObj):
        query = super().WhereInJoinTable(query, criteriaObj)
        curProp = criteriaObj['Column']

        if curProp == 'FK_Sensor':
            query = query.where(eval_.eval_binary_expr(
                Sensor.UnicIdentifier,
                criteriaObj['Operator'],
                criteriaObj['Value']))

        return query

    def countQuery(self, criteria=None):
        query = super().countQuery(criteria)
        for obj in criteria:
            if obj['Column'] == 'FK_Sensor':
                query = self.whereInEquipement(query, criteria)

        return query

    def whereInEquipement(self, fullQueryJoin, criteria):
        sensorObj = list(
            filter(lambda x: 'FK_Sensor' == x['Column'], criteria))[0]
        sensor = sensorObj['Value']

        table = Base.metadata.tables['MonitoredSiteEquipment']
        joinTable = outerjoin(table, Sensor, table.c['FK_Sensor'] == Sensor.ID)

        if (sensorObj['Operator'].lower() in ['is', 'is not']
                and sensorObj['Value'].lower() == 'null'):

            subSelect = select([table.c['FK_MonitoredSite']]
                               ).select_from(joinTable).where(
                and_(MonitoredSite.ID == table.c['FK_MonitoredSite'],
                     or_(table.c['EndDate'] >= func.now(),
                         table.c['EndDate'] == None)
                     ))
            if sensorObj['Operator'].lower() == 'is':
                fullQueryJoin = fullQueryJoin.where(~exists(subSelect))
            else:
                fullQueryJoin = fullQueryJoin.where(exists(subSelect))
        else:
            subSelect = select([table.c['FK_MonitoredSite']]
                               ).select_from(joinTable).where(
                and_(MonitoredSite.ID == table.c['FK_MonitoredSite'],
                     and_(eval_.eval_binary_expr(Sensor.UnicIdentifier,
                                                 sensorObj['Operator'],
                                                 sensor),
                          or_(table.c['EndDate'] >= func.now(),
                              table.c['EndDate'] == None))
                     ))
            fullQueryJoin = fullQueryJoin.where(exists(subSelect))
        return fullQueryJoin


class ImportList(Generator):

    def __init__(self, SessionMaker):

        joinTable = join(Import, User, Import.FK_User == User.id)

        tablecImprt = select([Import,
                              User.fullname.label('Login'),

                              ]).select_from(joinTable
                                             )
        tablecImprt = tablecImprt.cte()
        super().__init__(tablecImprt, SessionMaker)
