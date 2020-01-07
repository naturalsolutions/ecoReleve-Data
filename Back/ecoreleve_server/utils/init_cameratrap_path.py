import os
import errno
from ecoreleve_server.dependencies import dbConfig


def includeme(config):
    addCamTrapModule(dbConfig)
    addMediaFileModule(dbConfig)


def addCamTrapModule( dbConfig):
    if(os.path.exists(dbConfig['camTrap']['path'])):
        try :
            os.access( dbConfig['camTrap']['path'], os.W_OK)
            print(f"folder : {dbConfig['camTrap']['path']} exist")
        except :
            print(f"app cant write in this directory ask your admin {dbConfig['camTrap']['path']}")
            raise
            #declenché erreur
    else:
        print (f"folder {dbConfig['camTrap']['path']} doesn't exist we gonna try to create it")
        try:
            os.makedirs(dbConfig['camTrap']['path'])
            print(f"folder created : {dbConfig['camTrap']['path']}")
            os.makedirs(os.path.join(dbConfig['camTrap']['path'],'export'))
            print(f"folder created : {os.path.join(dbConfig['camTrap']['path'],'export')}")
        except OSError as exception:
            if exception.errno != errno.EEXIST:
                raise

    if(os.path.exists(os.path.join(dbConfig['camTrap']['path'],'export')) ):
        try :
            os.access( os.path.join(dbConfig['camTrap']['path'],'export'), os.W_OK)
            print(f"folder : {os.path.join(dbConfig['camTrap']['path'],'export')} exist")
        except :
            print(f"app cant write in this directory ask your admin {os.path.join(dbConfig['camTrap']['path'],'export')}")
            raise
            #declenché erreur
    else:
        print (f"folder {os.path.join(dbConfig['camTrap']['path'],'export')} doesn't exist we gonna try to create it")
        try:
            os.makedirs(os.path.join(dbConfig['camTrap']['path'],'export'))
            print(f"folder created : {os.path.join(dbConfig['camTrap']['path'],'export')}")
        except OSError as exception:
            if exception.errno != errno.EEXIST:
                raise


def addMediaFileModule(dbConfig):
    if(os.path.exists(dbConfig['mediasFiles']['path']) ):
        try :
            os.access( dbConfig['mediasFiles']['path'], os.W_OK)
            print(f"folder : {dbConfig['mediasFiles']['path']} exist")
        except :
            print(f"app cant write in this directory ask your admin {dbConfig['mediasFiles']['path']}")
            raise
            #declenché erreur
    else:
        print (f"folder {dbConfig['mediasFiles']['path']} doesn't exist we gonna try to create it")
        try:
            os.makedirs(dbConfig['mediasFiles']['path'])
            print(f"folder created : {dbConfig['mediasFiles']['path']}")
        except OSError as exception:
            if exception.errno != errno.EEXIST:
                raise