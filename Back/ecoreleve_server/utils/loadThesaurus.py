from ..Models import dbConfig, Base
import requests
from multiprocessing.dummy import Pool as ThreadPool
import copy
import time
from sqlalchemy import select
import json

thesaurusDictTraduction = {}


def flattenThesaurus(nodes):
    items = []
    for node in nodes:
        if node.get('children', None):
            items.extend(flattenThesaurus(node.get('children', [])).items())
        else:
            items.append((node['fullpath'], node['valueTranslated']))
    return dict(items)


def fetchThes(args):
    try:
        args['lng'] = 'en'
        url = dbConfig['wsThesaurus']['wsUrl'] + '/fastInitForCompleteTree'
        responseEn = requests.post(url, args)

        if responseEn.status_code != 200:
            time.sleep(3)
            responseEn = requests.post(url, args)

        args['lng'] = 'fr'
        responseFr = requests.post(url, args)

        if responseFr.status_code != 200:
            time.sleep(3)
            responseFr = requests.post(url, args)

        thesaurusNode = json.loads(responseEn.text)
        thesaurusNodeFr = json.loads(responseFr.text)
        return (thesaurusNode['key'], {'en': flattenThesaurus(thesaurusNode['children']),
                                       'fr': flattenThesaurus(thesaurusNodeFr['children'])
                                       })
    except:
        from traceback import print_exc
        print_exc()
        print('thesaurus not loaded for nodeID : ' + args['StartNodeID'])
        return (args['StartNodeID'], {})


def getThesaurusNodeID(config):
    if not dbConfig.get('wsThesaurus', None):
        print('\n NO thesaurus API')
        return

    print('\n ________________ pull from Thesaurus API \n')
    session = config.registry.dbmaker()
    ModuleFormTable = Base.metadata.tables['ModuleForms']
    query = select([ModuleFormTable.c['Options']]
                   ).distinct(ModuleFormTable.c['Options']
                              ).where(ModuleFormTable.c['InputType'] == 'AutocompTreeEditor')
    startIDs = [r for r, in session.execute(query).fetchall()]
    session.close()

    thread_pool = ThreadPool(10)
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
