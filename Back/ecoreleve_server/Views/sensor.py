from pyramid.view import view_config
from ..Models import (
    Sensor,
    SensorType,
    SensorDynPropValue,
    SensorDynProp,
    MonitoredSite,
    Base,
    SensorList
)
from ..GenericObjets.FrontModules import FrontModules
from ..GenericObjets import ListObjectWithDynProp
import json
from datetime import datetime
import pandas as pd
from sqlalchemy import select, desc, join, distinct
from collections import OrderedDict
import io
from pyramid.response import Response
from ..controllers.security import routes_permission
from sqlalchemy.exc import IntegrityError


prefix = 'sensors'


@view_config(route_name=prefix + '/action',
             renderer='json',
             request_method='GET')
def actionOnSensors(request):
    dictActionFunc = {
        'count': count_,
        'forms': getForms,
        '0': getForms,
        'getFields': getFields,
        'getFilters': getFilters,
        'getModels': getSensorModels,
        'getCompany': getCompany,
        'getSerialNumber': getSerialNumber,
        'getType': getSensorType,
        'getUnicIdentifier': getUnicIdentifier
    }
    actionName = request.matchdict['action']
    return dictActionFunc[actionName](request)


def count_(request=None, listObj=None):
    if request is not None:
        data = request.params
        searchInfo = {}
        if 'criteria' in data:
            data['criteria'] = json.loads(data['criteria'])
            if data['criteria'] != {}:
                searchInfo['criteria'] = [obj for obj in data[
                    'criteria'] if obj['Value'] != str(-1)]

        listObj = ListObjectWithDynProp(Sensor)
        count = listObj.count(searchInfo=searchInfo)
    else:
        count = listObj.count()
    return count


def getFilters(request):
    ModuleType = 'SensorFilter'
    filtersList = Sensor().GetFilters(ModuleType)
    filters = {}
    for i in range(len(filtersList)):
        filters[str(i)] = filtersList[i]
    return filters


def getForms(request):
    session = request.dbsession
    typeSensor = request.params['ObjectType']
    ModuleName = 'SensorForm'
    Conf = session.query(FrontModules).filter(
        FrontModules.Name == ModuleName).first()
    newSensor = Sensor(FK_SensorType=typeSensor)
    newSensor.init_on_load()
    schema = newSensor.GetDTOWithSchema(Conf, 'edit')

    return schema


def getFields(request):
    ModuleType = request.params['name']
    if ModuleType == 'default':
        ModuleType = 'SensorFilter'
    cols = Sensor().GetGridFields(ModuleType)

    return cols


def getSensorModels(request):
    session = request.dbsession
    sensorType = request.params['sensorType']
    query = select([distinct(Sensor.Model)]).where(
        Sensor.FK_SensorType == sensorType)
    response = getData(query, session)

    return response


def getCompany(request):
    session = request.dbsession
    sensorType = request.params['sensorType']
    query = select([distinct(Sensor.Compagny)]).where(
        Sensor.FK_SensorType == sensorType)
    response = getData(query, session)

    return response


def getSerialNumber(request):
    session = request.dbsession
    sensorType = request.params['sensorType']
    query = select([distinct(Sensor.SerialNumber)]).where(
        Sensor.FK_SensorType == sensorType)
    response = getData(query, session)

    return response


def getUnicIdentifier(request):
    session = request.dbsession
    sensorType = request.params['sensorType']
    query = select([Sensor.UnicIdentifier.label('label'), Sensor.ID.label(
        'val')]).where(Sensor.FK_SensorType == sensorType)
    response = [OrderedDict(row) for row in session.execute(query).fetchall()]

    return response


def getData(query, session):
    result = session.execute(query).fetchall()
    response = []
    for row in result:
        curRow = OrderedDict(row)
        for key in curRow:
            if curRow[key] is not None:
                response.append(curRow[key])
    return response


def getSensorType(request):
    session = request.dbsession
    query = select([SensorType.ID.label('val'),
                    SensorType.Name.label('label')])
    response = [OrderedDict(row) for row in session.execute(query).fetchall()]

    return response


@view_config(route_name=prefix + '/id', renderer='json', request_method='GET')
def getSensor(request):
    session = request.dbsession
    id = request.matchdict['id']
    curSensor = session.query(Sensor).get(id)
    curSensor.LoadNowValues()

    if 'FormName' in request.params:
        try:
            DisplayMode = request.params['DisplayMode']
        except:
            DisplayMode = 'display'
        Conf = session.query(FrontModules).filter(
            FrontModules.Name == 'SensorForm').first()
        response = curSensor.GetDTOWithSchema(Conf, DisplayMode)
    elif 'geo' in request.params:
        geoJson = []
        result = {'type': 'FeatureCollection', 'features': geoJson}
        response = result
    else:
        response = curSensor.GetFlatObject()

    return response


@view_config(route_name=prefix + '/id/history',
             renderer='json',
             request_method='GET',
             permission=routes_permission[prefix]['GET'])
def getSensorHistory(request):
    from ..Models import thesaurusDictTraduction

    session = request.dbsession
    _id = request.matchdict['id']

    tableJoin = join(SensorDynPropValue, SensorDynProp,
                     SensorDynPropValue.FK_SensorDynProp == SensorDynProp.ID)
    query = select([SensorDynPropValue, SensorDynProp.Name]
                   ).select_from(tableJoin
                                 ).where(SensorDynPropValue.FK_Sensor == _id
                                         ).order_by(desc(SensorDynPropValue.StartDate))

    result = session.execute(query).fetchall()
    response = []

    userLng = request.authenticated_userid['userlanguage']
    for row in result:
        curRow = OrderedDict(row)
        dictRow = {}
        for key in curRow:
            if curRow[key] is not None:
                if 'Value' in key:
                    if curRow[key] in thesaurusDictTraduction:
                        dictRow['value'] = thesaurusDictTraduction[curRow[key]][userLng]
                    else:
                        dictRow['value'] = curRow[key]
                elif 'FK' not in key:
                    dictRow[key] = curRow[key]
        dictRow['StartDate'] = curRow[
            'StartDate'].strftime('%Y-%m-%d %H:%M:%S')
        response.append(dictRow)

    return response


@view_config(route_name=prefix + '/id/equipment',
             renderer='json',
             request_method='GET')
def getSensorEquipment(request):
    session = request.dbsession
    _id = request.matchdict['id']
    curSensor = session.query(Sensor).get(_id)
    curSensorType = curSensor.GetType().Name

    if ('RFID' in curSensorType.upper()):
        table = Base.metadata.tables['MonitoredSiteEquipment']
        joinTable = join(table, Sensor, table.c['FK_Sensor'] == Sensor.ID)
        joinTable = join(joinTable, MonitoredSite, table.c[
                         'FK_MonitoredSite'] == MonitoredSite.ID)
        query = select([table.c['StartDate'],
                        table.c['EndDate'],
                        Sensor.UnicIdentifier,
                        MonitoredSite.Name,
                        MonitoredSite.ID.label('MonitoredSiteID')]
                       ).select_from(joinTable
                                     ).where(table.c['FK_Sensor'] == _id).order_by(desc(table.c['StartDate']))

    else :
        table = Base.metadata.tables['IndividualEquipment']
        joinTable = join(table, Sensor, table.c['FK_Sensor'] == Sensor.ID)
        query = select([table.c['StartDate'],
                        table.c['EndDate'],
                        table.c['FK_Individual'],
                        Sensor.UnicIdentifier]).select_from(joinTable
                                                            ).where(table.c['FK_Sensor'] == _id).order_by(desc(table.c['StartDate']))

    result = session.execute(query).fetchall()
    response = []
    for row in result:
        curRow = OrderedDict(row)
        curRow['StartDate'] = curRow['StartDate'].strftime('%Y-%m-%d %H:%M:%S')
        curRow['EndDate'] = curRow['EndDate'].strftime(
            '%Y-%m-%d %H:%M:%S') if curRow['EndDate'] is not None else None
        curRow['format'] = 'YYYY-MM-DD HH:mm:ss'
        response.append(curRow)

    return response


@view_config(route_name=prefix + '/id',
             renderer='json',
             request_method='DELETE',
             permission=routes_permission[prefix]['DELETE'])
def deleteSensor(request):
    session = request.dbsession
    id_ = request.matchdict['id']
    curSensor = session.query(Sensor).get(id_)
    session.delete(curSensor)

    return True


@view_config(route_name=prefix + '/id',
             renderer='json',
             request_method='PUT',
             permission=routes_permission[prefix]['PUT'])
def updateSensor(request):
    session = request.dbsession
    data = request.json_body
    _id = request.matchdict['id']
    curSensor = session.query(Sensor).get(_id)
    curSensor.LoadNowValues()
    curSensor.UpdateFromJson(data)

    return {}


@view_config(route_name=prefix + '/insert',
             renderer='json',
             request_method='POST',
             permission=routes_permission[prefix]['POST'])
def insertSensor(request):
    data = request.json_body
    if not isinstance(data, list):
        return insertOneNewSensor(request)
    else:
        return


def insertOneNewSensor(request):
    session = request.dbsession
    data = {}
    for items, value in request.json_body.items():
        data[items] = value

    try:
        sensorType = int(data['FK_SensorType'])
        newSensor = Sensor(FK_SensorType=sensorType,
                           creationDate=datetime.now())
        newSensor.SensorType = session.query(SensorType).filter(
            SensorType.ID == sensorType).first()
        newSensor.init_on_load()
        newSensor.UpdateFromJson(data)

        session.add(newSensor)
        session.flush()
        response = {'ID': newSensor.ID}

    except IntegrityError as e:
        session.rollback()
        request.response.status_code = 520
        response = request.response
        response.text = "This identifier is already used for another sensor"
        pass

    return response


@view_config(route_name=prefix, renderer='json', request_method='GET')
def searchSensor(request):
    session = request.dbsession
    data = request.params.mixed()
    searchInfo = {}
    searchInfo['criteria'] = []
    if 'criteria' in data:
        data['criteria'] = json.loads(data['criteria'])
        if data['criteria'] != {}:
            searchInfo['criteria'] = [obj for obj in data[
                'criteria'] if obj['Value'] != str(-1)]

    searchInfo['order_by'] = json.loads(data['order_by'])
    searchInfo['offset'] = json.loads(data['offset'])
    searchInfo['per_page'] = json.loads(data['per_page'])

    ModuleType = 'SensorFilter'
    moduleFront = session.query(FrontModules).filter(
        FrontModules.Name == ModuleType).one()

    listObj = SensorList(moduleFront)
    dataResult = listObj.GetFlatDataList(searchInfo)

    countResult = listObj.count(searchInfo)
    result = [{'total_entries': countResult}]
    result.append(dataResult)

    return result


@view_config(route_name=prefix + '/export',
             renderer='json',
             request_method='GET')
def sensors_export(request):
    session = request.dbsession
    data = request.params.mixed()
    searchInfo = {}
    searchInfo['criteria'] = []
    if 'criteria' in data:
        data['criteria'] = json.loads(data['criteria'])
        if data['criteria'] != {}:
            searchInfo['criteria'] = [obj for obj in data[
                'criteria'] if obj['Value'] != str(-1)]

    searchInfo['order_by'] = []

    ModuleType = 'SensorFilter'
    moduleFront = session.query(FrontModules).filter(
        FrontModules.Name == ModuleType).one()

    listObj = SensorList(moduleFront)
    dataResult = listObj.GetFlatDataList(searchInfo)

    df = pd.DataFrame.from_records(dataResult,
                                   columns=dataResult[0].keys(),
                                   coerce_float=True)

    fout = io.BytesIO()
    writer = pd.ExcelWriter(fout)
    df.to_excel(writer, sheet_name='Sheet1')
    writer.save()
    file = fout.getvalue()

    dt = datetime.now().strftime('%d-%m-%Y')
    return Response(
        file,
        content_disposition="attachment; filename=sensor_export_" + dt + ".xlsx",
        ontent_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
