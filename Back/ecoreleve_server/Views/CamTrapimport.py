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
import datetime,time,zipfile
from pyramid import threadlocal

def unzip(zipFilePath , destFolder):
    zfile = zipfile.ZipFile(zipFilePath)
    nameRandom = ''
    for name in zfile.namelist():
        nameRandom = GenName()
        print (name)
        fd = open(os.path.join(destFolder, str(nameRandom)+".jpg"), 'wb')
        fd.write(zfile.read(name))
        fd.close()
        AddPhotoOnSQL(destFolder,nameRandom,".jpg",None)
    zfile.close()
    #if no error remove zip file




def AddPhotoOnSQL(path , name , extension , date_creation):
    session = threadlocal.get_current_request().dbsession
    currentPhoto = CamTrap(path = str(path),name = str(name), extension = '.jpg', date_creation = None)
    session.add(currentPhoto)
    session.flush()
    return currentPhoto.pk_id

def GenName():
    return uuid.uuid4()

def createNamePath( paramsPOST ):
    nouveauPath = [1,2,3,4]
    cheminParse = ""
    for key , value in paramsPOST.items():
        print( str(key)+" : "+str(value) )
        if( key == 'UnicIdentifier' ):
            nouveauPath[0] = value
        elif( key == 'StartDate' ):
            nouveauPath[1] = value
        elif( key == 'EndDate' ):
            nouveauPath[2] = value
        elif ( key == 'Name' ):
            nouveauPath[3] = value

    for tmp in nouveauPath :
        #print (tmp)
        if ( cheminParse == ""):
            cheminParse += tmp
        else:
            cheminParse += "_" + str(tmp)

    return cheminParse
# ------------------------------------------------------------------------------------------------------------------------- #
def uploadFileCamTrap(request):

    #print ( dbConfig['camTrap']['path'] )
    pathPrefix = dbConfig['camTrap']['path']
    #session = request.dbsession
    idRetour = -1
    response = 'success'
    request.response.status_code = 201
    flagZip = False

    print(request.POST)
    print ("construction du path")
    cheminParse = createNamePath( request.POST );

    if not os.path.exists(pathPrefix+'\\'+cheminParse):
        print("creation du dossier")
        os.makedirs(pathPrefix+'\\'+cheminParse)

    print( "bim nouveau path")
    print( cheminParse)
    #file send
    extType = request.POST['file'].filename.split('.');
    if ( extType[len(extType)-1] == 'zip' or extType[len(extType)-1] == 'rar'):
        flagZip = True
    inputFile = request.POST['file'].file
    name = GenName()
    #unique uri
    if ( flagZip ):
        uri = os.path.join(pathPrefix,cheminParse, '%s.zip' %name)
    else:
        uri = os.path.join(pathPrefix,cheminParse, '%s.jpg' %name)

    print ("URI:" +str(uri))

    #verif chmod
    #ret = os.access("C:/Users/NS/Desktop", os.W_OK)
    #print ("W_OK - return value %s" % ret)

    #create a file temp if upload failed
    temp_file_path = uri + '~'
    debutTime2 = time.time()
    print (" début ecriture ")
    # Finally write the data to a temporary file
    inputFile.seek(0)
    with open(temp_file_path, 'wb') as output_file:
        shutil.copyfileobj(inputFile, output_file)

    #rename temp file with uri
    os.rename(temp_file_path, uri)
    print ("fin ecriture ")
    finTime2 = time.time()
    print ("durée :" +str(finTime2 - debutTime2))

    if(not flagZip):
        #currentPhoto = CamTrap(path = str(pathPrefix),name = str(name), extension = '.jpg', date_creation = None)
        #session.add(currentPhoto)
        #session.flush()
        idRetour = AddPhotoOnSQL(str(pathPrefix+"\\"+cheminParse) , str(name) , str(extType[len(extType)-1]) , None )
    else:
        debutTime = time.time()
        print (" on commence la décompression ")
        unzip(uri , pathPrefix+"\\"+cheminParse)
        """zf = zipfile.ZipFile(output_file,'r')
        for info in zf.infolist():
            print (info.filename)
            print ('\tComment:\t', info.comment)
            print ('\tModified:\t', datetime.datetime(*info.date_time) )
            print ('\tSystem:\t\t', info.create_system, '(0 = Windows, 3 = Unix)')
            print ('\tZIP version:\t', info.create_version)
            print ('\tCompressed:\t', info.compress_size, 'bytes')
            print ('\tUncompressed:\t', info.file_size, 'bytes')
            print()"""

        print ("fin decompression ")
        finTime = time.time()
        print ("durée :" +str(finTime - debutTime))
        idRetour = 1

    #query = text('INSERT INTO ecoReleve_Sensor.dbo.TcameraTrap (path, name, extension , date_creation ) VALUES (\''+str(pathPrefix)+'\',\''+str(name)+'\',\''+str(".jpg")+'\',\''+str("20160512 13:50:13")+'\' )')
    #query = text('select * from ecoReleve_Sensor.dbo.TcameraTrap');
    #results = session.execute(query)

    #query = text('SELECT * FROM ecoReleve_Sensor.dbo.TcameraTrap WHERE id = SCOPE_IDENTITY()')
    #results = session.execute(query)



    return idRetour
