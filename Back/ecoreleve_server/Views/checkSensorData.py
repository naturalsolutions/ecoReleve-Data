from sqlalchemy import func, desc, select, and_, bindparam, update, text, Table, join
import json
import pandas as pd
from datetime import datetime
from . import CustomView
from ..controllers.security import RootCore, context_permissions
from ..Models import Base, dbConfig, graphDataDate, CamTrap, ArgosGps, Gsm, Rfid
import numpy as np
import transaction
from ..utils.distance import haversine
from traceback import print_exc
from pyramid import threadlocal
from pyramid.response import Response
from ..utils.data_toXML import data_to_XML
import pyramid.httpexceptions as exc


ArgosDatasWithIndiv = Table(
    'VArgosData_With_EquipIndiv', Base.metadata, autoload=True)
GsmDatasWithIndiv = Table('VGSMData_With_EquipIndiv',
                          Base.metadata, autoload=True)
DataRfidWithSite = Table('VRfidData_With_equipSite',
                         Base.metadata, autoload=True)
DataRfidasFile = Table('V_dataRFID_as_file',
                       Base.metadata, autoload=True)
DataCamTrapFile = Table('V_dataCamTrap_With_equipSite',
                        Base.metadata, autoload=True)

viewDict = {'gsm':GsmDatasWithIndiv,
            'argos':ArgosDatasWithIndiv,
            'rfid':DataRfidasFile,
            'camtrap':DataCamTrapFile}


class SensorDatasBySessionItem(CustomView):

    item = None
    models = {'gsm':Gsm,
              'argos':ArgosGps,
              'rfid': Rfid,
              'camtrap':CamTrap}

    def __init__(self, ref, parent):
        CustomView.__init__(self, ref, parent)
        self.type_ = parent.type_
        self.itemID = ref
        self.viewTable = parent.viewTable

        self.item = self.session.query(self.models.get(self.type_)).get(ref)


    def retrieve(self):
        if not self.item:
            self.request.response.status_code = 404
            return self.request.response
        else:
            return self.item.__json__()

    def patch(self):
        data = self.request.json_body
        for item in data:
            if( item not in ['pk_id','fk_sensor','path','name','extension','date_creation','date_uploaded']):
                tmp = data.get(item)
                if(item == 'tags' and tmp):
                    listTags = tmp.split(",")
                    XMLTags = "<TAGS>"
                    for tag in listTags:
                        XMLTags+= "<TAG>"+str(tag)+"</TAG>"
                    XMLTags+= "</TAGS>"
                setattr(self.item, item,tmp)
        self.request.response.status_code = 204
        return self.request.response


class SensorDatasBySession(CustomView):

    item = SensorDatasBySessionItem

    def __init__(self, ref, parent):
        CustomView.__init__(self, ref, parent)
        self.type_ = parent.type_
        self.sessionID = ref
        self.viewTable = parent.viewTable
        self.__acl__ = parent.__acl__
        self.actions = { 'datas' : self.getDatas }

    def getDatas(self):
        if self.type_ == 'camtrap' :
            joinTable = join(CamTrap, self.viewTable,CamTrap.pk_id == self.viewTable.c['pk_id'])
            query = select([CamTrap,self.viewTable.c['FK_MonitoredSite'],self.viewTable.c['sessionID']]
                           ).select_from(joinTable).where(self.viewTable.c['sessionID'] == self.sessionID
                                   ).where(self.viewTable.c['checked'] == 0 or self.viewTable.c['checked'] == None)
        else:
            query = select([self.viewTable]
                           ).where(self.viewTable.c['sessionID'] == self.sessionID
                                   ).where(self.viewTable.c['checked'] == 0 or self.viewTable.c['checked'] == None)
        data = self.session.execute(query).fetchall()
        data = [dict(row) for row in data]
        return self.handleResult(data)
        pass

    def handleResult(self, data):
        #result = data
        if self.type_ in ['gsm','argos']:
            if 'geo' in self.request.params:
                geoJson = []
                for row in data:
                    geoJson.append({'type':'Feature', 'id': row['PK_id'], 'properties':{'type':row['type'], 'date':row['date']}
                        , 'geometry':{'type':'Point', 'coordinates':[row['lat'],row['lon']]}})
                result = {'type':'FeatureCollection', 'features':geoJson}

            else:
                df = pd.DataFrame.from_records(data, columns=data[0].keys(), coerce_float=True)
                X1 = df.iloc[:-1][['lat', 'lon']].values
                X2 = df.iloc[1:][['lat', 'lon']].values
                df['dist'] = np.append(haversine(X1, X2), 0).round(3)
                # Compute the speed
                df['speed'] = (df['dist'] / ((df['date'] - df['date'].shift(-1)).fillna(1) / np.timedelta64(1, 'h'))).round(3)
                df['date'] = df['date'].apply(lambda row: np.datetime64(row).astype(datetime))
                # Fill NaN
                df.fillna(value={'ele':-999}, inplace=True)
                df.fillna(value={'speed':0}, inplace=True)
                df.replace(to_replace = {'speed': np.inf}, value = {'speed':9999}, inplace = True)
                df.fillna(value=0,inplace=True)
                # dataResult = [dict(row) for row in data]
                dataResult = df.to_dict('records')
                result = [{'total_entries':len(dataResult)}]
                result.append(dataResult)
        elif self.type_ == 'camtrap' :
            for tmp in data:
                varchartmp = tmp['path'].split('\\')
                tmp['path']="/imgcamtrap/"+str(varchartmp[len(varchartmp)-2])+"/"
                tmp['name'] = tmp['name'].replace(" ","%20")
                tmp['id'] = tmp['pk_id']
                tmp['date_creation'] = str(tmp['date_creation'])
                tmp['date_creation'] = tmp['date_creation'][:len(tmp['date_creation'])-3]
                if( str(tmp['tags']) != 'None'):
                    strTags = tmp['tags'].replace("<TAGS>","")
                    strTags = strTags.replace("<TAG>","")
                    strTags = strTags.replace("</TAGS>","")
                    strTags = strTags.replace("</TAG>",",")
                    strTags = strTags[:len(strTags)-1] #del the last ","
                    if( strTags != 'None' ):
                        tmp['tags'] = strTags
                    else:
                        tmp['tags'] = "";
            result = data
        else:
            result = data
        return result

    def retrieve(self):
        # query = select([self.viewTable]
        #                ).where(self.viewTable.c['sessionID'] == self.sessionID
        #                        ).where(self.viewTable.c['checked'] == 0 or self.viewTable.c['checked'] == None)
        if( self.type_ in ['camtrap']):
            queryStmt = select([self.viewTable.c['sessionID'],
                                self.viewTable.c['UnicIdentifier'],
                                self.viewTable.c['fk_sensor'],
                                self.viewTable.c['site_name'],
                                self.viewTable.c['site_type'],
                                self.viewTable.c['StartDate'],
                                self.viewTable.c['EndDate'],
                                self.viewTable.c['FK_MonitoredSite'],
                                func.count(self.viewTable.c['sessionID']).label('nb_photo')
                                ]
                           ).where(self.viewTable.c['sessionID'] == self.sessionID).group_by(self.viewTable.c['sessionID'],
                                      self.viewTable.c['UnicIdentifier'],
                                      self.viewTable.c['fk_sensor'],
                                      self.viewTable.c['site_name'],
                                      self.viewTable.c['site_type'],
                                      self.viewTable.c['StartDate'],
                                      self.viewTable.c['EndDate'],
                                      self.viewTable.c['FK_MonitoredSite']
                           )
        else:
            queryStmt = select([self.viewTable]).where(self.viewTable.c['sessionID'] == self.sessionID)
        data = self.session.execute(queryStmt).fetchall()
        data = [dict(row) for row in data]
        print(data)
        return data
        #return self.handleResult(data)

    def patch(self):
        # here patch method
        pass

    def create(self):
        self.manual_validate()

    def manual_validate(self):
        global graphDataDate
        params = self.request.params.mixed()
        ptt = asInt(params['id_ptt'])
        ind_id = asInt(params['id_indiv'])
        user = self.request.authenticated_userid['iss']

        data = json.loads(params['data'])

        procStockDict = {
            'argos': '[sp_validate_Argos_GPS]',
            'gsm': '[sp_validate_GSM]'
        }

        try:
            if isinstance(ind_id, int):
                xml_to_insert = data_to_XML(data)
                stmt = text(""" DECLARE @nb_insert int , @exist int, @error int;
                    exec """ + dbConfig['data_schema'] + """.""" + procStockDict[type_]
                            + """ :id_list, :ind_id , :user , :ptt, @nb_insert OUTPUT, @exist OUTPUT , @error OUTPUT;
                        SELECT @nb_insert, @exist, @error; """
                            ).bindparams(bindparam('id_list', xml_to_insert),
                                         bindparam('ind_id', ind_id),
                                         bindparam('ptt', ptt),
                                         bindparam('user', user))
                nb_insert, exist, error = session.execute(stmt).fetchone()
                transaction.commit()

                graphDataDate['pendingSensorData'] = None
                graphDataDate['indivLocationData'] = None
                return {'inserted': nb_insert, 'existing': exist, 'errors': error}
            else:
                return error_response(None)
        except Exception as err:
            print_exc()
            return error_response(err)


class SensorDatasByType(CustomView):

    item = SensorDatasBySession


    def __init__(self, ref, parent):
        CustomView.__init__(self, ref, parent)
        self.type_ = ref
        self.viewTable = viewDict[ref]
        self.queryType = {'gsm':self.queryWithIndiv,
                     'argos':self.queryWithIndiv,
                     'rfid':self.queryWithSite,
                     'camtrap':self.queryWithSite}
        self.__acl__ = context_permissions['stations']

    def retrieve(self):
        criteria = self.request.params.get('criteria', None)

        queryStmt = self.queryType[self.type_]()
        queryStmt = self.handleCriteria(queryStmt, criteria)
        data = self.session.execute(queryStmt, criteria).fetchall()
        dataResult = [dict(row) for row in data]
        result = [{'total_entries': len(dataResult)}]
        result.append(dataResult)
        return result

    def handleCriteria(self,queryStmt, criteria=None):
        # apply other criteria
        if self.type_ in ['gsm', 'argos'] and not criteria:
            queryStmt = queryStmt.order_by(self.viewTable.c['FK_ptt'].asc())

        return queryStmt

    def queryWithSite(self):
        if( self.type_ in ['camtrap']):
            queryStmt = select([self.viewTable.c['sessionID'],
                                self.viewTable.c['UnicIdentifier'],
                                self.viewTable.c['fk_sensor'],
                                self.viewTable.c['site_name'],
                                self.viewTable.c['site_type'],
                                self.viewTable.c['StartDate'],
                                self.viewTable.c['EndDate'],
                                self.viewTable.c['FK_MonitoredSite'],
                                func.count(self.viewTable.c['sessionID']).label('nb_photo')
                                ]
                           ).group_by(self.viewTable.c['sessionID'],
                                      self.viewTable.c['UnicIdentifier'],
                                      self.viewTable.c['fk_sensor'],
                                      self.viewTable.c['site_name'],
                                      self.viewTable.c['site_type'],
                                      self.viewTable.c['StartDate'],
                                      self.viewTable.c['EndDate'],
                                      self.viewTable.c['FK_MonitoredSite']
                           )
        else:
            queryStmt = select(self.viewTable.c)
        data = self.session.execute(queryStmt).fetchall()
        dataResult = [dict(row) for row in data]
        return queryStmt

    def queryWithIndiv(self):
        selectStmt = select([self.viewTable.c['FK_Individual'],
                             self.viewTable.c['sessionID'],
                             self.viewTable.c['Survey_type'],
                             self.viewTable.c['FK_ptt'],
                             self.viewTable.c['FK_Sensor'],
                             self.viewTable.c['StartDate'],
                             self.viewTable.c['EndDate'],
                             func.count().label('nb'),
                             func.max(self.viewTable.c['date']).label('max_date'),
                             func.min(self.viewTable.c['date']).label('min_date')])

        queryStmt = selectStmt.where(self.viewTable.c['checked'] == 0
                                     ).group_by(self.viewTable.c['FK_Individual'],
                                                self.viewTable.c['Survey_type'],
                                                self.viewTable.c['FK_ptt'],
                                                self.viewTable.c['StartDate'],
                                                self.viewTable.c['EndDate'],
                                                self.viewTable.c['FK_Sensor'],
                                                self.viewTable.c['sessionID'],
                                                )
        return queryStmt

    def create(self):
        pass

    def auto_validation(self):
        session = request.dbsession
        global graphDataDate
        #lancer procedure stocke
        type_ = request.matchdict['type']

        if type_ == 'camtrap':
            return validateCamTrap(request)
        # print ('\n*************** AUTO VALIDATE *************** \n')

        param = request.params.mixed()
        freq = param['frequency']
        listToValidate = json.loads(param['toValidate'])
        user = request.authenticated_userid['iss']

        if freq == 'all':
            freq = 1

        Total_nb_insert = 0
        Total_exist = 0
        Total_error = 0

        if listToValidate == 'all':
            Total_nb_insert, Total_exist, Total_error = auto_validate_ALL_stored_procGSM_Argos(
                user, type_, freq, session)
        else:
            if type_ == 'rfid':
                for row in listToValidate:
                    equipID = row['equipID']
                    sensor = row['FK_Sensor']
                    if equipID == 'null' or equipID is None:
                        equipID = None
                    else:
                        equipID = int(equipID)
                    nb_insert, exist, error = auto_validate_proc_stocRfid(
                        equipID, sensor, freq, user, session)
                    session.commit()
                    Total_exist += exist
                    Total_nb_insert += nb_insert
                    Total_error += error
            else:
                for row in listToValidate:
                    ind_id = row['FK_Individual']
                    ptt = row['FK_ptt']

                    try:
                        ind_id = int(ind_id)
                    except TypeError:
                        ind_id = None

                    nb_insert, exist, error = auto_validate_stored_procGSM_Argos(
                        ptt, ind_id, user, type_, freq, session)
                    session.commit()

                    Total_exist += exist
                    Total_nb_insert += nb_insert
                    Total_error += error

        graphDataDate['pendingSensorData'] = None
        graphDataDate['indivLocationData'] = None
        return {'inserted': Total_nb_insert, 'existing': Total_exist, 'errors': Total_error}


class SensorDatas(CustomView):

    item = SensorDatasByType


RootCore.listChildren.append(('sensorDatas', SensorDatas))
