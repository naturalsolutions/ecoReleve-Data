from sqlalchemy import (and_,
 func,
 insert,
 select,
 exists,
 join,
 cast,
 DATE)
from sqlalchemy.orm import aliased
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

    def GetFlatDataList(self,searchInfo=None) :
        ''' Override parent function to include management of Observation/Protocols and fieldWorkers '''
        fullQueryJoinOrdered = self.GetFullQuery(searchInfo)
        result = DBSession.execute(fullQueryJoinOrdered).fetchall()

        listID = list(map(lambda x: x['ID'],result))
        joinTable = join(Station_FieldWorker,User,Station_FieldWorker.FK_FieldWorker==User.id)
        query = select(
            [Station_FieldWorker.FK_Station,User.Login]).select_from(joinTable).where(
            Station_FieldWorker.FK_Station.in_(listID))
        FieldWorkers = DBSession.execute(query).fetchall()
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
            data.append(row)
        return data