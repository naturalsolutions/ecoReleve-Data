from pyramid.response import Response
from pyramid.view import view_config
from sqlalchemy import desc, select, func,text, insert, join, Integer, cast, and_, Float, or_,bindparam, update, outerjoin
from ..Models import Base , dbConfig
from ..utils.distance import haversine
from ..utils.data_toXML import data_to_XML
from traceback import print_exc
import pandas as pd
import numpy as np
import PIL
from PIL import Image , ImageFile
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
import exifread
from pyramid import threadlocal
#handle error on some photo
# image file truncated
ImageFile.LOAD_TRUNCATED_IMAGES = True

def resizePhoto( imgPathSrc ):
    basewidth = 200
    try:
        img = Image.open(imgPathSrc)
        # Fully load the image now to catch any problems with the image contents.
        img.load()
    except Exception:
        #handle error on img file
        return
    wpercent = ( basewidth / float(img.size[0]) ) # keep ratio
    hsize = int((float(img.size[1]) * float(wpercent)))
    img.thumbnail((basewidth, hsize), Image.ANTIALIAS)

    imgPathDestTab = imgPathSrc.split('\\');# parse path into a tab
    imgPathDestTab.insert( len(imgPathDestTab)-1 , "thumbnails" ) # insert ""new directory"" in the path lenght - 1
    imgPathDest = "\\".join(imgPathDestTab) # concat the new path

    img.save(imgPathDest) #save the thumbnail on the hdd


def dateFromExif(imagePath):
    theDate =""
    image = open( imagePath ,'rb' )
    tagsExif = exifread.process_file(image)
    for tag in tagsExif:
        if tag in ('Image DateTime'):
            theDate = str(tagsExif[tag]).encode('utf8').decode(sys.stdout.encoding)
            theDate += ".000"
            theDate = theDate.replace(":","-",2)
            theDate = datetime.datetime.strptime(theDate, "%Y-%m-%d %H:%M:%S.%f")
    if( theDate == ""):
        theDate = None
    return theDate

def checkDate(exifDate , startDate , endDate):
    newStartDate = time.strptime(startDate, "%Y-%m-%d %H:%M:%S")
    if( endDate == "0000-00-00 00:00:00"):
        newEndDate =  time.strptime(str(datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')) , "%Y-%m-%d %H:%M:%S")
    else:
        newEndDate = time.strptime(endDate, "%Y-%m-%d %H:%M:%S")
    if(exifDate == None):
        timePhoto =  time.strptime("1985-01-01 00:00:00", "%Y-%m-%d %H:%M:%S")
    else:
        timePhoto = time.strptime(str(exifDate), "%Y-%m-%d %H:%M:%S")
    if( timePhoto >= newStartDate and timePhoto <= newEndDate):
        return True
    else:
        return False

def unzip(zipFilePath , destFolder, fk_sensor, startDate , endDate):
    zfile = zipfile.ZipFile(zipFilePath)
    messageErrorFiles = ""
    #nameRandom = ''
    for name in zfile.namelist():
        #print("unzip : " +str(name))
        #nameRandom = GenName()
        #print (name)
        extType = name.split('.');
        if( extType[len(extType)-1] in ['jpg', 'JPG', 'jpeg', 'JPEG'] ):
            if not os.path.isfile(destFolder+str(name)):
                with open(os.path.join(destFolder, str(name)), 'wb') as fd:
                    fd.write(zfile.read(name))
                #ici on peut test
                datePhoto = dateFromExif (destFolder+str(name))
                if( checkDate( datePhoto , startDate , endDate ) ):
                    AddPhotoOnSQL(fk_sensor , destFolder , name , str(extType[len(extType)-1]) , datePhoto )
                    resizePhoto( str(destFolder)+str(name) )
                else:
                    os.remove(destFolder+str(name))
                    messageErrorFiles += str(name)+"Date not valid ("+str(datePhoto)+") <BR>"
                #AddPhotoOnSQL(fk_sensor,destFolder,name, str(extType[len(extType)-1]) , dateFromExif (destFolder+'\\'+str(name)))
            else:
                messageErrorFiles+= "File : " +str(name)+" is already on the server <BR>"
            #fd.close()
        else:
            messageErrorFiles+= str(name)+" not a good file <BR>"
    zfile.close()
    #rename zip file
    zipFileTab = zipFilePath.split('.')
    os.remove( zipFilePath )

    return messageErrorFiles
    #if no error remove zip file




def AddPhotoOnSQL(fk_sensor , path , name , extension , date_creation):
    session = threadlocal.get_current_request().dbsession
    currentPhoto = CamTrap(fk_sensor = fk_sensor ,path = str(path),name = str(name), extension = '.jpg', date_creation = date_creation )
    session.add(currentPhoto)
    session.flush()
    return currentPhoto.pk_id

def GenName():
    return uuid.uuid4()

def createNamePath( paramsPOST ):
    nouveauPath = [1,2,3,4]
    cheminParse = ""
    for key , value in paramsPOST.items():
        #print( str(key)+" : "+str(value) )
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
def uploadFileCamTrapResumable(request):
    flagDate = False
    reponseStatus = 200
    pathPrefix = dbConfig['camTrap']['path']
    flagCrea = False
    pathPost = str(request.POST['path'])
    fk_sensor = int(request.POST['id'])
    messageDate =""

    uri = pathPrefix+'\\'+pathPost
    extType = request.POST['resumableFilename'].split('.')

    inputFile = request.POST['file'].file
    if( int(request.POST['resumableChunkNumber']) == 1 and int(request.POST['resumableCurrentChunkSize']) == int(request.POST['resumableTotalSize']) and str(extType[len(extType)-1]) != ".zip" ):
        if not os.path.isfile(pathPrefix+'\\'+pathPost+'\\'+str(request.POST['resumableFilename'])):
            with open(uri+'\\'+str(request.POST['resumableFilename']), 'wb') as output_file: # write in the file
                shutil.copyfileobj(inputFile, output_file)
        datePhoto = dateFromExif (uri+'\\'+str(request.POST['resumableFilename']))
        if( checkDate (datePhoto , str(request.POST['startDate']) , str(request.POST['endDate']) ) ):
            idRetour = AddPhotoOnSQL(fk_sensor , str(uri) , str(request.POST['resumableFilename']) , str(extType[len(extType)-1]) , datePhoto )
            resizePhoto( str(uri)+"\\" + str(request.POST['resumableFilename']) )
            messageDate = "ok <BR>"
        else:
            os.remove(uri+'\\'+str(request.POST['resumableFilename']))
            flagDate = True
            messageDate = "Date not valid ("+str(datePhoto)+") <BR>"
    else:
        if not os.path.isfile(pathPrefix+'\\'+pathPost+'\\'+str(request.POST['resumableIdentifier'])):
            position = int(request.POST['resumableChunkNumber']) #calculate the position of cursor
            with open(uri+'\\'+str(request.POST['resumableIdentifier'])+"_"+str(position), 'wb') as output_file: # write in the file
                shutil.copyfileobj(inputFile, output_file)

    if(flagDate):
        request.response.status_code = 415
        return messageDate
    else:
        request.response.status_code = 200
        return "ok"

def concatChunk(request):
    flagSuppression = False
    reponseStatus = 200
    res = {}
    message = ""
    timeConcat = ""
    messageConcat = ""
    messageUnzip = ""
    pathPrefix = dbConfig['camTrap']['path']
    request.response.status_code = 200
    #create folder
    if(int(request.POST['action']) == 0 ):
        pathPost = str(request.POST['path'])
        if not os.path.exists(pathPrefix+'\\'+pathPost):
            os.makedirs(pathPrefix+'\\'+pathPost)
            request.response.status_code = 200
        if not os.path.exists(pathPrefix+'\\'+pathPost+'\\thumbnails\\'):
            os.makedirs(pathPrefix+'\\'+pathPost+'\\thumbnails\\')
            request.response.status_code = 200
    else :
        print(" il faut que la date de l'exif soit entre le "+str(request.POST['startDate'])+" et le "+str(request.POST['endDate']))
        pathPost = str(request.POST['path'])
        fk_sensor = int(request.POST['id'])
        name = str(request.POST['file'])
        debutTime = time.time()
        print("name " +str(name))
        print("on veut reconstruire le fichier" + str(name) + " qui se trouve dans " + str(request.POST['path']) +" en :"+str(request.POST['taille'])+" fichiers")
        #destination = open(pathPrefix+'\\'+pathPost+'\\'+str(request.POST['name']) ,'wb')
        txtConcat = str(name).split('.')
        print ("avant text")
        if not os.path.isfile(pathPrefix+'\\'+pathPost+'\\'+str(txtConcat[0])+str('.txt')):
            with open(pathPrefix+'\\'+pathPost+'\\'+str(txtConcat[0])+str('.txt') ,'a' ) as socketConcat:
                print("fichier socket ok")
                print ( "%s\n%s\n" % ( str(request.POST['taille']) , str('0') ) )
                socketConcat.write("%s\n%s\n" % ( request.POST['taille'] , 0 ) )
                if not os.path.isfile(pathPrefix+'\\'+pathPost+'\\'+str(name)): # si le fichier n'existe pas on va le reconstruire
                    with open(pathPrefix+'\\'+pathPost+'\\'+str(name) ,'wb') as destination: #on ouvre le fichier comme destination
                        for i in range( 1, int(request.POST['taille'])+1):#on va parcourir l'ensemble des chunks
                            if os.path.isfile(pathPrefix+'\\'+pathPost+'\\'+str(request.POST['name'])+'_'+str(i)):#si le chunk est present
                                shutil.copyfileobj(open(pathPrefix+'\\'+pathPost+'\\'+str(request.POST['name'])+'_'+str(i), 'rb'), destination)#on le concat dans desitnation
                                socketConcat.write("%s\n" % (i) )
                                socketConcat.flush()
                                if (i == 30 ):
                                    with open(pathPrefix+'\\'+pathPost+'\\'+str(txtConcat[0])+str('.txt') ,'r' ) as testConcat:
                                        first = testConcat.readline()
                                        for last in testConcat:
                                            avantDer = last
                                        print(" first ")
                                        print (first)
                                        print(" last ")
                                        print (last)
                                        print (avantDer)
                                    testConcat.close()
                            else:#si il n'est pas present
                                flagSuppression = True
                                request.response.status_code = 510
                                message = "Chunk file number : '"+str(i)+"' missing try to reupload the file '"+str(request.POST['file'])+"'"
                                break #break the for
                    destination.close()
                else:
                    request.response.status_code = 510
                    message = "File : '"+str(name)+"' is already on the server <BR>"
                if (flagSuppression):
                    os.remove(pathPrefix+'\\'+pathPost+'\\'+str(name)) #supprime le fichier destination et on force la sortie
                else:
                    socketConcat.close()
                    os.remove( pathPrefix+'\\'+pathPost+'\\'+str(txtConcat[0])+str('.txt') )
                    for i in range( 1, int(request.POST['taille'])+1):#on va parcourir l'ensemble des chunks
                        os.remove(pathPrefix+'\\'+pathPost+'\\'+str(request.POST['name'])+'_'+str(i))



        #destination.close()
        finTime = time.time()
        timeConcat = str(finTime - debutTime)
        print ("durée :" + timeConcat)
        #file concat ok now unzip
        if(message == "" ):
            if( request.POST['type'] == "application/x-zip-compressed" ):
                debutTime = time.time()
                print (" on commence la décompression ")
                messageUnzip = unzip(pathPrefix+'\\'+pathPost+'\\'+str(name) , pathPrefix+'\\'+pathPost+'\\' , fk_sensor, str(request.POST['startDate']),str(request.POST['endDate']))
                if( messageUnzip != "" ):
                    request.response.status_code = 510
                print ("fin decompression ")
                finTime = time.time()
                print ("durée :" +str(finTime - debutTime))
            else:
                extType = request.POST['file'].split('.');
                destfolder = pathPrefix+'\\'+pathPost+'\\'
                datePhoto = dateFromExif (destfolder+str(name))
                if( checkDate ( datePhoto , str(request.POST['startDate']) ,str(request.POST['endDate']) ) ):
                    idRetour = AddPhotoOnSQL(fk_sensor , destfolder , name , str(extType[len(extType)-1]) , datePhoto )
                    resizePhoto( str(destfolder) + str(name) )
                else:
                    os.remove(destfolder+str(name))
                    flagDate = True
                    request.response.status_code = 510
                    messageConcat = "Date not valid ("+str(datePhoto)+") <BR>"

                #AddPhotoOnSQL(fk_sensor,destfolder,name, str(extType[len(extType)-1]) , dateFromExif (destfolder+str(name)))
    #os.remove(pathPrefix+'\\'+pathPost+'\\'+str(txtConcat[0])+str('.txt')) #supprime le fichier destination et on force la sortie
    #os.remove(pathPrefix+'\\'+pathPost+'\\'+str(name)) #supprime le fichier destination et on force la sortie
    res = {'message' : message , 'messageConcat' : messageConcat , 'messageUnzip' : messageUnzip, 'timeConcat' : timeConcat }
    return res
