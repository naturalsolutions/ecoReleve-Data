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
    session = request.dbsession
    print("bienvenue sur le service web visualisation des photos")
    print ( len( request.params ) )
    print (request.params)
    print ( request.params.keys() )
    compteur = 0
    queryStrTotalParams = ""
    query = ""
    queryStatut = 0
    for item in request.params:
        if compteur > 0:
            queryStrTotalParams += ' AND '
        queryStringParams = ""
        paramTab = item.split('.')
        queryStringParams +=paramTab[0]
        if( len( paramTab ) > 1 ) : #parse col, operator , value
            if( paramTab[1] == 'eq'):
                #print(' = ')
                queryStringParams += ' = '
            if( paramTab[1] == 'lt'):
                #print(' < ')
                queryStringParams += ' < '
            if( paramTab[1] == 'gt'):
                #print(' > ')
                queryStringParams += ' > '
            if( paramTab[1] == 'lte'):
                #print(' <= ')
                queryStringParams += ' <= '
            if( paramTab[1] == 'gte'):
                #print(' >= ')
                queryStringParams += ' >= '
            if( paramTab[1] == 'ne'):
                #print(' <> ')
                queryStringParams += ' <> '
        #print(request.params[item])
        if paramTab[0] == 'date':
            queryStringParams += 'convert( datetime , \''+str(request.params[item])+'\' )'
        elif paramTab[0] == 'label':
            queryStringParams += ' LIKE \'%'+str(request.params[item])+'%\''
        else:
            queryStringParams += request.params[item]
        if queryStringParams != "" and compteur == 0:
            compteur +=1
            queryStatut = 3
            queryStrTotalParams += "WHERE "
        queryStrTotalParams += queryStringParams


    if len( request.params ) > 0 :
        print("traitement des parametres")
        if 'siteid' in request.params.keys():
            fkMonitoredSite = request.params['siteid']
            print( "fk site "+ str(fkMonitoredSite) )
            print ( "statut change et va devenir 1 " )
            queryStatut = 1
        if 'equipid' in request.params.keys():
            fkequipid = request.params['equipid']
            print ("statut change et va devenir 2 ")
            queryStatut = 2

    if ( queryStatut == 1 ):
        query = text("""
        select
        UnicIdentifier,
        equipID,
        StartDate,
        EndDate,
        count(distinct pk_id) as nbPhotos

        from V_dataCamTrap_With_equipSite AS V
        join photos as P
        on V.pk_id = P.old_id
        where V.FK_MonitoredSite = :fkmonitoredsite AND V.checked = 1
        GROUP BY UnicIdentifier, site_name, site_type, StartDate, EndDate, equipID, fk_sensor, V.FK_MonitoredSite""").bindparams(
        bindparam('fkmonitoredsite',value=fkMonitoredSite))

    elif ( queryStatut == 2 ):
        query = text("""
        select  P.id AS id,path, FileName , P.Date AS date_creation, P.Note AS note
        from V_dataCamTrap_With_equipSite AS V
		join photos as P
		on V.pk_id = P.old_id
        where checked = 1
        AND V.equipID = :equipid
        AND V.FK_MonitoredSite = :fkmonitoredsite
		ORDER BY date_creation ASC""").bindparams(
        bindparam('fkmonitoredsite',value=fkMonitoredSite),
        bindparam('equipid', value=fkequipid)
        )
    elif ( queryStatut == 3 ):
        query = text(""" select * from Photos,Tags """+ str(queryStrTotalParams))
        print ( query )

    data = session.execute(query).fetchall()
    dataResult = [dict(row) for row in data]
    for row in dataResult:

        if ( queryStatut == 1):
            if str(row['StartDate']) == 'None' :
                row['StartDate'] = 'N/A'
            if str(row['EndDate']) == 'None' :
                row['EndDate'] = 'N/A'
        if( queryStatut == 2 ):
            varchartmp = row['path'].split('\\')
            row['path']="imgcamtrap/"+str(varchartmp[len(varchartmp)-2])+"/"
            row['FileName'] = row['FileName'].replace(" ","%20")

    return dataResult
