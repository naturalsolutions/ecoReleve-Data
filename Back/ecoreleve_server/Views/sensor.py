from pyramid.view import view_config
from ..Models import (
    Sensor,
    SensorType,
    SensorDynPropValue,
    SensorDynProp,
    Equipment,
    Individual,
    MonitoredSite,
    Base,
    SensorList
    )
from ..GenericObjets.FrontModules import FrontModules
from ..GenericObjets import ListObjectWithDynProp
import json, itertools
from datetime import datetime
import datetime as dt
import pandas as pd
import numpy as np
from sqlalchemy import select, and_,cast, DATE,func,desc,join, distinct,outerjoin,asc
from sqlalchemy.orm import aliased
from pyramid.security import NO_PERMISSION_REQUIRED
from traceback import print_exc
from collections import OrderedDict
from datetime import datetime


prefix = 'sensors'

# ------------------------------------------------------------------------------------------------------------------------- #
@view_config(route_name= prefix+'/action', renderer='json', request_method = 'GET')
#@view_config(route_name= prefix+'/id/history/action', renderer='json', request_method = 'GET')
def actionOnSensors(request):
    dictActionFunc = {
    'count' : count_,
    'forms' : getForms,
    '0' : getForms,
    'getFields': getFields,
    'getFilters': getFilters,
    'getModels' : getSensorModels,
    'getCompany' : getCompany,
    'getSerialNumber' : getSerialNumber,
    'getType' : getSensorType,
    'getUnicIdentifier' : getUnicIdentifier
    }
    actionName = request.matchdict['action']
    return dictActionFunc[actionName](request)

def count_ (request = None,listObj = None):
    session = request.dbsession
    if request is not None : 
        data = request.params
        if 'criteria' in data: 
            data['criteria'] = json.loads(data['criteria'])
            if data['criteria'] != {} :
                searchInfo['criteria'] = [obj for obj in data['criteria'] if obj['Value'] != str(-1) ]

        listObj = ListObjectWithDynProp(Sensor)
        count = listObj.count(searchInfo = searchInfo)
    else : 
        count = listObj.count()
    return count 

def getFilters (request):
    ModuleType = 'SensorFilter'
    filtersList = Sensor().GetFilters(ModuleType)
    filters = {}
    for i in range(len(filtersList)) :
        filters[str(i)] = filtersList[i]
    return filters

def getForms(request) :
    session = request.dbsession
    typeSensor = request.params['ObjectType']
    ModuleName = 'SensorForm'
    Conf = session.query(FrontModules).filter(FrontModules.Name==ModuleName ).first()
    newSensor = Sensor(FK_SensorType = typeSensor)
    newSensor.init_on_load()
    schema = newSensor.GetDTOWithSchema(Conf,'edit')

    return schema

def getFields(request) :
    session = request.dbsession
    ModuleType = request.params['name']
    if ModuleType == 'default' :
        ModuleType = 'SensorFilter'
    cols = Sensor().GetGridFields(ModuleType)

    return cols

def getSensorModels(request):
    session = request.dbsession
    sensorType = request.params['sensorType']
    query = select([distinct(Sensor.Model)]).where(Sensor.FK_SensorType == sensorType)
    response = getData(query,session)

    return response

def getCompany (request):
    session = request.dbsession
    sensorType = request.params['sensorType']
    query = select([distinct(Sensor.Compagny)]).where(Sensor.FK_SensorType == sensorType)
    response = getData(query,session)

    return response

def getSerialNumber (request):
    session = request.dbsession
    sensorType = request.params['sensorType']
    query = select([distinct(Sensor.SerialNumber)]).where(Sensor.FK_SensorType == sensorType)
    response = getData(query,session)

    return response

def getUnicIdentifier (request):
    session = request.dbsession
    sensorType = request.params['sensorType']
    query = select([Sensor.UnicIdentifier.label('label'),Sensor.ID.label('val')]).where(Sensor.FK_SensorType == sensorType)
    response = [ OrderedDict(row) for row in session.execute(query).fetchall()]

    return response

def getData(query,session):
    result = session.execute(query).fetchall()
    response = []
    for row in result:
        curRow = OrderedDict(row)
        dictRow = {}
        for key in curRow :
            if curRow[key] is not None :
                response.append(curRow[key])
    return response

def getSensorType(request):
    session = request.dbsession
    query = select([SensorType.ID.label('val'), SensorType.Name.label('label')])
    response = [ OrderedDict(row) for row in session.execute(query).fetchall()]

    return response

# ------------------------------------------------------------------------------------------------------------------------- #
@view_config(route_name= prefix+'/id', renderer='json', request_method = 'GET')
def getSensor(request):
    session = request.dbsession
    id = request.matchdict['id']
    curSensor = session.query(Sensor).get(id)
    curSensor.LoadNowValues()

    # if Form value exists in request --> return data with schema else return only data
    if 'FormName' in request.params :
        ModuleName = request.params['FormName']
        try :
            DisplayMode = request.params['DisplayMode']
        except : 
            DisplayMode = 'display'
        Conf = session.query(FrontModules).filter(FrontModules.Name=='SensorForm').first()
        response = curSensor.GetDTOWithSchema(Conf,DisplayMode)
    elif 'geo' in request.params :
        geoJson=[]
        result = {'type':'FeatureCollection', 'features':geoJson}
        response = result

    return response

# ------------------------------------------------------------------------------------------------------------------------- #

@view_config(route_name= prefix+'/id/history', renderer='json', request_method = 'GET')
def getSensorHistory(request):
    session = request.dbsession
    id = request.matchdict['id']
    curSensor = session.query(Sensor).get(id)
    curSensorType = curSensor.GetType().Name

    if ('RFID' in curSensorType.upper()) :
        table = Base.metadata.tables['MonitoredSiteEquipment']
        joinTable = join(table,Sensor, table.c['FK_Sensor'] == Sensor.ID)
        joinTable = join(joinTable,MonitoredSite, table.c['FK_MonitoredSite'] == MonitoredSite.ID)
        query = select([table.c['StartDate'],table.c['EndDate'],Sensor.UnicIdentifier,MonitoredSite.Name]).select_from(joinTable
            ).where(table.c['FK_Sensor'] == id
            ).order_by(desc(table.c['StartDate']))

    elif (curSensorType.lower() in ['gsm','satellite','vhf']):
        table = Base.metadata.tables['IndividualEquipment']
        joinTable = join(table,Sensor, table.c['FK_Sensor'] == Sensor.ID)
        query = select([table.c['StartDate'],table.c['EndDate'],table.c['FK_Individual'],Sensor.UnicIdentifier]).select_from(joinTable
            ).where(table.c['FK_Sensor'] == id
            ).order_by(desc(table.c['StartDate']))
    else :
        return 'bad request'

    result = session.execute(query).fetchall()
    response = []
    for row in result:
        curRow = OrderedDict(row)
        curRow['StartDate'] = curRow['StartDate'].timestamp()
        curRow['EndDate'] = curRow['EndDate'].timestamp() if curRow['EndDate'] is not None else None
        response.append(curRow)

    return response

# ------------------------------------------------------------------------------------------------------------------------- #
@view_config(route_name= prefix+'/id', renderer='json', request_method = 'DELETE')
def deleteSensor(request):
    session = request.dbsession
    id_ = request.matchdict['id']
    curSensor = session.query(Sensor).get(id_)
    session.delete(Sensor)

    return True

# ------------------------------------------------------------------------------------------------------------------------- #
@view_config(route_name= prefix+'/id', renderer='json', request_method = 'PUT')
def updateSensor(request):
    session = request.dbsession
    data = request.json_body
    id = request.matchdict['id']
    curSensor = session.query(Sensor).get(id)
    curSensor.LoadNowValues()
    curSensor.UpdateFromJson(data)

    return {}

# ------------------------------------------------------------------------------------------------------------------------- #
@view_config(route_name= prefix + '/insert', renderer='json', request_method = 'POST')
def insertSensor(request):
    data = request.json_body
    if not isinstance(data,list):
        return insertOneNewSensor(request)
    else :
        print('_______INsert LIST')
        #transaction.commit()
        #return insertListNewSensord(request)

# ------------------------------------------------------------------------------------------------------------------------- #
def insertOneNewSensor (request) :
    session = request.dbsession
    data = {}
    for items , value in request.json_body.items() :
        if value != "" :
            data[items] = value

    sensorType = int(data['FK_SensorType'])
    newSensor = Sensor(FK_SensorType = sensorType , creationDate = datetime.now())
    newSensor.SensorType = session.query(SensorType).filter(SensorType.ID== sensorType).first()
    newSensor.init_on_load()
    newSensor.UpdateFromJson(data)

    session.add(newSensor)
    session.flush()
 
    return {'ID': newSensor.ID}

# ------------------------------------------------------------------------------------------------------------------------- #
@view_config(route_name= prefix, renderer='json', request_method = 'GET')
def searchSensor(request):
    session = request.dbsession
    data = request.params.mixed()
    searchInfo = {}
    searchInfo['criteria'] = []
    if 'criteria' in data: 
        data['criteria'] = json.loads(data['criteria'])
        if data['criteria'] != {} :
            searchInfo['criteria'] = [obj for obj in data['criteria'] if obj['Value'] != str(-1) ]

    searchInfo['order_by'] = json.loads(data['order_by'])
    searchInfo['offset'] = json.loads(data['offset'])
    searchInfo['per_page'] = json.loads(data['per_page'])

    ModuleType = 'SensorFilter'
    moduleFront  = session.query(FrontModules).filter(FrontModules.Name == ModuleType).one()

    listObj = SensorList(moduleFront)
    dataResult = listObj.GetFlatDataList(searchInfo)

    countResult = listObj.count(searchInfo)
    result = [{'total_entries':countResult}]
    result.append(dataResult)

    return result

@view_config(route_name=prefix + '/export', renderer='csv', request_method='POST')
def sensors_export(request):
    session = request.dbsession
    query = select(Sensor.__table__.c)
    criteria = request.json_body.get('criteria', {})
    searchInfo = []
    if criteria != {}:
        for elem in criteria:
            if elem['Value'] != str(-1):
                searchInfo.append(elem)

    if searchInfo !=[]:
        for ele in searchInfo :
            if (ele['Operator'] == 'Is'):
                query = query.where(Sensor.__table__.c[ele['Column']] == ele['Value'])
            else:
                query = query.where(Sensor.__table__.c[ele['Column']] != ele['Value'])

    # Run query
    data = session.execute(query).fetchall()
    header = [col.name for col in Sensor.__table__.c]
    rows = [[val for val in row] for row in data]
    
    filename = 'object_search_export.csv'
    request.response.content_disposition = 'attachment;filename=' + filename
    return {
         'header': header,
         'rows': rows,
    }




