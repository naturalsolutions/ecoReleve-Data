import os,sys
import errno


def initialize_cameratrap_path(dbConfig, settings):
    addCamTrapModule(settings, dbConfig)
    addMediaFileModule(settings, dbConfig)


def addCamTrapModule(settings, dbConfig):
    dbConfig['camTrap'] = {}
    if 'camTrap.path' in settings:
        dbConfig['camTrap']['path'] = settings['camTrap.path']
    else :
        print("camera trap module not activated")    
        return

    if(os.path.exists(dbConfig['camTrap']['path']) ):
        try :
            os.access( dbConfig['camTrap']['path'], os.W_OK)
            print("folder : %s exist" %(dbConfig['camTrap']['path']))
        except :
            print("app cant write in this directory ask your admin %s" %(dbConfig['camTrap']['path']) )
            raise
            #declenché erreur
    else:
        print ("folder %s doesn't exist we gonna try to create it" %(dbConfig['camTrap']['path']))
        try:
            os.makedirs(dbConfig['camTrap']['path'])
            print("folder created : %s" %(dbConfig['camTrap']['path']))
            os.makedirs(os.path.join(dbConfig['camTrap']['path'],'export'))
            print("folder created : %s" %(os.path.join(dbConfig['camTrap']['path'],'export')))
        except OSError as exception:
            if exception.errno != errno.EEXIST:
                raise
    
    if(os.path.exists(os.path.join(dbConfig['camTrap']['path'],'export')) ):
        try :
            os.access( os.path.join(dbConfig['camTrap']['path'],'export'), os.W_OK)
            print("folder : %s exist" %(os.path.join(dbConfig['camTrap']['path'],'export')))
        except :
            print("app cant write in this directory ask your admin %s" %(os.path.join(dbConfig['camTrap']['path'],'export')) )
            raise
            #declenché erreur
    else:
        print ("folder %s doesn't exist we gonna try to create it" %(os.path.join(dbConfig['camTrap']['path'],'export')))
        try:
            os.makedirs(os.path.join(dbConfig['camTrap']['path'],'export'))
            print("folder created : %s" %(os.path.join(dbConfig['camTrap']['path'],'export')))
        except OSError as exception:
            if exception.errno != errno.EEXIST:
                raise


def addMediaFileModule(settings, dbConfig):
    dbConfig['mediasFiles'] = {}
    dbConfig['mediasFiles']['path'] = settings['mediasFiles.path']
    if dbConfig['mediasFiles'] == {}:
        print("media files protocole not activated")
        raise SystemExit
        return
    if(os.path.exists(dbConfig['mediasFiles']['path']) ):
        try :
            os.access( dbConfig['mediasFiles']['path'], os.W_OK)
            print("folder : %s exist" %(dbConfig['mediasFiles']['path']))
        except :
            print("app cant write in this directory ask your admin %s" %(dbConfig['mediasFiles']['path']) )
            raise
            #declenché erreur
    else:
        print ("folder %s doesn't exist we gonna try to create it" %(dbConfig['mediasFiles']['path']))
        try:
            os.makedirs(dbConfig['mediasFiles']['path'])
            print("folder created : %s" %(dbConfig['mediasFiles']['path']))
        except OSError as exception:
            if exception.errno != errno.EEXIST:
                raise