from pyramid.view import view_config
from sqlalchemy import text, DATETIME, String, select, and_, or_, Integer
from ..Models import (
    Station,
    Observation,
    File,
    File_Type,
    File_ProcessList,
    FrontModules,
    ModuleForms
)
import pandas as pd
import io
from pyramid.response import Response
import uuid
import numpy as np


route_prefix = 'file_import/'


@view_config(route_name=route_prefix + 'getTemplate',
             renderer='json',
             request_method='GET')
def get_excel(request):
    session = request.dbsession

    protocolID = int(request.params["id"])
    protocolName = request.params["name"]
    protocolName.replace(" ", "_")

    stationFields = getTemplateColStation(session)

    if(protocolID == 0):
        fields = stationFields
    else:
        newObs = Observation(FK_ProtocoleType=protocolID)
        obsFields = getTemplateColObs(session, protocolID)
        fields = stationFields + obsFields

    # TODO : order columns by form order

    df = pd.DataFrame(data=[], columns=fields)
    fout = io.BytesIO()
    writer = pd.ExcelWriter(fout)
    df.to_excel(writer, sheet_name=newObs.GetType().Name, index=False)
    writer.save()
    file = fout.getvalue()

    return Response(
        file,
        content_disposition="attachment; filename=" + protocolName + ".xlsx",
        content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')


def getTemplateColObs(session, protocolID):
    newObs = Observation(FK_ProtocoleType=protocolID)
    obsForm = newObs.getForm(type_=protocolID)
    obsFields = []

    for obj in obsForm['fieldsets']:
        obsFields.extend(obj['fields'])
    obsFields = list(filter(lambda y: y not in ['creationDate', 'ID'], obsFields))
    return list(set(obsFields))


def getTemplateColStation(session):
    newSta = Station(FK_StationType=1)
    stationForm = newSta.getForm(type_=1)

    stationFields = []
    for obj in stationForm['fieldsets']:
        stationFields.extend(obj['fields'])
    stationFields = list(map(lambda x: 'Station_'+x,
                            list(filter(lambda y: y not in ['creationDate', 'updateSite', 'FieldWorkers', 'ID']
                                    , stationFields))))
    
    stationFields.extend(['Station_FieldWorker1',
                          'Station_FieldWorker2',
                          'Station_FieldWorker3'])
    return list(set(stationFields))


def get_props(attrs):
    protocolAttrs = []
    commentField = False
    for s in attrs:
        name = s["name"]
        protocolAttrs.append(name)
        if(name == "Comments"):
            commentField = "Comments"
    if(commentField):
        protocolAttrs.append(commentField)

    return protocolAttrs


@view_config(route_name=route_prefix + 'getExcelFile',
             renderer='json',
             request_method='POST')
def import_file(request):
    try:

        session = request.dbsession
        data = request.get_array(field_name='excelFile')
        fileName = request.POST['excelFile'].filename
        columns = data[0]
        protoId = int(request.POST['protoId'])

        errorColumn = checkColumns(protoId, columns, session)

        if protoId != 0 and errorColumn:
            request.response.status_code = 510
            return 'Excel columns not coresponding: '+' '.join(str(x) for x in errorColumn)

        df = pd.DataFrame(data=data[1:], columns=data[0])
        df.convert_objects(convert_dates=True, convert_numeric=True)
        userId = request.authenticated_userid['iss']
        tableName = 'TImport_excel_' + str(uuid.uuid4().hex)
        fileType = session.query(File_Type
                                 ).filter(File_Type.Name == 'excel_protocol'
                                          ).one()
        file = File(Name=fileName,
                    ObjectName='Observation',
                    ObjectType=protoId,
                    Creator=userId,
                    TempTable_GUID=tableName,
                    Type=fileType
                    )
        session.add(file)
        session.flush()
        command = "IF OBJECT_ID ('" + tableName + "') IS NOT NULL "
        command = command + ''' BEGIN  DROP TABLE "''' + tableName + \
            '''" END CREATE TABLE "''' + tableName + '''" ( "ID" int) '''
        session.execute(command)
        session.commit()
        df.index += 2
        df = df.replace('', np.nan, regex=True)
        df.to_sql(tableName,
                  session.get_bind(),
                  if_exists='replace',
                  dtype={'index': Integer,
                         'Station_StationDate': DATETIME,
                         'Station_FieldWorker1': String,
                         'Station_FieldWorker2': String,
                         'Station_FieldWorker3': String
                         })

    except:
        request.response.status = 530
        session.rollback()
        raise
    return file.ID


def checkColumns(protoID, excelCols, session):
    stationColumns = getTemplateColStation(session)
    obsFields = getTemplateColObs(session, protoID)
    s = set(stationColumns+obsFields)
    p = set(excelCols)
    # duplicatedCols = set([x for x in excelCols if excelCols.count(x) > 1])
    # if len(duplicatedCols) > 0:
    #     return False
    return list(p-s)

@view_config(route_name=route_prefix + 'processList',
             renderer='json',
             request_method='GET')
def getProcessLis(request):
    session = request.dbsession
    data = request.params.mixed()
    fileType = session.query(File_Type).filter(File_Type.Name == data['fileType']).one()

    processList = [{'name': process.Name,
                    'type': process.ProcessType,
                    'descriptionFr': process.DescriptionFr,
                    'descriptionEn': process.DescriptionEn } for process in fileType.ProcessList]
    return processList


@view_config(route_name=route_prefix + 'id/columns',
             renderer='json',
             request_method='GET')
def getcolumns(request):
    session = request.dbsession
    file = session.query(File).get(request.matchdict['id'])
    cols = file.tempTable.c.keys()
    cols.remove('index')
    return cols
