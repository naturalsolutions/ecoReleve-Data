from traceback import print_exc
from pyramid.request import Request
from pyramid.view import view_config
from sqlalchemy import select, and_, join

from ecoreleve_server.core import RootCore, DynamicObjectResource, DynamicObjectCollectionResource
from .observation_model import Observation
from ..field_activities import FieldActivity_ProtocoleType
from ..media_files import MediasFiles
from ..permissions import context_permissions


class ObservationResource(DynamicObjectResource):

    model = Observation
    __acl__ = context_permissions['observations']

    def update(self, json_body=None):

        if not json_body:
            data = self.request.json_body
        else:
            data = json_body

        curObs = self.objectDB
        listOfSubProtocols = []
        responseBody = {'id': curObs.ID}

        for items, value in data.items():
            if isinstance(value, list) and items != 'children':
                listOfSubProtocols = value

        data['Observation_childrens'] = listOfSubProtocols
        curObs.values = data
        try:
            if curObs.Equipment is not None:
                curObs.Station = curObs.Station
        except ErrorAvailable as e:
            self.session.rollback()
            self.request.response.status_code = 409
            responseBody['response'] = e.value

        return responseBody

    def delete(self):
        if self.objectDB:
            id_ = self.objectDB.ID
            DynamicObjectResource.delete(self)

            # certainly not the better way but don't know where handle it  
            if 'mediafile' in self.objectDB.values:
                mediaItem = None
                # mediaItem = self.session.query(MediasFiles).filter(MediasFiles.FK_Station == self.objectDB.FK_Station).one()
                mediaItem = self.session.query(MediasFiles).filter(and_( MediasFiles.FK_Station == self.objectDB.FK_Station, MediasFiles.Name == self.objectDB.values['mediafile'].split('/')[-1] )).first()
                if mediaItem :
                    delSubReq = Request.blank('/ecoReleve-Core/mediasfiles/'+str(mediaItem.Id) )
                    delSubReq.method = 'DELETE'
                    delSubReq.cookies = self.request.cookies
                    delSubResp = self.request.invoke_subrequest(delSubReq)
        else:
            id_ = None
        response = {'id': id_}
        return response


class ObservationsResource(DynamicObjectCollectionResource):

    Collection = None
    model = Observation
    moduleFormName = 'ObservationForm'
    moduleGridName = 'ObservationFilter'
    children = [('{int}', ObservationResource)]
    item = ObservationResource

    __acl__ = context_permissions['observations']

    def __init__(self, ref, parent):
        DynamicObjectCollectionResource.__init__(self, ref, parent)
        # self.POSTactions = {'batch': self.batch}
        self.parent = parent
        if 'objectType' in self.request.params:
            self.typeObj = int(self.request.params['objectType'])

    def retrieve(self):
        if self.parent.__class__.__name__ == 'StationResource':
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
        curObs = self.model(
            type_id=data['FK_ProtocoleType'], FK_Station=sta.ID)
        listOfSubProtocols = []

        for items, value in data.items():
            if isinstance(value, list) and items != 'children':
                listOfSubProtocols = value

        data['Observation_childrens'] = listOfSubProtocols

        responseBody = {}

        try:
            curObs.values = data
            curObs.Station = sta
            self.session.add(curObs)
            self.session.flush()
            responseBody['id'] = curObs.ID
        except Exception as e:
            # print(e)
            self.session.rollback()
            self.request.response.status_code = 409
            responseBody['response'] = e.value
            sendLog(logLevel=1, domaine=3,
                    msg_number=self.request.response.status_code)
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
        print('in get observation grid')
        sta_id = self.parent.objectDB.ID
        listObs = list(self.session.query(Observation
                                          ).filter(Observation.type_id == self.typeObj
                                                   ).filter(Observation.FK_Station == sta_id))
        values = []
        for i in range(len(listObs)):
            curObs = listObs[i]
            values.append(curObs.getDataWithSchema()['data'])
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

                listProto = {}
                if listObs:
                    for i in range(len(listObs)):
                        DisplayMode = 'edit'
                        curObs = listObs[i]
                        curObsType = curObs._type
                        typeID = curObsType.ID
                        if typeID in listProto:
                            listProto[typeID]['obs'].append(curObs.ID)
                        else:
                            typeName = curObsType.Name.replace('_', ' ')
                            if curObsType.Status == 10:
                                curObsForm = curObs.getForm(
                                    displayMode=DisplayMode)
                                curObsForm['grid'] = True
                            else:
                                curObsForm = {}
                                curObsForm['grid'] = False

                            listProto[typeID] = {
                                'Name': typeName,
                                'schema': curObsForm.get('schema', None),
                                'fieldsets': curObsForm.get('fieldsets', None),
                                'grid': curObsForm['grid'],
                                'obs': [curObs.ID]
                            }

                if listType:
                    listVirginProto = list(
                        filter(lambda proto: proto.FK_ProtocoleType not in listProto, listType))

                    for i in range(len(listVirginProto)):
                        DisplayMode = 'edit'
                        typeID = listVirginProto[i].FK_ProtocoleType

                        curVirginObs = Observation(type_id=typeID)
                        curVirginObsType = curVirginObs._type
                        typeName = curVirginObsType.Name.replace('_', ' ')
                        protoStatus = curVirginObsType.obsolete

                        if protoStatus != 1:
                            if curVirginObsType.Status == 10:
                                curVirginObsForm = curVirginObs.getForm(
                                    displayMode=DisplayMode)
                                curVirginObsForm['grid'] = True
                            else:
                                curVirginObsForm = {}
                                curVirginObsForm['grid'] = False

                            listProto[typeID] = {
                                'Name': typeName,
                                'schema': curVirginObsForm.get('schema', None),
                                'fieldsets': curVirginObsForm.get('fieldsets', None),
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
        ProtocoleType = Observation.TypeClass
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


RootCore.children.append(('protocols', ObservationsResource))
