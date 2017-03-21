from pyramid.view import view_config
from ..Models import (
    Observation,
    ProtocoleType,
    FieldActivity_ProtocoleType,
    fieldActivity,
    ErrorAvailable,
    sendLog
)
from sqlalchemy import select, and_, join
from traceback import print_exc
from ..controllers.security import RootCore
from . import DynamicObjectView, DynamicObjectCollectionView


class ObservationView(DynamicObjectView):

    model = Observation

    def __getitem__(self, ref):
        if ref in self.actions:
            self.retrieve = self.actions.get(ref)
            return self
        return self

    def update(self, json_body=None):

        if not json_body:
            data = self.request.json_body
        else:
            data = json_body

        curObs = self.objectDB
        curObs.LoadNowValues()
        listOfSubProtocols = []
        responseBody = {'id': curObs.ID}

        for items, value in data.items():
            if isinstance(value, list) and items != 'children':
                listOfSubProtocols = value

        data['Observation_childrens'] = listOfSubProtocols
        curObs.updateFromJSON(data)
        try:
            if curObs.Equipment is not None:
                curObs.Station = curObs.Station
        except ErrorAvailable as e:
            self.session.rollback()
            self.request.response.status_code = 510
            responseBody['response'] = e.value

        return responseBody

    def delete(self):
        response = {'id': self.objectDB.ID}
        DynamicObjectView.delete(self)
        return response


class ObservationsView(DynamicObjectCollectionView):

    Collection = None
    item = ObservationView
    formModuleName = 'ObservationForm'
    gridModuleName = 'ObservationFilter'

    def __init__(self, ref, parent):
        DynamicObjectCollectionView.__init__(self, ref, parent)
        self.POSTactions = {'batch': self.batch}
        self.parent = parent
        if 'objectType' in self.request.params:
            self.typeObj = int(self.request.params['objectType'])

    def __getitem__(self, ref):
        self.create = self.POSTactions.get(ref)
        return DynamicObjectCollectionView.__getitem__(self, ref)

    def retrieve(self):
        if self.parent.__class__.__name__ == 'StationView':
            if self.typeObj:
                return self.getObservationsWithType()
            else:
                return self.getProtocolsofStation()
        else:
            self.request.response.status_code = 520
            response = self.request.response
            response.text = 'A station ID is needed, try this url */stations/{id}/observations'
            return response

    def insert(self, json_body=None):
        if not json_body:
            json_body = self.request.json_body

        data = {}
        for items, value in json_body.items():
            data[items] = value

        sta = self.parent.objectDB
        curObs = self.item.model(FK_ProtocoleType=data['FK_ProtocoleType'])
        listOfSubProtocols = []

        for items, value in data.items():
            if isinstance(value, list) and items != 'children':
                listOfSubProtocols = value

        data['Observation_childrens'] = listOfSubProtocols
        curObs.init_on_load()
        curObs.updateFromJSON(data)

        responseBody = {}

        try:
            curObs.Station = sta
            self.session.add(curObs)
            self.session.flush()
            responseBody['id'] = curObs.ID
        except ErrorAvailable as e:
            self.session.rollback()
            self.request.response.status_code = 510
            responseBody['response'] = e.value
            sendLog(logLevel=1, domaine=3, msg_number=self.request.response.status_code)
        return responseBody

    def batch(self):
        rowData = self.request.json_body['rowData']
        responseBody = {'updatedObservations': [],
                        'createdObservations': []
                        }

        for row in rowData:
            if 'delete' in self.request.json_body:
                item = self.item(row['ID'], self)
                responseBody['updatedObservations'].append(item.delete())
                continue

            if 'ID' in row:
                item = self.item(row['ID'], self)
                responseBody['updatedObservations'].append(item.update(row))
            else:
                row['FK_ProtocoleType'] = self.request.json_body['FK_ProtocoleType']
                responseBody['createdObservations'].append(self.insert(row))

        return responseBody

    def getObservationsWithType(self):
        sta_id = self.parent.objectDB.ID
        listObs = list(self.session.query(Observation
                                          ).filter(Observation.FK_ProtocoleType == self.typeObj
                                                   ).filter(Observation.FK_Station == sta_id))
        values = []
        for i in range(len(listObs)):
            curObs = listObs[i]
            curObs.LoadNowValues()
            values.append(curObs.getFlatObject())
        return values

    def getProtocolsofStation(self):
        curSta = self.parent.objectDB
        sta_id = curSta.ID
        response = []

        try:
            if 'FormName' in self.request.params:
                listObs = list(self.session.query(Observation).filter(
                    and_(Observation.FK_Station == sta_id, Observation.Parent_Observation == None)))
                listType = list(self.session.query(FieldActivity_ProtocoleType
                                                   ).filter(FieldActivity_ProtocoleType.FK_fieldActivity == curSta.fieldActivityId))
                Conf = self.getConf()

                listProto = {}
                if listObs:
                    for i in range(len(listObs)):
                        DisplayMode = 'edit'
                        curObs = listObs[i]
                        typeID = curObs.GetType().ID
                        if typeID in listProto:
                            listProto[typeID]['obs'].append(curObs.ID)
                        else:
                            typeName = curObs.GetType().Name.replace('_', ' ')
                            curObsForm = curObs.getForm(displayMode=DisplayMode)

                            listProto[typeID] = {
                                'Name': typeName,
                                'schema': curObsForm['schema'],
                                'fieldsets': curObsForm['fieldsets'],
                                'grid': curObsForm['grid'],
                                'obs': [curObs.ID]
                            }

                if listType:
                    listVirginProto = list(
                        filter(lambda proto: proto.FK_ProtocoleType not in listProto, listType))

                    for i in range(len(listVirginProto)):
                        DisplayMode = 'edit'
                        typeID = listVirginProto[i].FK_ProtocoleType

                        curVirginObs = Observation(FK_ProtocoleType=typeID)
                        typeName = curVirginObs.GetType().Name.replace('_', ' ')
                        protoStatus = curVirginObs.GetType().obsolete

                        if protoStatus != 1:
                            curVirginObsForm = curVirginObs.getForm(displayMode=DisplayMode)

                            listProto[typeID] = {
                                'Name': typeName,
                                'schema': curVirginObsForm['schema'],
                                'fieldsets': curVirginObsForm['fieldsets'],
                                'grid': curVirginObsForm['grid'],
                                'obs': []
                            }

                globalListProto = [{'ID': typeID,
                                    'Name': listProto[typeID]['Name'],
                                    'schema':listProto[typeID]['schema'],
                                    'fieldsets':listProto[typeID]['fieldsets'],
                                    'grid':listProto[typeID]['grid'],
                                    'obs':listProto[typeID]['obs']
                                    }
                                   for typeID in listProto.keys()
                                   ]

                response = sorted(globalListProto, key=lambda k: k['Name'])

        except Exception as e:
            print_exc()
            pass
        return response

    def getType(self):
        if 'FieldActivityID' in self.request.params:
            fieldActivityID = self.request.params['FieldActivityID']
            join_table = join(ProtocoleType, FieldActivity_ProtocoleType,
                              ProtocoleType.ID == FieldActivity_ProtocoleType.FK_ProtocoleType)
            query = select([ProtocoleType.ID, ProtocoleType.Name]
                           ).where(and_(ProtocoleType.Status.in_([4, 8, 10]),
                                        FieldActivity_ProtocoleType.FK_fieldActivity == fieldActivityID)
                                   ).select_from(join_table)
        else:
            query = select([ProtocoleType.ID, ProtocoleType.Name]).where(
                ProtocoleType.Status.in_([4, 8, 10]))
        query = query.where(ProtocoleType.obsolete == False)
        result = self.session.execute(query).fetchall()
        res = []
        for row in result:
            elem = {}
            elem['ID'] = row['ID']
            elem['Name'] = row['Name'].replace('_', ' ')
            res.append(elem)
        res = sorted(res, key=lambda k: k['Name'])
        return res


RootCore.listChildren.append(('protocols', ObservationsView))
