from sqlalchemy import (and_,
 func,
 insert,
 select,
 exists,
 join)
from ..GenericObjets.ListObjectWithDynProp import ListObjectWithDynProp
from ..Models import (
    DBSession,
    Observation,
    Station,
    Station_FieldWorker,
    User
    )
from ecoreleve_server.utils import Eval
import pandas as pd 
from collections import OrderedDict


eval_ = Eval()

#--------------------------------------------------------------------------
class StationList(ListObjectWithDynProp):

    def __init__(self,frontModule) :
        super().__init__(Station,frontModule)

    # def GetJoinTable (self) :
    #     joinTable = super().GetJoinTable()

    def WhereInJoinTable (self,query,criteriaObj) :
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

        return query

    def GetFlatDataList(self,searchInfo=None) :
        fullQueryJoinOrdered = self.GetFullQuery(searchInfo)
        result = DBSession.execute(fullQueryJoinOrdered).fetchall()

        listID = list(map(lambda x: x['ID'],result))
        joinTable = join(Station_FieldWorker,User,Station_FieldWorker.FK_FieldWorker==User.id)
        query = select(
            [Station_FieldWorker.FK_Station,User.Login]).select_from(joinTable).where(
            Station_FieldWorker.FK_Station.in_(listID))

        FieldWorkers = DBSession.execute(query).fetchall()
        # print(FieldWorkers)
        # list_ = list(map( lambda b : ,FieldWorkers))
        list_ = {}
        for x,y in FieldWorkers :
            list_.setdefault(x,[]).append(y)
        data = []
        for row in result :
            row = OrderedDict(row)
            try :
                row['FieldWorkers'] = list_[row['ID']]
            except:
                pass
            row['StationDate']= row['StationDate'].strftime('%d/%m/%Y %H:%M:%S')
            data.append(row)
        return data

    def addFieldworkers (self):
        return
