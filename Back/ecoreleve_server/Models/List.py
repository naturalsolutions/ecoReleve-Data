from sqlalchemy import (and_,
 func,
 insert,
 select,
 exists,
 join,
 cast,
 not_,
 DATE)
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
    SensorDynPropValue
    )
from ..utils import Eval
import pandas as pd 
from collections import OrderedDict
from datetime import datetime

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
        result = DBSession.execute(fullQueryJoinOrdered).fetchall()
        data = []

        if getFieldWorkers:
            listID = list(map(lambda x: x['ID'],result))
            joinTable = join(Station_FieldWorker,User,Station_FieldWorker.FK_FieldWorker==User.id)
            query = select(
                [Station_FieldWorker.FK_Station,User.Login]).select_from(joinTable).where(
                Station_FieldWorker.FK_Station.in_(listID))
            FieldWorkers = DBSession.execute(query).fetchall()
        
            list_ = {}
            for x,y in FieldWorkers :
                list_.setdefault(x,[]).append(y)
            for row in result :
                row = OrderedDict(row)
                try :
                    row['FieldWorkers'] = list_[row['ID']]
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
            if obj['Column'] in ['FK_ProtocoleType','FK_FieldWorker','LastImported']:
                query = self.WhereInJoinTable(query,obj)
        return query


#--------------------------------------------------------------------------
class IndividualList(ListObjectWithDynProp):

    def __init__(self,frontModule) :
        super().__init__(Individual,frontModule)

    def WhereInJoinTable (self,query,criteriaObj) :
        query = super().WhereInJoinTable(query,criteriaObj)
        curProp = criteriaObj['Column']
        if curProp == 'LastImported':
            st = aliased(Individual)
            subSelect = select([Observation]).where(Observation.FK_Individual == Individual.ID)
            subSelect2 = select([cast(func.max(st.creationDate),DATE)]).where(st.Original_ID.like('TRACK_%'))
            query = query.where(and_(~exists(subSelect)
                ,and_(~exists(subSelect)
                    ,and_(Individual.Original_ID.like('TRACK_%'),Individual.creationDate >= subSelect2)
                    )
                ))
        return query

    def countQuery(self,criteria = None):
        query = super().countQuery(criteria)
        if len(list(filter(lambda x:'frequency'==x['Column'], criteria)))>0:
            print('IN COUNT FREQUENCY')
            query = self.whereInEquipementVHF(query,criteria)
        for obj in criteria :
            if obj['Column'] in ['LastImported']:
                query = self.WhereInJoinTable(query,obj)
        return query

    def GetFullQuery(self,searchInfo=None) :
        ''' return the full query to execute '''
        print('IN INDIV LIST ')
        if searchInfo is None or 'criteria' not in searchInfo:
            searchInfo['criteria'] = []
            print('********** NO Criteria ***************')
        joinTable = self.GetJoinTable(searchInfo)
        fullQueryJoin = select(self.selectable).select_from(joinTable)

        if len(list(filter(lambda x:'frequency'==x['Column'], searchInfo['criteria'])))>0:
            print('FREQUENCY ')
            fullQueryJoin = self.whereInEquipementVHF(fullQueryJoin,searchInfo['criteria'])

        for obj in searchInfo['criteria'] :
            fullQueryJoin = self.WhereInJoinTable(fullQueryJoin,obj)

        fullQueryJoinOrdered = self.OderByAndLimit(fullQueryJoin,searchInfo)
        return fullQueryJoinOrdered

    def whereInEquipementVHF(self,fullQueryJoin,criteria):
        print('in whereInEquipementVHF')
        freq = list(filter(lambda x:'frequency'==x['Column'], criteria))[0]['Value']
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

        fullQueryExist = fullQueryExist.where(vs.c['ValueInt']==freq)
        fullQueryJoin = fullQueryJoin.where(Individual.ID.in_(fullQueryExist))

        return fullQueryJoin


#--------------------------------------------------------------------------
class SensorList(ListObjectWithDynProp):

    def __init__(self,frontModule) :
        super().__init__(Sensor,frontModule)

    def WhereInJoinTable (self,query,criteriaObj) :
        query = super().WhereInJoinTable(query,criteriaObj)
        curProp = criteriaObj['Column']
        if 'available' in curProp.lower():
            print('IN SENSOR AVAILABLE ********************************')
            print(curProp)
            print(criteriaObj['Value'])
            date = datetime.strptime(criteriaObj['Value'].replace(' ',''),'%d/%m/%Y%H:%M:%S')
            # criteriaObj['Value'] = datetime.strptime(criteriaObj['Value'],'%d/%m/%Y')
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
            if obj['Column'] in ['is available']:
                query = self.WhereInJoinTable(query,obj)
        return query

    def GetFullQuery(self,searchInfo=None) :
        query = super().GetFullQuery(searchInfo)
        print(query)
        return query