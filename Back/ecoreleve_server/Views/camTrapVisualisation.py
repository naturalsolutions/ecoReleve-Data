from pyramid.response import Response
from pyramid.view import view_config
from sqlalchemy import desc, select, func,text, insert, join, Integer, cast, and_, Float, or_,bindparam, update, outerjoin
from ..Models import Base , dbConfig
from ..utils.distance import haversine
from ..utils.data_toXML import data_to_XML
from traceback import print_exc
import pandas as pd
import datetime, time
from sqlalchemy.orm import query
from ..controllers.security import routes_permission



@view_config(route_name='cameratrap', renderer='json' ,request_method='GET',permission = routes_permission['rfid']['POST'])
def allPhotos (request):
    print("bienvenue sur le service web visualisation des photos")
    if len( request.params ) > 0 :
        print("traitement des parametres")
        if 'siteid' in request.params.keys():
            fkMonitoredSite = request.params['siteid']
            print( "fk site "+ str(fkMonitoredSite) )
    return
