from ..Models import (
    Individual,
    IndividualDynPropValue,
    Individual_Location,
    Sensor,
    SensorType,
    IndividualList,
    Base,
    IndivLocationList,
    Station,
    ErrorCheckIndividualCodes
)
import json
from datetime import datetime
from sqlalchemy import select, join, desc
from collections import OrderedDict
from ..controllers.security import RootCore, Resource, SecurityRoot, context_permissions
from . import DynamicObjectView, DynamicObjectCollectionView, DynamicObjectValue, DynamicObjectValues
from pyramid.traversal import find_root

class IndividualValueView(DynamicObjectValue):
    model = IndividualDynPropValue
    item = None

    def retrieve(self):
        pass


class IndividualValuesView(DynamicObjectValues):
    model = IndividualDynPropValue
    item = IndividualValueView


class IndividualView(DynamicObjectView):
    model = Individual

    def __init__(self, ref, parent):
        DynamicObjectView.__init__(self, ref, parent)
        self.add_child('locations', IndividualLocationsView)
        self.add_child('history', IndividualValuesView)
        self.actions = {'equipment': self.getEquipment}

    def __getitem__(self, ref):
        if ref in self.actions:
            self.retrieve = self.actions.get(ref)
            return self
        return self.get(ref)

    def update(self):
        data = self.request.json_body
        self.objectDB.LoadNowValues()
        try:
            self.objectDB.updateFromJSON(data)
            return {}
        except ErrorCheckIndividualCodes as e:
            self.request.response.status_code = 520
            return str(e)

    def getEquipment(self):
        table = Base.metadata.tables['IndividualEquipment']
        joinTable = join(table, Sensor, table.c['FK_Sensor'] == Sensor.ID)
        joinTable = join(joinTable,
                         SensorType,
                         Sensor.FK_SensorType == SensorType.ID)
        query = select([table.c['StartDate'],
                        table.c['EndDate'],
                        Sensor.UnicIdentifier,
                        Sensor.ID.label('SensorID'),
                        table.c['FK_Individual'],
                        SensorType.Name.label('Type')]
                       ).select_from(joinTable
                                     ).where(table.c['FK_Individual'] == self.objectDB.ID
                                             ).order_by(desc(table.c['StartDate']))

        result = self.session.execute(query).fetchall()
        response = []
        for row in result:
            curRow = OrderedDict(row)
            curRow['StartDate'] = curRow['StartDate'].strftime('%Y-%m-%d %H:%M:%S')
            if curRow['EndDate'] is not None:
                curRow['EndDate'] = curRow['EndDate'].strftime('%Y-%m-%d %H:%M:%S')
            else:
                curRow['EndDate'] = ''
            response.append(curRow)

        return response


class IndividualsView(DynamicObjectCollectionView):

    Collection = IndividualList
    item = IndividualView
    moduleFormName = 'IndivForm'
    moduleGridName = 'IndivFilter'

    def __init__(self, ref, parent):
        DynamicObjectCollectionView.__init__(self, ref, parent)
        self.__acl__ = context_permissions[ref]

        if not self.typeObj:
            self.typeObj = 1

    def insert(self):
        # if set True create automatically a new indiv  = not what we want
        self.session.autoflush = False
        data = {}
        startDate = None

        for items, value in self.request.json_body.items():
            data[items] = value
        existingIndivID = None

        if 'stationID' in data:
            curSta = self.session.query(Station).get(data['stationID'])
            startDate = curSta.StationDate
        self.typeObj = data['FK_IndividualType']
        newIndiv = self.item.model(FK_IndividualType=self.typeObj,
                                   creationDate=datetime.now(),
                                   Original_ID='0')
        newIndiv.init_on_load()
        try:
            newIndiv.updateFromJSON(data, startDate=startDate)

            if self.typeObj == 2:
                existingIndivID = self.checkExisting(newIndiv)
                if existingIndivID is not None:
                    self.session.rollback()
                    self.session.close()
                    indivID = existingIndivID

            if existingIndivID is None:
                self.session.add(newIndiv)
                self.session.flush()
                indivID = newIndiv.ID
            return {'ID': indivID}
        except ErrorCheckIndividualCodes as e:
            self.request.response.status_code = 520
            return str(e)

    def checkExisting(self, indiv):
        indivData = indiv.__properties__

        searchInfo = {'criteria':
                            [{'Column': key,
                              'Operator': 'is',
                              'Value': val}
                             for key, val in indivData.items()],
                      'order_by': ['ID:asc']}

        moduleFront = self.getConf(self.moduleGridName)

        listObj = IndividualList(moduleFront, typeObj=2)
        dataResult = listObj.GetFlatDataList(searchInfo)

        if len(dataResult) > 0:
            existingID = dataResult[0]['ID']
        else:
            existingID = None

        return existingID


class IndividualLocationsView(SecurityRoot):

    def __init__(self, ref, parent):
        Resource.__init__(self, ref, parent)
        self.parent = parent
        root = find_root(self)
        self.request = root.request
        self.session = root.request.dbsession
        self.__actions__ = {'getFields': self.getFieldsLoc,
                            }

    def __getitem__(self, ref):
        if ref in self.actions:
            self.retrieve = self.actions.get(ref)
            return self
        return self

    def retrieve(self):
        return self.getLocations()

    def update(self):
        self.delete()

    def delete(self):
        IdList = json.loads(self.request.params['IDs'])
        self.session.query(Individual_Location).filter(
            Individual_Location.ID.in_(IdList)).delete(synchronize_session=False)
        return True

    def getFieldsLoc(self):
        gene = IndivLocationList(self.session, None)
        return gene.get_col()

    def getLocations(self):
        id_ = self.parent.objectDB.ID
        gene = IndivLocationList(self.session, id_)
        data = self.request.params.mixed()
        if 'criteria' in data:
            criteria = json.loads(data['criteria'])
        else:
            criteria = {}

        if 'per_page' in data:
            offset = json.loads(data['offset'])
            per_page = json.loads(data['per_page'])
        else:
            offset = None
            per_page = None

        if 'geo' in self.request.params:
            result = gene.get_geoJSON(
                criteria, ['ID', 'Date', 'type_', 'precision'])
        else:
            result = gene.search(criteria,
                                 offset=offset,
                                 per_page=per_page,
                                 order_by=['StationDate:desc'])
            for row in result:
                row['Date'] = row['Date'].strftime('%Y-%m-%d %H:%M:%S')
                row['format'] = 'YYYY-MM-DD HH:mm:ss'

        # ************ POC Indiv location PLayer  ****************

        # if 'geoDynamic' in request.params :
        #     response = None
        #     geoJson=[]
        #     joinTable = join(Individual_Location, Sensor, Individual_Location.FK_Sensor == Sensor.ID)
        #     stmt = select([Ind ividual_Location,Sensor.UnicIdentifier]).select_from(joinTable
        #         ).where(Individual_Location.FK_Individual == id
        #         ).where(Individual_Location.type_ == 'GSM').order_by(asc(Individual_Location.Date))
        #     dataResult = session.execute(stmt).fetchall()

        #     df = pd.DataFrame.from_records(dataResult, columns=dataResult[0].keys(), coerce_float=True)
        #     X1 = df.iloc[:-1][['LAT', 'LON']].values
        #     X2 = df.iloc[1:][['LAT', 'LON']].values
        #     df['dist'] = np.append(haversine(X1, X2), 0).round(3)
        #     # Compute the speed
        #     df['speed'] = (df['dist'] / ((df['Date'] - df['Date'].shift(-1)).fillna(1) / np.timedelta64(1, 'h'))).round(3)
        #     df['Date'] = df['Date'].apply(lambda row: np.datetime64(row).astype(datetime))

        #     for i in range(df.shape[0]):
        #         geoJson.append({'type':'Feature', 'properties':{'type':df.loc[i,'type_']
        #             , 'sensor':df.loc[i,'UnicIdentifier'],'speed':df.loc[i,'speed'],'date':df.loc[i,'Date']}
        #             , 'geometry':{'type':'Point', 'coordinates':[df.loc[i,'LAT'],df.loc[i,'LON']]}})
        #     result = {'type':'FeatureCollection', 'features':geoJson}
        #     response = result
        # else :
        #     response  = curIndiv.getFlatObject()

        return result


RootCore.listChildren.append(('individuals', IndividualsView))
RootCore.listChildren.append(('individualsValues', IndividualValuesView))
