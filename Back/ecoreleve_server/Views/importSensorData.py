
from array import array
from ..Models import Base , dbConfig
from pyramid.view import view_config
from pyramid.response import Response
from sqlalchemy import func, desc, select, union, union_all, and_, bindparam, update, or_, literal_column, join, text, update
import json
from pyramid.httpexceptions import HTTPBadRequest
from ..utils.data_toXML import data_to_XML
import pandas as pd
import numpy as np
import transaction, time, signal
from ..utils.distance import haversine
import win32con, win32gui, win32ui, win32service, os, time, re
from win32 import win32api
import shutil
from time import sleep
import subprocess , psutil
from pyramid.security import NO_PERMISSION_REQUIRED
from datetime import datetime
from .argosImport import uploadFileArgos
from .GSMimport import uploadFilesGSM
from .RFIDimport import uploadFileRFID
from .CamTrapimport import uploadFileCamTrapResumable, concatChunk
import os,sys
from pyramid.response import Response
from ..controllers.security import routes_permission


route_prefix = 'sensors/'

# ------------------------------------------------------------------------------------------------------------------------- #
@view_config(route_name=route_prefix+'datas', renderer='json' ,request_method='POST',match_param='type=rfid',permission = routes_permission['rfid']['POST'])
@view_config(route_name=route_prefix+'datas', renderer='json' ,request_method='POST',match_param='type=gsm',permission = routes_permission['gsm']['POST'])
@view_config(route_name=route_prefix+'datas', renderer='json' ,request_method='POST',match_param='type=argos',permission = routes_permission['argos']['POST'])
@view_config(route_name=route_prefix+'datas', renderer='json' ,request_method='POST',match_param='type=concat',permission = routes_permission['rfid']['POST'])
@view_config(route_name=route_prefix+'datas', renderer='json' ,request_method='POST',match_param='type=resumable',permission = routes_permission['rfid']['POST'])
def uploadFile(request):
    #print("bim je check")
    #ici on stock l'acces
    # print("la requete avant d'upload")
    # print(request)
    # print (" user :")
    # print (" file :")
    # print (" date :")
    type_= request.matchdict['type']
    dictFuncImport={
    'argos': uploadFileArgos,
    'gsm':uploadFilesGSM,
    'rfid':uploadFileRFID,
    'resumable':uploadFileCamTrapResumable,
    'concat':concatChunk,
    '1': checkStatut
    }
    return dictFuncImport[type_](request)


@view_config(route_name=route_prefix+'datas', renderer='json' ,request_method='GET')
def checkChunk(request):
    pathPrefix = dbConfig['camTrap']['path']
    fileName = str(request.params['resumableIdentifier'])+"_"+str(request.params['resumableChunkNumber'])

    if not os.path.isfile(pathPrefix+'\\'+request.params['path']+'\\'+str(fileName)):
        return Response(status=204)
    else:
        #possible pb prog para ne pas uploader le meme fichier depuis 2 pc different
        #vefif la taille du fichier et on supprime le chunk si elle différe
        sizeOnServer = int(os.path.getsize( pathPrefix+'\\'+request.params['path']+'\\'+str(fileName) ))
        sizeExpected = int(request.params['resumableCurrentChunkSize'])
        if sizeOnServer != sizeExpected:
            os.remove(pathPrefix+'\\'+request.params['path']+'\\'+str(fileName))
            return Response(status=204)
        else:
            return Response(status=200)

@view_config(route_name=route_prefix+'statut', renderer='json' ,request_method='GET')
def checkStatut(request):
    print("je veux le statut")
    return
