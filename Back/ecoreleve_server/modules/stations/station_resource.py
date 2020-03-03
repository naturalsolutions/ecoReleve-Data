import json
import itertools
from datetime import datetime, timedelta
import pandas as pd
from sqlalchemy import select, and_, join
from sqlalchemy.exc import IntegrityError

import copy

from ecoreleve_server.core import RootCore
from ecoreleve_server.core.base_resource import DynamicObjectResource, DynamicObjectCollectionResource
from .station_model import Station, Station_FieldWorker
from ..monitored_sites.monitored_site_model import MonitoredSite, MonitoredSitePosition
from ..users.user_model import User
from ..field_activities import fieldActivity
from ..observations.observation_resource import ObservationsResource
from .station_collection import StationCollection
from ..permissions import context_permissions
from ..sensors.sensor_data import CamTrap

from ...utils.datetime import parse

class StationResource(DynamicObjectResource):

    model = Station
    children = [('observations', ObservationsResource)]
    __acl__ = context_permissions['stations']

    def delete(self):
        if self.objectDB:
            id_ = self.objectDB.ID
            DynamicObjectResource.delete(self)
        else:
            id_ = None
        response = {'id': id_}
        return response


class StationsResource(DynamicObjectCollectionResource):

    Collection = StationCollection
    model = Station
    moduleFormName = 'StationForm'
    moduleGridName = 'StationGrid'

    children = [('{int}', StationResource)]

    __acl__ = context_permissions['stations']

    def __init__(self, ref, parent):
        DynamicObjectCollectionResource.__init__(self, ref, parent)
        self.__acl__ = context_permissions[ref]


    def insertWithCamTrap(self):
        session = self.request.dbsession
        data = {}
        for items, value in self.request.json_body.items():
            data[items] = value
        
        if data['camtrapId'] is None:
            self.request.response.status_code = 502
            raise KeyError("no camtrapId submitted")
        else:
            idCreated = -1 
            camtrapItem = session.query(CamTrap).get(data['camtrapId'])
            self.objectDB.values = data
            try:
                session.begin_nested()
                try:
                    session.add(self.objectDB)
                    session.flush()
                except Exception as e:
                    # error when try inserting station ever on server
                    #hack handle error raise by business ruler
                    # need to find a cleaner way
                    self.request.response.status_code = 409
                    self.request.response.text = e.value
                    session.rollback()
                    pass
                session.commit()
                # session.refresh(self.objectDB)
                idCreated = self.objectDB.ID
                camtrapItem.stationId = idCreated
                camtrapItem.validated = 2
                session.add(camtrapItem)
                session.flush()
            except  Exception as e:
                self.request.response.status_code = 502
            if self.request.response.status_code == 409 :
                return self.request.response.text
            else:
                return {'ID': idCreated}
                
    def insertAllWithCamTrap(self):
        session = self.request.dbsession
        session.autoflush = False
        data = self.request.json_body
        result = []
        collectionItem = []
        
        for row in data:        
            try:
                self.newobjectDB = Station()
                self.newobjectDB.values = row
                session.begin_nested()
                try:
                    session.add(self.newobjectDB)
                    session.flush()
                    camtrapItem = session.query(CamTrap).get(row['camtrapId'])         
                    if self.newobjectDB.ID:
                        camtrapItem.stationId = self.newobjectDB.ID
                    camtrapItem.validated = 2
                    session.add(camtrapItem)
                    session.flush()
                    result.append({ row['camtrapId'] : self.newobjectDB.ID  })
                except Exception as e:
                    # error when try inserting station ever on server
                    #hack handle error raise by business ruler
                    # need to find a cleaner way
                    result.append({ row['camtrapId'] : e.value   })
                    self.request.response.status_code = 202
                    self.newobjectDB.ID = None
                    session.rollback()
                    pass
                session.commit()               
            except Exception as e:
                self.request.response.status_code = 502
                raise e
    
        return result

    def deleteStationWithCamTrap(self):
        session = self.request.dbsession
        data = self.request.json_body
        result = []
        for row in data:
            camTrapItem = session.query(CamTrap).get(row['id'])
            stationItem = session.query(self.model).get(row['stationId'])
            try:
                if stationItem:
                    session.delete(stationItem)
                camTrapItem.stationId = None
                session.add(camTrapItem)
                result.append({camTrapItem.pk_id : 'station deleted'})
            except Exception as e:
                self.request.response.status_code = 502
                raise e
        return result

    def insertAll(self) :
        session = self.request.dbsession
        data = self.request.json_body
        result = []
        collectionItem = []
        for row in data:
            self.newobjectDB = Station()
            collectionItem.append(self.newobjectDB)
            row = self.handleDataBeforeInsert(row)
            self.newobjectDB.values = row
            self.session.add(self.newobjectDB)
        self.session.flush()
        for item in collectionItem:
            if item.ID :
                result.append({ ''+str(item.Name)+'' :  item.ID})
            else :
                result.append({ ''+str(item.Name)+'' : None})

        return result

    def handleDataBeforeInsert(self, data):
        user_id = self.request.authenticated_userid['iss']
        data['creator'] = user_id
        return data

    def updateMonitoredSite(self):
        session = self.request.dbsession
        data = self.request.params.mixed()

        if "FK_MonitoredSite" not in data or data['FK_MonitoredSite'] == '':
            return 'Station is not monitored'
        try:
            data['StartDate'] = data['StationDate']
            data['Precision'] = data['precision']
            if data.get('Name', None):
                del data['Name']
            currentMonitoredSite = session.query(MonitoredSite).get(data['FK_MonitoredSite'])
            tmpVal = copy.deepcopy(currentMonitoredSite.values)
            # tmpVal = currentMonitoredSite.values
            tmpVal['LAT'] = data['LAT']
            tmpVal['LON'] = data['LON']
            tmpVal['ELE'] = data['ELE']
            tmpVal['Comments'] = data['Comments']
            tmpVal['StartDate'] = data['StationDate']
            if tmpVal['creationDate'] > parse(data['StationDate'] ) :
                tmpVal['creationDate'] = data['StationDate']
            # print("on a fetch le site monitoré",currentMonitoredSite.values)
            # print("on va mettre les valeurs",data)
            currentMonitoredSite.values = tmpVal
            # currentMonitoredSite.updateFromJSON(data)
            return 'Monitored site position was updated'
        except IntegrityError as e:
            session.rollback()
            return 'This location already exists'
        except Exception as e:
            print(e)

    def getFormImportGPX(self):
        return self.getForm(objectType=1, moduleName='ImportFileForm')

    def lastImported(self, obj, params):
        '''
            will add all this criteria if this params is apply
        '''
        user = self.request.authenticated_userid['iss']
        dateFrom = datetime.today() - timedelta(days=2)
        dateFrom = dateFrom.replace(
            hour=0,
            minute=0,
            second=0,
            microsecond=0
            )
        obj['Operator'] = '='
        obj['Value'] = True
        criteria = [
            {
                'Column': 'creator',
                'Operator': '=',
                'Value': user
            },
            {
                'Column': 'FK_StationType',
                'Operator': '=',
                'Value': 4  # => TypeID of GPX station
            },
            {
                "Column": "creationDate",
                "Operator": ">=",
                "Value": dateFrom.strftime("%Y-%m-%dT%H:%M:%SZ")
            }
            ]
        params['criteria'].extend(criteria)

    def handleCriteria(self, params):
        if 'criteria' in params:
            lastImported = False
            for obj in params['criteria']:
                if obj['Column'] == 'LastImported':
                    self.lastImported(obj, params)
                    lastImported = True

        if not lastImported:
            map(lambda x: obj['Column'] != 'FK_StationType', params['criteria'])

        removePending = [
            {
                'Column': 'FK_StationType',
                'Operator': 'Is not',
                'Value': 6  # => TypeID of pending stations
            }
            ]
        params['criteria'].extend(removePending)

        if 'geo' in self.request.params.mixed():
            self.getGeoJsonParams(params)
        return params

    def handleResult(self, result):
        if 'geo' in self.request.params.mixed():
            data = self.getGeoJsonResult(result)
        else:
            data = self.getFieldWorkers(result)
            # data = result
        return data

    def handleCount(self, count, callback, params):
        if 'geo' in self.request.params.mixed() and count > 50000:
            return []
        else:
            return callback(**params)

    def retrieve(self):
        if 'geo' in self.request.params.mixed():
            paging = False
        else:
            paging = True
        return self.search(paging=paging)

    def deleteMany(self):
        error = False
        data = {}
        if len(self.request.json_body) > 0 :
            session = self.request.dbsession
            stas = session.query(Station).filter(Station.ID.in_(self.request.json_body)).all()
            for sta in stas:
                data[str(sta.ID)] = 'not deleted'
            try :
                session.delete(sta)
                data[str(sta.ID)] = 'deleted'
            except :
                self.request.response.status_code = 502

        return data

    def deleteManyWithCamTrap(self):
        error = False
        data = {}
        if len(self.request.json_body) > 0 :
            session = self.request.dbsession
            stas = session.query(Station).filter(Station.ID.in_(self.request.json_body)).all()
            camtraps = session.query(CamTrap).filter(CamTrap.stationId.in_(self.request.json_body)).all()
            if len(camtraps):
                for cam in camtraps:
                    data[str(cam.stationId)] = 'not exist'
                    flagNotFound = True
                    for sta in stas:
                        if sta.ID == cam.stationId:
                            flagNotFound = False
                            data[str(cam.stationId)] = 'not deleted'
                            try:
                                session.delete(sta)
                                cam.stationId = None
                                session.add(cam)
                                data[str(cam.stationId)] = 'deleted'
                            except:
                                self.request.response.status_code = 502
                    if flagNotFound:
                        try:
                            cam.stationId = None
                            session.add(cam)
                        except:
                            self.request.response.status_code = 502

        return data

    def getFieldActivityList(self):
        query = select([fieldActivity.ID.label('value'),
                        fieldActivity.Name.label('label')])
        result = self.session.execute(query).fetchall()
        res = []
        for row in result:
            res.append({'label': row['label'], 'value': row['value']})
        return sorted(res, key=lambda x: x['label'])

    def getFieldWorkers(self, data):
        params, history, startDate = self.formatParams({}, paging=True)
        # params = {'selectable': ['ID'],
        #           'filters':params.get('criteria', [])#,
        #           #'offset':params.get('offset'),
        #           #'limit':params.get('per_page')#,
        #           #'order_by':params.get('order_by')
        #         }

        params = {
            'selectable': [a.get('Column') for a in params.get('criteria')],
            'filters': params.get('criteria', [])
            }
        queryTmp = self.collection.build_query(**params)
        queryTmp = queryTmp.with_only_columns([getattr(self.model, 'ID')])
        queryCTE = queryTmp.cte()
        # queryCTE = self.collection.build_query(**params).cte()
        joinFW = join(
            Station_FieldWorker,
            User,
            Station_FieldWorker.FK_FieldWorker == User.id
            )
        joinTable = join(
            queryCTE,
            joinFW,
            queryCTE.c['ID'] == Station_FieldWorker.FK_Station
            )
        query = select([
            Station_FieldWorker.FK_Station,
            User.Login
            ]).select_from(joinTable)
        FieldWorkers = self.session.execute(query).fetchall()
        list_ = {}
        for x, y in FieldWorkers:
            list_.setdefault(x, []).append(y)
        for row in data[1]:
            try:
                row['FK_FieldWorker_FieldWorkers'] = list_[row['ID']]
            except Exception as e:
                print(e)
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

    def insertMany(self):
        ### deprecated ??? 
        session = self.request.dbsession
        data = self.request.json_body
        data_to_insert = []
        format_dt = '%d/%m/%Y %H:%M'
        dateNow = datetime.now()
        model = self.model

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
                curSta = model(type_id=4)
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


RootCore.children.append(('stations', StationsResource))
