from sqlalchemy import (and_,
 func,
 insert,
 select,
 exists,
 join,
 cast,
 not_,
 or_,
 DATE,
 case,
 literal_column,
 outerjoin)
from sqlalchemy.orm import aliased
from ..GenericObjets.ListObjectWithDynProp import ListObjectWithDynProp
from ..Models import (
    DBSession,
    Observation,
    Station,
    Station_FieldWorker,
    User,
    Individual,
    Base,
    Equipment,
    Sensor,
    SensorDynPropValue,
    Individual_Location
    )
from ..utils import Eval
import pandas as pd 
from collections import OrderedDict
from datetime import datetime
from ..utils.datetime import parse
from ..utils.generator import Generator


eval_ = Eval()

#--------------------------------------------------------------------------
class StationList(ListObjectWithDynProp):
    ''' this class extend ListObjectWithDynProp, it's used to filter stations '''
    def __init__(self,frontModule) :
        super().__init__(Station,frontModule)

    def WhereInJoinTable (self,query,criteriaObj) :
        ''' Override parent function to include management of Observation/Protocols and fieldWorkers '''
        query = super().WhereInJoinTable(query,criteriaObj)
        curProp = criteriaObj['Column']
        if curProp == 'FK_ProtocoleType':
            subSelect = select([Observation]
                ).where(
                and_(Station.ID== Observation.FK_Station
                    ,eval_.eval_binary_expr(Observation.__table__.c[curProp],criteriaObj['Operator'],criteriaObj['Value'])))
            query = query.where(exists(subSelect))

        if curProp == 'FK_Individual':
            subSelect = select([Observation]
                ).where(
                and_(Station.ID== Observation.FK_Station
                    ,eval_.eval_binary_expr(Observation.__table__.c[curProp],criteriaObj['Operator'],criteriaObj['Value'])))
            query = query.where(exists(subSelect))

        if curProp == 'FK_FieldWorker':
            subSelect = select([Station_FieldWorker]
                ).where(
                and_(Station.ID== Station_FieldWorker.FK_Station
                    ,eval_.eval_binary_expr(Station_FieldWorker.__table__.c[curProp],criteriaObj['Operator'],criteriaObj['Value'])))
            query = query.where(exists(subSelect))

        if curProp == 'LastImported':
            st = aliased(Station)
            subSelect = select([Observation]).where(Observation.FK_Station == Station.ID)
            subSelect2 = select([st]).where(cast(st.creationDate,DATE) > cast(Station.creationDate,DATE))
            query = query.where(and_(~exists(subSelect),~exists(subSelect2)))

        return query

    def GetFlatDataList(self,searchInfo=None,getFieldWorkers=True) :
        ''' Override parent function to include management of Observation/Protocols and fieldWorkers '''
        fullQueryJoinOrdered = self.GetFullQuery(searchInfo)
        result = self.ObjContext.execute(fullQueryJoinOrdered).fetchall()
        data = []

        if getFieldWorkers:
            listID = list(map(lambda x: x['ID'],result))
            joinTable = join(Station_FieldWorker,User,Station_FieldWorker.FK_FieldWorker==User.id)
            query = select(
                [Station_FieldWorker.FK_Station,User.Login]).select_from(joinTable).where(
                Station_FieldWorker.FK_Station.in_(listID))
            FieldWorkers = self.ObjContext.execute(query).fetchall()
        
            list_ = {}
            for x,y in FieldWorkers :
                list_.setdefault(x,[]).append(y)
            for row in result :
                row = OrderedDict(row)
                try :
                    row['FK_FieldWorker_FieldWorkers'] = list_[row['ID']]
                except:
                    pass
                data.append(row)
        else:
            for row in result :
                row = OrderedDict(row)
                data.append(row)
        return data

    def countQuery(self,criteria = None):
        query = super().countQuery(criteria)
        for obj in criteria :
            if obj['Column'] in ['FK_ProtocoleType','FK_FieldWorker','LastImported','FK_Individual']:
                query = self.WhereInJoinTable(query,obj)
        return query


#--------------------------------------------------------------------------
class IndividualList(ListObjectWithDynProp):

    def __init__(self,frontModule) :
        super().__init__(Individual,frontModule)

    def GetJoinTable (self,searchInfo) :
        StatusTable = Base.metadata.tables['IndividualStatus']
        EquipmentTable = Base.metadata.tables['IndividualEquipment']

        joinTable = super().GetJoinTable(searchInfo)
        
        joinTable = outerjoin(joinTable,StatusTable,StatusTable.c['FK_Individual'] == Individual.ID)

        self.selectable.append(StatusTable.c['Status_'].label('Status_'))

        joinTable = outerjoin(joinTable,EquipmentTable
            ,and_(Individual.ID == EquipmentTable.c['FK_Individual']
                ,or_(EquipmentTable.c['EndDate'] == None,EquipmentTable.c['EndDate'] >= func.now())))
        joinTable = outerjoin(joinTable,Sensor,Sensor.ID == EquipmentTable.c['FK_Sensor'])

        self.selectable.append(Sensor.UnicIdentifier.label('FK_Sensor'))
        return joinTable

    def WhereInJoinTable (self,query,criteriaObj) :
        query = super().WhereInJoinTable(query,criteriaObj)
        curProp = criteriaObj['Column']
        if curProp == 'LastImported':
            st = aliased(Individual)
            subSelect = select([Observation]).where(Observation.FK_Individual == Individual.ID)
            # subSelect2 = select([cast(func.max(st.creationDate),DATE)]).where(st.Original_ID.like('TRACK_%'))
            # query = query.where(and_(~exists(subSelect)
            #     # ,and_(~exists(subSelect)
            #         # ,and_(Individual.Original_ID.like('TRACK_%'),Individual.creationDate >= subSelect2)
            #         # )
            #     )
            query = query.where(and_(~exists(subSelect),Individual.Original_ID.like('TRACK_%')))

        if curProp == 'FK_Sensor':
            query = query.where(eval_.eval_binary_expr(Sensor.UnicIdentifier,criteriaObj['Operator'],criteriaObj['Value']))

        if curProp == 'Status_':
            StatusTable = Base.metadata.tables['IndividualStatus']
            query = query.where(eval_.eval_binary_expr(StatusTable.c['Status_'],criteriaObj['Operator'],criteriaObj['Value']))

        return query

    def countQuery(self,criteria = None):
        query = super().countQuery(criteria)
        # if len(list(filter(lambda x:'frequency'==x['Column'], criteria)))>0:
        #     query = self.whereInEquipementVHF(query,criteria)
        for obj in criteria :
            if obj['Column'] in ['LastImported']:
                query = self.WhereInJoinTable(query,obj)

            if obj['Column'] == 'Status_':
                StatusTable = Base.metadata.tables['IndividualStatus']
                existsQueryStatus = select([StatusTable.c['FK_Individual']]
                    ).where(and_(Individual.ID == StatusTable.c['FK_Individual']
                    ,eval_.eval_binary_expr(StatusTable.c['Status_'],obj['Operator'],obj['Value'])))
                query = query.where(exists(existsQueryStatus))

            if obj['Column'] == 'frequency':
                query = self.whereInEquipementVHF(query,criteria)

            if obj['Column'] == 'FK_Sensor':
                query = self.whereInEquipement(query,criteria)

        return query

    def GetFullQuery(self,searchInfo=None) :
        ''' return the full query to execute '''
        if searchInfo is None or 'criteria' not in searchInfo:
            searchInfo['criteria'] = []

        joinTable = self.GetJoinTable(searchInfo)
        fullQueryJoin = select(self.selectable).select_from(joinTable)

        if len(list(filter(lambda x:'frequency'==x['Column'], searchInfo['criteria'])))>0:
            fullQueryJoin = self.whereInEquipementVHF(fullQueryJoin,searchInfo['criteria'])

        for obj in searchInfo['criteria'] :
            fullQueryJoin = self.WhereInJoinTable(fullQueryJoin,obj)

        fullQueryJoinOrdered = self.OderByAndLimit(fullQueryJoin,searchInfo)
        return fullQueryJoinOrdered

    def whereInEquipementVHF(self,fullQueryJoin,criteria):
        freqObj = list(filter(lambda x:'frequency'==x['Column'], criteria))[0]
        freq = freqObj['Value']
        e2 = aliased(Equipment)
        vs = Base.metadata.tables['SensorDynPropValuesNow']
        joinTableExist = join(Equipment,Sensor,Equipment.FK_Sensor==Sensor.ID)
        joinTableExist = join(joinTableExist,vs,vs.c['FK_Sensor']==Sensor.ID)

        queryExist = select([e2]).where(
            and_(Equipment.FK_Individual==e2.FK_Individual
                ,and_(e2.StartDate>Equipment.StartDate,e2.StartDate<func.now())))

        fullQueryExist = select([Equipment.FK_Individual]).select_from(joinTableExist)
        fullQueryExist = fullQueryExist.where(and_(~exists(queryExist)
            ,and_(vs.c['FK_SensorDynProp']==9,and_(Sensor.FK_SensorType==4,and_(Equipment.Deploy==1,
                and_(Equipment.StartDate<func.now(),Equipment.FK_Individual==Individual.ID))))))

        fullQueryExist = fullQueryExist.where(eval_.eval_binary_expr(vs.c['ValueInt'],freqObj['Operator'],freq))
        fullQueryJoin = fullQueryJoin.where(Individual.ID.in_(fullQueryExist))

        return fullQueryJoin

    def whereInEquipement(self,fullQueryJoin,criteria):
        sensorObj = list(filter(lambda x:'FK_Sensor'==x['Column'], criteria))[0]
        sensor = sensorObj['Value']

        table = Base.metadata.tables['IndividualEquipment']
        joinTable = outerjoin(table,Sensor, table.c['FK_Sensor'] == Sensor.ID)

        subSelect = select([table.c['FK_Individual']]
            ).select_from(joinTable).where(
            and_(Individual.ID== table.c['FK_Individual']
                ,and_(eval_.eval_binary_expr(Sensor.UnicIdentifier,sensorObj['Operator'],sensor)
                    ,or_(table.c['EndDate'] >= func.now(),table.c['EndDate'] == None))
                    ))
        fullQueryJoin = fullQueryJoin.where(exists(subSelect))

        return fullQueryJoin

#--------------------------------------------------------------------------
class IndivLocationList(Generator):

    def __init__(self,table,SessionMaker,id_=None):
        joinTable= join(Individual_Location, Sensor
            , Individual_Location.FK_Sensor == Sensor.ID)
        regionTable = Base.metadata.tables['Region']
        joinTable = outerjoin(joinTable,regionTable,Individual_Location.FK_Region == regionTable.c['ID'])
        # Use select statment as ORM Table 
        IndivLoc = select([Individual_Location,Individual_Location.date_timestamp,Sensor.UnicIdentifier,regionTable.c['Region']]
            ).select_from(joinTable).where(Individual_Location.FK_Individual == id_).cte()

        super().__init__(IndivLoc,SessionMaker)

#--------------------------------------------------------------------------
class SensorList(ListObjectWithDynProp):

    def __init__(self,frontModule) :
        super().__init__(Sensor,frontModule)

    def WhereInJoinTable (self,query,criteriaObj) :
        query = super().WhereInJoinTable(query,criteriaObj)
        curProp = criteriaObj['Column']
        if 'available' in curProp.lower():
            date = criteriaObj['Value']
            try:
                date = parse(date.replace(' ',''))
            except:
                pass
            s2 = aliased(Sensor)
            e = aliased(Equipment)
            e2 = aliased(Equipment)

            subQueryEquip = select([e2]).where(
                and_(e.FK_Sensor==e2.FK_Sensor,
                    and_(e.StartDate<e2.StartDate,e2.StartDate<=date)))

            querySensor = select([e]).where(
                and_(e.StartDate<=date,
                    and_(e.Deploy==0,
                        and_(Sensor.ID==e.FK_Sensor,not_(exists(subQueryEquip)))
                        )
                    ))
            if criteriaObj['Operator'].lower() != 'is not':
                query = query.where(exists(querySensor))
            else:
                query = query.where(not_(exists(querySensor)))
        return query

    def countQuery(self,criteria = None):
        query = super().countQuery(criteria)
        for obj in criteria :
            if 'available' in obj['Column']:
                query = self.WhereInJoinTable(query,obj)
        return query

    # def GetFullQuery(self,searchInfo=None) :
    #     query = super().GetFullQuery(searchInfo)
    #     return query