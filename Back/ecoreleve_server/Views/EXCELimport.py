import re, operator, transaction
from datetime import datetime
from pyramid.view import view_config
from sqlalchemy import select, insert, text, desc, bindparam, or_, outerjoin, func, and_ ,create_engine
from sqlalchemy.exc import IntegrityError
import json
from ..Models import (
    DBSession,
   Station,
   Observation,
    ProtocoleType,
    dbConfig
)
from collections import OrderedDict
from traceback import print_exc
from ..utils.datetime import parse
from ..utils.generator import Generator
from ..renderers import *
import pandas as pd
import numpy as np 
from pyramid import threadlocal
import io
from pyramid.response import Response ,FileResponse
#import pyramid_excel as excel



# ------------------------------------------------------------------------------------------------------------------------- #
route_prefix = 'file_import/'

@view_config(route_name=route_prefix+'getTemplate', renderer='json' ,request_method='GET')
def get_excel (request):
    protocolID = int(request.params["id"])
    protocolName = request.params["name"]
    protocolName.replace(" ", "_")
    stationFields = Station.GetImportTemplate()
    
    if(protocolID == 0):
        fields = stationFields

    else:
    
        newObs = Observation(FK_ProtocoleType = protocolID)
        allprops = newObs.GetAllProp()
        protocolFields = get_props(allprops)
        # remove last element of  station fields (not needed for existing protocol)
        del stationFields[-1]
        fields = stationFields + protocolFields



    df = pd.DataFrame(data = [], columns = fields)
    print('dataframe columns')
    print(df.columns)
    fout = io.BytesIO()
    writer = pd.ExcelWriter(fout)
    df.to_excel(writer, sheet_name='Sheet1',index = False)
    writer.save()
    file = fout.getvalue()

    return Response(file,content_disposition= "attachment; filename=" + protocolName + ".xlsx",content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')

def get_props(attrs):

    protocolAttrs = []
    commentField = False
    for s in attrs :
        # print('*************************************************************')
        # print(s)
        # print('*************************************************************')
        name = s["name"]
        if(name not in ['ID','FK_ProtocoleType','FK_Station','creationDate','Parent_Observation','FK_Individual','Comments']):
             protocolAttrs.append(name)
        if(name=="Comments"):
            commentField = "Comments"
    # put 'comment' field in last position of the liste to avoid confusion with station 'comment' field
    if(commentField):
        protocolAttrs.append(commentField)

    return protocolAttrs

@view_config(route_name=route_prefix +'getExcelFile', renderer='json' ,request_method='POST')
def get_file(request):


    try:
        session = request.dbsession
        data = request.get_array(field_name='excelFile')

        columns = data[0]
        protoId = int(request.POST['protoId']) 
        protoName = request.POST['protoName']
        # check required columns for station
        stationColumns = ['Station_Date','Station_Name','Station_LAT','Station_LON','Station_ELE','Station_precision','Station_creator','Station_Comments']
        # check if station fields names are ok : stationsColumns issubset of columns
        s= set(stationColumns)
        p = set(columns)
        val = s.issubset(p)
        if (val == False):
            return 'station columns error'
        # check columns for existing protocol
        if(protoId!=0):
            protocolColumns = list(set(columns)-set(stationColumns))
            newObs = Observation(FK_ProtocoleType = protoId)
            allprops = newObs.GetAllProp()
            protocolColsInDB = get_props(allprops)
            # Check if columns list is the same
            isSame = set(protocolColumns).issubset(set(protocolColsInDB))
            if (isSame == False):
                return 'protocol columns error'

        df = pd.DataFrame(data=data[1:],columns=data[0])
        df.convert_objects(convert_dates=True, convert_numeric=True)
        userId = request.authenticated_userid['iss']
        tableName = 'TImport_excel_' + userId
        print(df)

        command = "IF OBJECT_ID ('" + tableName + "') IS NOT NULL "
        command = command +  ''' BEGIN  DROP TABLE "''' + tableName + '''" END CREATE TABLE "''' + tableName + '''" ( "Id" int) '''
        session.execute(command)
        session.commit()
        # schema = generateImportTable(data[0],protoId,tableName,session)
        
        df.to_sql(tableName , session.get_bind(),if_exists='replace')

        # generateMetaData(protoId,tableName,userId,session)
        
        req = text("""
        DECLARE @return_value int

        EXEC    @return_value = [dbo].[sp_import_excel]
        @tableName = :tempTableName,
        @creator = :user,
        @IdTypeProto = :protoID

        """).bindparams(bindparam('tempTableName', tableName),bindparam('user', userId),bindparam('protoID', protoId))

        session.execute(req)

    except:
        # request.response.status =510
        print_exc()
        raise
    return 
def generateImportTable (columns,protoId,tableName,session):
    # get schema for protocols fields
    newObs = Observation(FK_ProtocoleType = protoId)
    schema = []
    allprops = newObs.GetAllProp()

    for col in columns : 
        # station fields
        if (col == 'Station_Date'):
            schema.append({'col': col, 'type': 'datetime'})
        if (col == 'Station_Name') or (col == 'Station_Comments'):
            schema.append({'col': col, 'type': 'nvarchar(255)'})
        if (col == 'Station_LAT') or (col == 'Station_LON'):
            schema.append({'col': col, 'type': 'numeric(9, 5)'})
        if (col == 'Station_precision') or (col == 'Station_ELE'):
            schema.append({'col': col, 'type': 'int'})
        # protocol fields    
        for s in allprops :

            name = s["name"]
            if (name==col):
                fieldType = s["type"]
                if(fieldType=='String'):
                    type_f = 'nvarchar(255)'
                if(fieldType=='Integer'):
                    type_f = 'int'
                if(fieldType == 'Float'):
                    type_f = 'decimal(12, 5)'
                if(fieldType == 'Date Only') or (fieldType == 'Time') or (fieldType == 'Date'):
                    type_f = 'datetime'

                schema.append({'col': col, 'type': type_f})


    command = "IF OBJECT_ID ('" + tableName + "') IS NOT NULL "
    command = command +  ''' BEGIN  DROP TABLE "''' + tableName + '''" END CREATE TABLE "''' + tableName + '''" ( "Id" int  primary key IDENTITY, '''

    print('\n ***********************')
    print(schema)
    for elem in schema:
        command = command + '"' +  elem["col"] +'" '+ elem["type"] + ','

    # delete last ','
    command = command[:-1]    
    command = command + ');'
    #print(command);
    try:
        session.execute(command)
        session.commit()
    except:
        request.response.status =510
        return False
    return schema

def generateMetaData(protoId,tableName,userId, session) : 
    # comment
    """ TODO Creer table import fichier et insérer les action d'import"""
    command  = text(""" INSERT INTO TImport_excel_metadata ([table_name], [proto_id], [user_id]) VALUES  """ + "'" + tableName  + "'" + """ , """ + str (protoId ) + """ , """ + userId )
        
    print('************ meta data ***************')
    print(command);
    # try:
    #     session.execute(command)
    #     session.commit()
    # except:
    #     request.response.status =510
    #     return False
    # return schema

