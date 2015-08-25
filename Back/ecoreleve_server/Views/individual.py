from pyramid.view import view_config
from ..Models import (
    DBSession,
    Individual,
    IndividualType
    )
from ecoreleve_server.GenericObjets.FrontModules import FrontModules
from ecoreleve_server.GenericObjets import ListObjectWithDynProp
import transaction
import json, itertools
from datetime import datetime
import datetime as dt
import pandas as pd
import numpy as np
from sqlalchemy import select, and_,cast, DATE,func
from sqlalchemy.orm import aliased
from pyramid.security import NO_PERMISSION_REQUIRED
from traceback import print_exc


prefix = 'individuals'
# @view_config(route_name= prefix, renderer='json', request_method = 'PUT')


@view_config(route_name= prefix+'/action', renderer='json', request_method = 'GET', permission = NO_PERMISSION_REQUIRED)

def actionOnIndividuals(request):
    print ('\n*********************** Action **********************\n')
    dictActionFunc = {
    'count' : count_,
    'forms' : getForms,
    '0' : getForms,
    'getFields': getFields,
    'getFilters': getFilters,
    }
    actionName = request.matchdict['action']
    return dictActionFunc[actionName](request)

def count_ (request = None,listObj = None) :

    print('*****************  INDIVIDUAL COUNT***********************')
    if request is not None : 
        data = request.params
        if 'criteria' in data: 
            data['criteria'] = json.loads(data['criteria'])
            if data['criteria'] != {} :
                searchInfo['criteria'] = [obj for obj in data['criteria'] if obj['Value'] != str(-1) ]

        listObj = ListObjectWithDynProp(Individual)
        count = listObj.count(searchInfo = searchInfo)
    else : 
        count = listObj.count()
    return count 

def getFilters (request):

    ModuleType = 'IndivFilter'
    filtersList = Individual().GetFilters(ModuleType)
    filters = {}
    for i in range(len(filtersList)) :
        filters[str(i)] = filtersList[i]
    transaction.commit()
    return filters

def getForms(request) :

    typeIndiv = request.params['ObjectType']
    print('***************** GET FORMS ***********************')
    ModuleName = 'IndivForm'
    Conf = DBSession.query(FrontModules).filter(FrontModules.Name==ModuleName ).first()
    newIndiv = Individual(FK_IndividualType = typeIndiv)
    newIndiv.init_on_load()
    schema = newIndiv.GetDTOWithSchema(Conf,'edit')
    transaction.commit()
    return schema

def getFields(request) :

    ModuleType = 'IndivFilter'
    cols = Individual().GetGridFields(ModuleType)
    transaction.commit()
    return cols

@view_config(route_name= prefix+'/id', renderer='json', request_method = 'GET',permission = NO_PERMISSION_REQUIRED)
def getIndiv(request):

    print('***************** GET INDIVIDUAL ***********************')
    id = request.matchdict['id']
    curIndiv = DBSession.query(Individual).get(id)
    curIndiv.LoadNowValues()

    # if Form value exists in request --> return data with schema else return only data
    if 'FormName' in request.params :
        ModuleName = request.params['FormName']
        try :
            DisplayMode = request.params['DisplayMode']
        except : 
            DisplayMode = 'display'

        Conf = DBSession.query(FrontModules).filter(FrontModules.Name=='IndivForm' ).first()
        response = curIndiv.GetDTOWithSchema(Conf,DisplayMode)
    else : 
        response  = curIndiv.GetFlatObject()
    transaction.commit()
    return response


@view_config(route_name= prefix+'/id', renderer='json', request_method = 'DELETE',permission = NO_PERMISSION_REQUIRED)
def deleteIndiv(request):
    id_ = request.matchdict['id']
    curIndiv = DBSession.query(Individual).get(id_)
    DBSession.delete(curIndiv)
    transaction.commit()

    return True

@view_config(route_name= prefix+'/id', renderer='json', request_method = 'PUT')
def updateIndiv(request):

    print('*********************** UPDATE Individual *****************')
    data = request.json_body
    id = request.matchdict['id']
    curIndiv = DBSession.query(Individual).get(id)
    curIndiv.LoadNowValues()
    curIndiv.UpdateFromJson(data)
    transaction.commit()
    return {}

@view_config(route_name= prefix, renderer='json', request_method = 'POST')
def insertIndiv(request):

    data = request.json_body
    if not isinstance(data,list):
        print('_______INsert ROW *******')
        return insertOneNewIndiv(request)
    else :
        print('_______INsert LIST')
        #transaction.commit()
        #return insertListNewIndivs(request)

def insertOneNewIndiv (request) :

    data = {}
    for items , value in request.json_body.items() :
        if value != "" :
            data[items] = value

    newIndiv = Individual(FK_IndividualType = data['FK_IndividualType'], creator = request.authenticated_userid)
    newIndiv.IndividualType = DBSession.query(IndividualType).filter(IndividualType.ID==data['FK_IndividualType']).first()
    newIndiv.init_on_load()
    newIndiv.UpdateFromJson(data)
    print (newIndiv.__dict__)
    DBSession.add(newIndiv)
    DBSession.flush()
    # transaction.commit()
    return {'ID': newIndiv.ID}



@view_config(route_name= prefix, renderer='json', request_method = 'GET', permission = NO_PERMISSION_REQUIRED)
def searchIndiv(request):

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


    ModuleType = 'IndivFilter'
    moduleFront  = DBSession.query(FrontModules).filter(FrontModules.Name == ModuleType).one()


    start = datetime.now()
    listObj = ListObjectWithDynProp(Individual,moduleFront)
    dataResult = listObj.GetFlatDataList(searchInfo)
    stop = datetime.now()

    print ('______ TIME to get DATA : ')
    print (stop-start)

    start = datetime.now()
    countResult = count_(listObj =listObj)
    print ('______ TIME to get Count : ')
    stop = datetime.now()
    print (stop-start)

    if 'geo' in data: 
        geoJson=[]
        for row in dataResult:
            geoJson.append({'type':'Feature', 'properties':{'name':row['Name']}, 'geometry':{'type':'Point', 'coordinates':[row['LON'],row['LAT']]}})
        return {'type':'FeatureCollection', 'features':geoJson}
    else :
        result = [{'total_entries':countResult}]
        result.append(dataResult)
        transaction.commit()
        return result






