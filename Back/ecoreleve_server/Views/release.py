from pyramid.view import view_config
from ..Models import (
    DBSession,
    Individual,
    IndividualType,
    IndividualDynPropValue,
    IndividualDynProp,
    Individual_Location,
    Sensor,
    SensorType,
    Equipment,
    IndividualList
    )
from ecoreleve_server.GenericObjets.FrontModules import FrontModules
from ecoreleve_server.GenericObjets import ListObjectWithDynProp
import transaction
import json, itertools
from datetime import datetime
import datetime as dt
import pandas as pd
import numpy as np
from sqlalchemy import select, and_,cast, DATE,func,desc,join
from sqlalchemy.orm import aliased
from pyramid.security import NO_PERMISSION_REQUIRED
from traceback import print_exc
from collections import OrderedDict


prefix = 'release/'

@view_config(route_name= prefix+'individuals', renderer='json', request_method = 'GET', permission = NO_PERMISSION_REQUIRED)
def searchIndiv(request):
    data = request.params.mixed()
    print('*********data*************')
    print(data)
    searchInfo = {}
    searchInfo['criteria'] = []
    if 'criteria' in data: 
        data['criteria'] = json.loads(data['criteria'])
        if data['criteria'] != {} :
            searchInfo['criteria'] = [obj for obj in data['criteria'] if obj['Value'] != str(-1) ]

    try:
        searchInfo['order_by'] = json.loads(data['order_by'])
    except:
        searchInfo['order_by'] = ['ID:desc']
    # searchInfo['offset'] = json.loads(data['offset'])
    # searchInfo['per_page'] = json.loads(data['per_page'])

    criteria = [
    {
    'Column': 'LastImported',
    'Operator' : '=',
    'Value' : True
    }]
    searchInfo['criteria'].extend(criteria)

    ModuleType = 'IndivFilter'
    moduleFront  = DBSession.query(FrontModules).filter(FrontModules.Name == ModuleType).one()
    listObj = IndividualList(moduleFront)
    dataResult = listObj.GetFlatDataList(searchInfo)

    countResult = listObj.count(searchInfo)

    result = [{'total_entries':countResult}]
    result.append(dataResult)
    transaction.commit()
    return result