from traceback import print_exc
import zipfile
import os
import uuid
from pyramid.response import Response, FileResponse
from pyramid.view import view_config
from sqlalchemy import desc, select, func,text, insert, join, Integer, cast, and_, Float, or_,bindparam, update, outerjoin,Table
from sqlalchemy.orm import query, joinedload

from ecoreleve_server.dependencies import dbConfig
from ecoreleve_server.database.meta import Main_Db_Base
from ecoreleve_server.database.main_db import (
    Photos
)
from ecoreleve_server.modules.permissions import routes_permission


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
            queryStringParams += 'convert( date , \''+str(request.params[item])+'\' )'
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
        if 'sessionID' in request.params.keys():
            fksessionID = request.params['sessionID']
            print ("statut change et va devenir 2 ")
            queryStatut = 2

    if ( queryStatut == 1 ):
        query = text("""
        select
        UnicIdentifier,
        sessionID,
        StartDate,
        EndDate,
        count(distinct pk_id) as nbPhotos

        from V_dataCamTrap_With_equipSite AS V
        join photos as P
        on V.pk_id = P.old_id
        where V.FK_MonitoredSite = :fkmonitoredsite AND V.checked = 1
        GROUP BY UnicIdentifier, site_name, site_type, StartDate, EndDate, sessionID, fk_sensor, V.FK_MonitoredSite""").bindparams(
        bindparam('fkmonitoredsite',value=fkMonitoredSite))

    elif ( queryStatut == 2 ):
        query = text("""
        select  P.id AS id,path, FileName , P.Date AS date_creation, P.Note AS note
        from V_dataCamTrap_With_equipSite AS V
		join photos as P
		on V.pk_id = P.old_id
        where checked = 1
        AND V.sessionID = :sessionID
        AND V.FK_MonitoredSite = :fkmonitoredsite
		ORDER BY date_creation ASC""").bindparams(
        bindparam('fkmonitoredsite',value=fkMonitoredSite),
        bindparam('sessionID', value=fksessionID)
        )
    elif ( queryStatut == 3 ):
        query = text(""" select * from Photos,Tags """+ str(queryStrTotalParams))
        print ( query )

    data = session.get_bind(Photos).execute(query).fetchall()
    dataResult = [dict(row) for row in data]
    for row in dataResult:

        if ( queryStatut == 1):
            if str(row['StartDate']) == 'None' :
                row['StartDate'] = 'N/A'
            if str(row['EndDate']) == 'None' :
                row['EndDate'] = 'N/A'
            row['link'] = None
        if( queryStatut == 2 ):
            varchartmp = row['path'].split('\\')
            row['path']="imgcamtrap/"+str(varchartmp[len(varchartmp)-2])+"/"
            row['FileName'] = row['FileName'].replace(" ","%20")

    return dataResult

@view_config(route_name='getSessionZip', renderer='json' ,request_method='GET',permission = routes_permission['rfid']['POST'])
def getSessionZip(request):

    fileNameReturned = 'All_Sessions_'
    sessionid = 0
    siteid = 0

    viewTable = Table('V_dataCamTrap_With_equipSite',
                        Main_Db_Base.metadata, autoload=True)

    query = select([
        viewTable.c['pk_id'],
        viewTable.c['sessionID'],
        viewTable.c['UnicIdentifier'],
        viewTable.c['site_name'],
        viewTable.c['StartDate'],
        viewTable.c['EndDate'],
        Photos.Id,
        Photos.Date,
        Photos.FileName
    ])
    joinTable = join(Photos , viewTable, Photos.old_id == viewTable.c['pk_id'])
    query = query.select_from(joinTable)

    if 'siteid' in request.GET:
        siteid = request.GET['siteid']
        query = query.where(
            viewTable.c['FK_MonitoredSite'] == siteid
        )
    if 'sessionid' in request.GET:
        sessionid = request.GET['sessionid']
        fileNameReturned = 'Session_'+sessionid+'_'
        query = query.where(
            viewTable.c['sessionID'] == sessionid
        )
    


    session = request.dbsession
    response = session.execute(query).fetchall()

    if len(response) == 0:
        request.response.status_code = 409
        request.response.text = 'No photos To download'
        return request.response
    fileNameReturned +='for_'+response[0]['site_name']
    rememberRows = []
    listFolderName = []
    respJson = {}
    for row in response :
        firstFolder = row['site_name']
        secondFolder = str(row['StartDate'])[:10]+'_'+str(row['EndDate'])[:10]+'_'+row['UnicIdentifier']
        thirdFolder = row['FileName']
        fileName = str(row['Date']).replace(':','-').replace(' ','_')+'_'+str(row['Id'])
        if firstFolder not in respJson :
            respJson[firstFolder] = {}
        
        if secondFolder not in respJson[firstFolder]:
            respJson[firstFolder][secondFolder] = {}
        
        if thirdFolder not in respJson[firstFolder][secondFolder]:
            respJson[firstFolder][secondFolder][thirdFolder] = fileName
        # respJson[firstFolder][secondFolder][thirdFolder].append(fileName)

        elemTmp = []
        elemTmp.append(row['UnicIdentifier'])
        startDateParsed = str(row['StartDate'])[:10]
        elemTmp.append(startDateParsed)
        endDateParsed = str(row['EndDate'])[:10]
        elemTmp.append(endDateParsed)
        elemTmp.append(row['site_name'])
        folderName = '_'.join(elemTmp)
        if folderName not in listFolderName :
            listFolderName.append(folderName)

    fileName = os.path.join(dbConfig['camTrap']['path'],'export',fileNameReturned) 

    randomSuffix = str(uuid.uuid4())
    '''
    TODO :
        -gen nom aleatoire pour eviter les ecrasements de fichiers si plusieurs personnes GET
        -penser a mettre en place une purge
    '''
    if not os.path.exists(fileName+".zip"):
        # zip file doesn't exist we gen it
        zipFile = zipfile.ZipFile(fileName+randomSuffix+'.zip', 'w')
        sizeListFolder = len(listFolderName)
        for root, dirs, files in os.walk(os.path.join( dbConfig['camTrap']['path'])) :
            absRoot = root.split('\\')[-1]
            for i in range(0,sizeListFolder):        
                if absRoot == listFolderName[i]:
                    folderName = listFolderName[i]
                    (unicIdentifier, startDate, endDate, monitoredSiteName ) = folderName.split('_')            
                    for f in files:
                        firstFolder = monitoredSiteName
                        secondFolder = startDate+'_'+endDate+'_'+unicIdentifier
                        for item in respJson[firstFolder][secondFolder]:
                            if item.upper() == f.upper():
                                fileNameForZip = firstFolder+'\\'+secondFolder+'\\'+respJson[firstFolder][secondFolder][item]+f[len(f)-4:]
                                if os.path.exists(os.path.join(root,f)) :
                                    zipFile.write(os.path.join(root,f),fileNameForZip)
        zipFile.close()
        # File generated we test
        if  not os.path.exists(fileName+".zip") :
            os.rename(zipFile.filename,fileName+".zip")
        else :
            os.remove(zipFile.filename)
    response = FileResponse(
        os.path.abspath(fileName+".zip"),
        request = request,
        content_type='application/zip'
        )
    response.headers['Content-Disposition'] = ("attachment;filename="+fileNameReturned+'.zip')
    return response

