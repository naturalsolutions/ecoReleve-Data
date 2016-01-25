from array import array

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

route_prefix = 'sensors/'

# ------------------------------------------------------------------------------------------------------------------------- #
@view_config(route_name=route_prefix+'datas', renderer='json' ,request_method='POST')
def uploadFile(request):
    type_= request.matchdict['type']
    dictFuncImport={
    'argos': uploadFileArgos,
    'gsm':uploadFilesGSM,
    'rfid':uploadFileRFID
    }
    return dictFuncImport[type_](request) 
