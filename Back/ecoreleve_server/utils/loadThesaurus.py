from ..Models import dbConfig, Base
import requests
from multiprocessing.dummy import Pool as ThreadPool, Queue
import copy
import time
from sqlalchemy import select
import json

thesaurusDictTraduction = {}
connection_queue = Queue()


def isInt(anyNumberOrString):
    try:
        int(anyNumberOrString) #to check float and int use "float(anyNumberOrString)"
        return True
    except ValueError :
        return False

def flattenThesaurus(nodes):
    items = []
    for node in nodes:
        if node.get('children', None):
            items.extend(flattenThesaurus(node.get('children', [])).items())
        else:
            items.append((node['fullpath'], node['valueTranslated']))
    return dict(items)

def initConnection():
    requestSession = requests.Session()
    requestSession.post('http://127.0.0.1/portal/security/login',data = {'userId':1209, 'password':'e8fb3c6483e9476cc33aec252f5d312bc625acfb'})

    connection_queue.put(requestSession)
    return connection_queue


def fetchThes(args):
    try:
        requestSession = connection_queue.get()
        data = args
        data['lng'] = 'en'
        if not isInt(data['StartNodeID']):
            data['StartNodeID'] = json.loads(data['StartNodeID']).get('startId')
        url = dbConfig['wsThesaurus']['wsUrl'] + '/fastInitForCompleteTree'
        responseEn = requestSession.post(url, data)

        if responseEn.status_code != 200:
            time.sleep(2)
            responseEn = requestSession.post(url, data)

        data['lng'] = 'fr'
        responseFr = requestSession.post(url, data)

        if responseFr.status_code != 200:
            time.sleep(2)
            responseFr = requestSession.post(url, data)

        thesaurusNode = json.loads(responseEn.text)
        thesaurusNodeFr = json.loads(responseFr.text)
        return (thesaurusNode['key'], {'en': flattenThesaurus(thesaurusNode['children']),
                                       'fr': flattenThesaurus(thesaurusNodeFr['children'])
                                       })
    except:
        from traceback import print_exc
        print_exc()
        # print(thesaurusNode)

        print('thesaurus not loaded for nodeID : ' + data['StartNodeID'])
        return (data['StartNodeID'], {})
    
    finally:
        connection_queue.put(requestSession)


def getThesaurusNodeID(config):
    if not dbConfig.get('wsThesaurus', None):
        print('\n NO thesaurus API')
        return

    print('\n ________________ pull from Thesaurus API \n')
    session = config.registry.dbmaker()

    # authenticationServiceUrl = dbConfig['portal.login']
    
    ModuleFormTable = Base.metadata.tables['ModuleForms']
    query = select([ModuleFormTable.c['Options']]
                   ).distinct(ModuleFormTable.c['Options']
                              ).where(ModuleFormTable.c['InputType'] == 'AutocompTreeEditor')
    startIDs = [r for r, in session.execute(query).fetchall()]
    session.close()

    thread_pool = ThreadPool(10, initConnection)
    thesaurusList = dict(thread_pool.map_async(
        fetchThes, [{"StartNodeID": nodeID} for nodeID in startIDs]).get())

    return thesaurusList


def loadThesaurusTrad(config):
    global thesaurusDictTraduction
    try:
        import redis
        r = redis.Redis('localhost')

        if not r.get('thesaurusDictTraduction'):
            thesaurusDictTraduction = getThesaurusNodeID(config)
            r.set('thesaurusDictTraduction',
                  json.dumps(thesaurusDictTraduction))
        else:
            thesaurusDictTraduction = json.loads(
                r.get('thesaurusDictTraduction').decode())

        # return thesaurusDictTraduction
    except:
        from traceback import print_exc
        print_exc()
        thesaurusDictTraduction = getThesaurusNodeID(config)

    # session = config.registry.dbmaker()

    # thesTable = Base.metadata.tables['ERDThesaurusTerm']
    # query = select(thesTable.c)

    # results = session.execute(query).fetchall()

    # for row in results:
    #     thesaurusDictTraduction[row['fullPath']] = {
    #         'en': row['nameEn'], 'fr': row['nameFr']}
    #     invertedThesaurusDict['en'][row['nameEn']] = row['fullPath']
    #     invertedThesaurusDict['fr'][row['nameFr']] = row['fullPath']
    # session.close()
