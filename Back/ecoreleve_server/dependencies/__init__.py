

dbConfig= {}

__all__ =[
    "dbConfig"
]

def includeme(config):
    settings = config.get_settings()

    #TODO FOR REAL!!!!!!! TAKE TIME REMOVE THIS!!!!
    # need time because it's use for build statement
    # for SQL so need to think!
    # (script for calling sp_ )
    dbConfig['url'] = settings.get('sqlalchemy.default.url')
    dbConfig['wsThesaurus'] = {}
    dbConfig['wsThesaurus']['wsUrl'] = settings.get('wsThesaurus.wsUrl')
    dbConfig['wsThesaurus']['lng'] = settings.get('wsThesaurus.lng')
    dbConfig['data_schema'] = settings.get('data_schema')
    dbConfig['sensor_schema'] = settings.get('sensor_schema')
    dbConfig['cn.dialect'] = settings.get('cn.dialect')
    dbConfig['dbLog.url'] = settings.get('dbLog.url')
    dbConfig['dbLog.schema'] = settings.get('dbLog.schema')
    dbConfig['camTrap'] = {}
    dbConfig['camTrap']['path'] = settings.get('camTrap.path')
    print(f"camera trap path {dbConfig['camTrap']['path']}")

    dbConfig['mediasFiles'] = {}
    dbConfig['mediasFiles']['path'] = settings.get('mediasFiles.path')
    print(f"Media files protocols path {dbConfig['mediasFiles']['path']}")

    dbConfig['init_exiftool'] = settings.get('init_exiftool', False)
