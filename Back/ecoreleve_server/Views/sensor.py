from pyramid.view import view_config
from ..Models import (
    DBSession,
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
import transaction
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
@view_config(route_name= prefix+'/action', renderer='json', request_method = 'GET', permission = NO_PERMISSION_REQUIRED)
#@view_config(route_name= prefix+'/id/history/action', renderer='json', request_method = 'GET', permission = NO_PERMISSION_REQUIRED)
def actionOnSensors(request):
    print ('\n*********************** Action **********************\n')
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

def count_ (request = None,listObj = None) :
    print('*****************  Sensor COUNT***********************')
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

    print(count)
    return count 

def getFilters (request):
    ModuleType = 'SensorFilter'
    filtersList = Sensor().GetFilters(ModuleType)
    filters = {}
    for i in range(len(filtersList)) :
        filters[str(i)] = filtersList[i]
    transaction.commit()
    return filters

def getForms(request) :
    typeSensor = request.params['ObjectType']
    print('***************** GET FORMS ***********************')
    ModuleName = 'SensorForm'
    Conf = DBSession.query(FrontModules).filter(FrontModules.Name==ModuleName ).first()
    newSensor = Sensor(FK_SensorType = typeSensor)
    newSensor.init_on_load()
    schema = newSensor.GetDTOWithSchema(Conf,'edit')
    transaction.commit()
    return schema

def getFields(request) :

    ModuleType = request.params['name']
    if ModuleType == 'default' :
        ModuleType = 'SensorFilter'
    cols = Sensor().GetGridFields(ModuleType)
    transaction.commit()
    return cols

def getSensorModels(request):
    sensorType = request.params['sensorType']
    query = select([distinct(Sensor.Model)]).where(Sensor.FK_SensorType == sensorType)
    response = getData(query)
    transaction.commit()
    return response

def getCompany (request):
    sensorType = request.params['sensorType']
    query = select([distinct(Sensor.Compagny)]).where(Sensor.FK_SensorType == sensorType)
    response = getData(query)
    transaction.commit()
    return response

def getSerialNumber (request):
    sensorType = request.params['sensorType']
    query = select([distinct(Sensor.SerialNumber)]).where(Sensor.FK_SensorType == sensorType)
    response = getData(query)
    transaction.commit()
    return response

def getUnicIdentifier (request):
    sensorType = request.params['sensorType']
    query = select([Sensor.UnicIdentifier.label('label'),Sensor.ID.label('val')]).where(Sensor.FK_SensorType == sensorType)
    response = [ OrderedDict(row) for row in DBSession.execute(query).fetchall()]
    transaction.commit()
    return response

def getData(query):
    result = DBSession.execute(query).fetchall()
    response = []
    for row in result:
        curRow = OrderedDict(row)
        dictRow = {}
        for key in curRow :
            if curRow[key] is not None :
                response.append(curRow[key])
                transaction.commit()
    return response

def getSensorType(request):
    query = select([SensorType.ID.label('val'), SensorType.Name.label('label')])
    response = [ OrderedDict(row) for row in DBSession.execute(query).fetchall()]
    transaction.commit()
    return response

# ------------------------------------------------------------------------------------------------------------------------- #
@view_config(route_name= prefix+'/autocomplete', renderer='json', request_method = 'GET',permission = NO_PERMISSION_REQUIRED )
def autocomplete (request):
    criteria = request.params['term']
    prop = request.matchdict['prop']
    if isinstance(prop,int):
        table = Base.metadata.tables['SensorDynPropValuesNow']
        query = select([table.c['ValueString'].label('label'),table.c['ValueString'].label('value')]
            ).where(table.c['FK_SensorDynProp']== prop)
        query = query.where(table.c['ValueString'].like('%'+criteria+'%')).order_by(asc(table.c['ValueString']))
    else: 
        table = Base.metadata.tables['Sensor']
        query = select([table.c[prop].label('value'),table.c[prop].label('label')])
        query = query.where(table.c[prop].like('%'+criteria+'%'))
    return [dict(row) for row in DBSession.execute(query).fetchall()]

# ------------------------------------------------------------------------------------------------------------------------- #
@view_config(route_name= prefix+'/id', renderer='json', request_method = 'GET',permission = NO_PERMISSION_REQUIRED)
def getSensor(request):
    print('***************** GET Sensor ***********************')
    id = request.matchdict['id']
    curSensor = DBSession.query(Sensor).get(id)
    curSensor.LoadNowValues()

    # if Form value exists in request --> return data with schema else return only data
    if 'FormName' in request.params :
        ModuleName = request.params['FormName']
        try :
            DisplayMode = request.params['DisplayMode']
        except : 
            DisplayMode = 'display'
        Conf = DBSession.query(FrontModules).filter(FrontModules.Name=='SensorForm').first()
        response = curSensor.GetDTOWithSchema(Conf,DisplayMode)
    elif 'geo' in request.params :
        geoJson=[]
        result = {'type':'FeatureCollection', 'features':geoJson}
        response = result

    transaction.commit()
    return response

# ------------------------------------------------------------------------------------------------------------------------- #

@view_config(route_name= prefix+'/id/history', renderer='json', request_method = 'GET',permission = NO_PERMISSION_REQUIRED)
def getSensorHistory(request):
    print('sensor history******************')
    id = request.matchdict['id']
    joinTable = outerjoin(Equipment,Individual,Equipment.FK_Individual==Individual.ID).outerjoin(MonitoredSite,Equipment.FK_MonitoredSite==MonitoredSite.ID)
    query = select([Equipment.ID, Individual.UnicIdentifier, MonitoredSite.Name, Equipment.StartDate, Equipment.Deploy,Equipment.FK_MonitoredSite,Equipment.FK_Individual]
        ).select_from(joinTable).where(Equipment.FK_Sensor == id).order_by(desc(Equipment.StartDate))
    result = DBSession.execute(query).fetchall()
    response = []
    for row in result:
        curRow = OrderedDict(row)
        if curRow['Deploy'] == 1 : 
            curRow['Deploy'] = 'Deployed'
        else : 
            curRow['Deploy'] = 'Removed'
        response.append(curRow)

    return response

# ------------------------------------------------------------------------------------------------------------------------- #
@view_config(route_name= prefix+'/id', renderer='json', request_method = 'DELETE',permission = NO_PERMISSION_REQUIRED)
def deleteSensor(request):
    id_ = request.matchdict['id']
    curSensor = DBSession.query(Sensor).get(id_)
    DBSession.delete(Sensor)
    transaction.commit()
    return True

# ------------------------------------------------------------------------------------------------------------------------- #
@view_config(route_name= prefix+'/id', renderer='json', request_method = 'PUT')
def updateSensor(request):
    print('*********************** UPDATE Sensor *****************')
    data = request.json_body
    id = request.matchdict['id']
    curSensor = DBSession.query(Sensor).get(id)
    curSensor.LoadNowValues()
    curSensor.UpdateFromJson(data)
    transaction.commit()
    return {}

# ------------------------------------------------------------------------------------------------------------------------- #
@view_config(route_name= prefix + '/insert', renderer='json', request_method = 'POST')
def insertSensor(request):
    print('_______INsertion____________________')
    data = request.json_body
    if not isinstance(data,list):
        print('_______INsert ROW *******')
        return insertOneNewSensor(request)
    else :
        print('_______INsert LIST')
        #transaction.commit()
        #return insertListNewSensord(request)

# ------------------------------------------------------------------------------------------------------------------------- #
def insertOneNewSensor (request) :
    data = {}
    for items , value in request.json_body.items() :
        if value != "" :
            data[items] = value

    print('______________ sensor type__________________')
    print(data['FK_SensorType'])
    #newSensor = Sensor(FK_SensorType = data['FK_SensorType'], creator = request.authenticated_userid)
    sensorType = int(data['FK_SensorType'])
    newSensor = Sensor(FK_SensorType = sensorType , creationDate = datetime.now())

    newSensor.SensorType = DBSession.query(SensorType).filter(SensorType.ID== sensorType).first()
    newSensor.init_on_load()
    newSensor.UpdateFromJson(data)
    print (newSensor.__dict__)
    DBSession.add(newSensor)
    DBSession.flush()
    # transaction.commit()
    return {'ID': newSensor.ID}

# ------------------------------------------------------------------------------------------------------------------------- #
@view_config(route_name= prefix, renderer='json', request_method = 'GET', permission = NO_PERMISSION_REQUIRED)
def searchSensor(request):
    data = request.params.mixed()
    print('*********data*************')
    print(data)
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
    moduleFront  = DBSession.query(FrontModules).filter(FrontModules.Name == ModuleType).one()
    print('**criteria********' )
    print(searchInfo['criteria'])

    listObj = SensorList(moduleFront)
    dataResult = listObj.GetFlatDataList(searchInfo)

    countResult = listObj.count(searchInfo)
    result = [{'total_entries':countResult}]
    result.append(dataResult)
    transaction.commit()
    return result

@view_config(route_name=prefix + '/export', renderer='csv', request_method='POST', permission = NO_PERMISSION_REQUIRED)
def sensors_export(request):
    print('**************************** export ********')
    query = select(Sensor.__table__.c)
    criteria = request.json_body.get('criteria', {})
    searchInfo = []
    if criteria != {}:
        for elem in criteria:
            if elem['Value'] != str(-1):
                searchInfo.append(elem)
    print(searchInfo)
    if searchInfo !=[]:
        for ele in searchInfo :
            if (ele['Operator'] == 'Is'):
                query = query.where(Sensor.__table__.c[ele['Column']] == ele['Value'])
            else:
                query = query.where(Sensor.__table__.c[ele['Column']] != ele['Value'])

    # Run query
    data = DBSession.execute(query).fetchall()
    header = [col.name for col in Sensor.__table__.c]
    rows = [[val for val in row] for row in data]
    
    filename = 'object_search_export.csv'
    request.response.content_disposition = 'attachment;filename=' + filename
    return {
         'header': header,
         'rows': rows,
    }




