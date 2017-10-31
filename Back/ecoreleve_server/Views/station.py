from ..Models import (
    Station as StationDB,
    StationType,
    Station_FieldWorker,
    StationList,
    MonitoredSitePosition,
    MonitoredSite,
    fieldActivity,
    User
)
import json
import itertools
from datetime import datetime
import pandas as pd
from sqlalchemy import select, and_, join
from sqlalchemy.exc import IntegrityError
from ..controllers.security import RootCore
from . import DynamicObjectView, DynamicObjectCollectionView, context_permissions
from .protocols import ObservationsView
from ..utils.parseValue import parser


class StationView(DynamicObjectView):

    model = StationDB

    def __init__(self, ref, parent):
        DynamicObjectView.__init__(self, ref, parent)
        self.add_child('observations', ObservationsView)

    def __getitem__(self, ref):
        if ref in self.actions:
            self.retrieve = self.actions.get(ref)
            return self
        return self.get(ref)

    def getObs(self, ref):
        return ObservationsView(ref, self)


class StationsView(DynamicObjectCollectionView):

    Collection = StationList
    item = StationView
    moduleFormName = 'StationForm'
    moduleGridName = 'StationGrid'

    def __init__(self, ref, parent):
        DynamicObjectCollectionView.__init__(self, ref, parent)
        self.actions = {'updateSiteLocation': self.updateMonitoredSite,
                        'importGPX': self.getFormImportGPX,
                        'fieldActivity': self.getFieldActivityList
                        }
        self.__acl__ = context_permissions[ref]

    def updateMonitoredSite(self):
        session = self.request.dbsession
        data = self.request.params.mixed()

        if data['FK_MonitoredSite'] == '':
            return 'Station is not monitored'
        try:
            data['StartDate'] = data['StationDate']
            data['Precision'] = data['precision']
            currentMonitoredSite = session.query(MonitoredSite).get(data['FK_MonitoredSite'])
            currentMonitoredSite.updateFromJSON(data)
            return 'Monitored site position was updated'
        except IntegrityError as e:
            session.rollback()
            return 'This location already exists'

    def getFormImportGPX(self):
        return self.getForm(objectType=1, moduleName='ImportFileForm')

    def lastImported(self, obj, params):
        user = self.request.authenticated_userid['iss']
        obj['Operator'] = '='
        obj['Value'] = True
        criteria = [{'Column': 'creator',
                     'Operator': '=',
                     'Value': user
                     },
                    {'Column': 'FK_StationType',
                     'Operator': '=',
                     'Value': 4  # => TypeID of GPX station
                     }]
        params['criteria'].extend(criteria)

    def handleCriteria(self, params):
        if 'criteria' in params:
            lastImported = False
            for obj in params['criteria']:
                    if obj['Column'] == 'LastImported':
                        self.lastImported(obj, params)
                        lastImported = True
                    if obj['Column'] == 'FK_FieldWorker' and obj['Operator'] == 'IN':
                        fieldworkers = obj['Value']
                        obj['Value'] = User.getUsersIds(fieldworkers)

        if not lastImported:
            map(lambda x: obj['Column'] != 'FK_StationType', params['criteria'])

        if 'geo' in self.request.params.mixed():
            self.getGeoJsonParams(params)
        return params

    def handleResult(self, result):
        if 'geo' in self.request.params.mixed():
            data = self.getGeoJsonResult(result)
        else:
            data = self.getFieldWorkers(result)
        return data

    def handleCount(self, count, callback, params):
        if 'geo' in self.request.params.mixed() and count > 50000:
            return []
        else:
            return callback(params)

    def retrieve(self):
        if 'geo' in self.request.params.mixed():
            paging = False
        else:
            paging = True
        return self.search(paging=paging)

    def getFieldActivityList(self):
        query = select([fieldActivity.ID.label('value'),
                        fieldActivity.Name.label('label')])
        result = self.session.execute(query).fetchall()
        res = []
        for row in result:
            res.append({'label': row['label'], 'value': row['value']})
        return sorted(res, key=lambda x: x['label'])

    def getFieldWorkers(self, data):
        queryCTE = self.collection.fullQueryJoinOrdered.cte()
        joinFW = join(Station_FieldWorker, User,
                      Station_FieldWorker.FK_FieldWorker == User.id)
        joinTable = join(queryCTE, joinFW, queryCTE.c[
                            'ID'] == Station_FieldWorker.FK_Station)
        query = select([Station_FieldWorker.FK_Station,
                        User.Login]).select_from(joinTable)
        FieldWorkers = self.session.execute(query).fetchall()
        list_ = {}
        for x, y in FieldWorkers:
            list_.setdefault(x, []).append(y)
        for row in data[1]:
            try:
                row['FK_FieldWorker_FieldWorkers'] = list_[row['ID']]
            except:
                pass
        return data

    def getGeoJsonParams(self, params):
        params['order_by'] = []
        criteria = [{'Column': 'LAT',
                     'Operator': 'Is not',
                     'Value': None
                     },
                    {'Column': 'LON',
                     'Operator': 'Is not',
                     'Value': None
                     }]
        params['criteria'].extend(criteria)

    def getGeoJsonResult(self, data):
        geoJson = []
        exceed = True
        countResult = data[0]['total_entries']
        result = data[1]
        if countResult < 50000:
            exceed = False

            for row in result:
                geoJson.append({
                    'type': 'Feature',
                    'properties': {
                        'name': row['Name'],
                        'date': row['StationDate']},
                    'geometry': {
                        'type': 'Point',
                        'coordinates': [row['LAT'], row['LON']]}
                })
        data = {'type': 'FeatureCollection',
                'features': geoJson,
                'exceed': exceed}
        return data

    def insert(self):
        session = self.request.dbsession
        data = {}
        for items, value in self.request.json_body.items():
            data[items] = value

        newSta = StationDB(
            FK_StationType=data['FK_StationType'],
            creator=self.request.authenticated_userid['iss'])
        newSta.StationType = session.query(StationType).filter(
            StationType.ID == data['FK_StationType']).first()
        newSta.init_on_load()

        newSta.updateFromJSON(data)
        session.add(newSta)
        session.flush()
        msg = {'ID': newSta.ID}

        return msg

    def insertMany(self):
        session = self.request.dbsession
        data = self.request.json_body
        data_to_insert = []
        format_dt = '%d/%m/%Y %H:%M'
        dateNow = datetime.now()
        model = self.item.model

        # Rename field and convert date
        # TODO
        for row in data:
            newRow = {}
            newRow['LAT'] = row['latitude']
            newRow['LON'] = row['longitude']
            newRow['ELE'] = row['elevation']
            newRow['precision'] = row['precision']
            newRow['Name'] = row['name']
            newRow['fieldActivityId'] = row['fieldActivity']
            newRow['precision'] = 10  # row['Precision']
            newRow['creationDate'] = dateNow
            newRow['creator'] = self.request.authenticated_userid['iss']
            newRow['FK_StationType'] = 4
            newRow['id'] = row['id']
            newRow['NbFieldWorker'] = row['NbFieldWorker']
            newRow['StationDate'] = datetime.strptime(
                row['waypointTime'], format_dt)

            if 'fieldActivity' in row:
                newRow['fieldActivityId'] = row['fieldActivity']

            if 'NbFieldWorker' in row:
                newRow['NbFieldWorker'] = row['NbFieldWorker']

            data_to_insert.append(newRow)

        # Load date into pandas DataFrame then round LAT,LON into decimal(5)
        DF_to_check = pd.DataFrame(data_to_insert)
        DF_to_check['LAT'] = DF_to_check['LAT'].round(5)
        DF_to_check['LON'] = DF_to_check['LON'].round(5)

        maxDate = DF_to_check['StationDate'].max()
        minDate = DF_to_check['StationDate'].min()
        maxLon = DF_to_check['LON'].max()
        minLon = DF_to_check['LON'].min()
        maxLat = DF_to_check['LAT'].max()
        minLat = DF_to_check['LAT'].min()
        # Retrieve potential duplicated stations from Database

        query = select([model]).where(
            and_(
                model.StationDate.between(minDate, maxDate),
                model.LAT.between(minLat, maxLat)
            )).where(model.LON.between(minLon, maxLon))

        data_to_insert = []
        result_to_check = pd.read_sql_query(query, session.get_bind())
        if result_to_check.shape[0] > 0:
            # IF potential duplicated stations, load them into pandas DataFrame
            result_to_check['LAT'] = result_to_check['LAT'].round(5)
            result_to_check['LON'] = result_to_check['LON'].round(5)

            merge_check = pd.merge(DF_to_check, result_to_check, on=[
                                'LAT', 'LON', 'StationDate'])
            # Get only non existing data to insert
            DF_to_insert = DF_to_check[~DF_to_check['id'].isin(merge_check['id'])]
            DF_to_insert = DF_to_insert.drop(['id'], 1)
            data_to_insert = json.loads(DF_to_insert.to_json(
                orient='records', date_format='iso'))

        else:
            data_to_insert = json.loads(DF_to_check.to_json(
                orient='records', date_format='iso'))

        staListID = []
        nbExc = 0

        if len(data_to_insert) != 0:
            for sta in data_to_insert:
                curSta = model(FK_StationType=4)
                curSta.init_on_load()
                curDate = datetime.strptime(
                    sta['StationDate'], "%Y-%m-%dT%H:%M:%S.%fZ")
                curSta.updateFromJSON(sta)
                curSta.StationDate = curDate

                try:
                    session.add(curSta)
                    session.flush()
                    session.commit()
                    staListID.append(curSta.ID)
                except IntegrityError as e:
                    session.rollback()
                    nbExc += 1
                    pass

            result = staListID

            # Insert FieldWorkers
            if not data[0]['FieldWorkers'] is None or not data[0]['FieldWorkers'] == "":
                list_ = list(map(lambda b: list(map(lambda a: {
                            'FK_Station': a,
                            'FK_FieldWorker': b},
                            result)),
                            data[0]['FieldWorkers']))
                list_ = list(itertools.chain.from_iterable(list_))
                stmt = Station_FieldWorker.__table__.insert().values(list_)
                session.execute(stmt)
        else:
            result = []
        response = {'exist': len(data) - len(data_to_insert) +
                    nbExc, 'new': len(data_to_insert) - nbExc}
        return response


RootCore.listChildren.append(('stations', StationsView))
