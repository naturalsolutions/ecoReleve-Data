from pyramid.response import Response
from pyramid.view import view_config
from sqlalchemy import desc, select, func,text, insert, join, Integer, cast, and_, Float, or_,bindparam, update, outerjoin
from ..Models import Base , dbConfig
from ..utils.distance import haversine
from ..utils.data_toXML import data_to_XML
from traceback import print_exc
import pandas as pd
import numpy as np
import re
import datetime, time
import transaction
import json
from sqlalchemy.orm import query
import itertools
import os,sys
import uuid
import shutil
from ..Models import CamTrap


# ------------------------------------------------------------------------------------------------------------------------- #
def uploadFileCamTrap(request):

    #print ( dbConfig['camTrap']['path'] )
    pathPrefix = dbConfig['camTrap']['path']
    session = request.dbsession

    response = 'success'
    request.response.status_code = 201

    #file send
    inputFile = request.POST['file'].file
    name = uuid.uuid4()
    #unique uri
    uri = os.path.join(pathPrefix, '%s.jpg' %name)

    #verif chmod
    #ret = os.access("C:/Users/NS/Desktop", os.W_OK)
    #print ("W_OK - return value %s" % ret)

    #create a file temp if upload failed
    temp_file_path = uri + '~'

    # Finally write the data to a temporary file
    inputFile.seek(0)
    with open(temp_file_path, 'wb') as output_file:
        shutil.copyfileobj(inputFile, output_file)

    #rename temp file with uri
    os.rename(temp_file_path, uri)

    currentPhoto = CamTrap(path = str(uri),name = str(name), extension = '.jpg', date_creation = None)
    session.add(currentPhoto)
    session.flush()
    #query = text('INSERT INTO ecoReleve_Sensor.dbo.TcameraTrap (path, name, extension , date_creation ) VALUES (\''+str(pathPrefix)+'\',\''+str(name)+'\',\''+str(".jpg")+'\',\''+str("20160512 13:50:13")+'\' )')
    #query = text('select * from ecoReleve_Sensor.dbo.TcameraTrap');
    #results = session.execute(query)

    #query = text('SELECT * FROM ecoReleve_Sensor.dbo.TcameraTrap WHERE id = SCOPE_IDENTITY()')
    #results = session.execute(query)



    return currentPhoto.pk_id
