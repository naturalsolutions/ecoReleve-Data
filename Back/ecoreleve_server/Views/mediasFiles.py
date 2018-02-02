from ..Models import (
    dbConfig
)

from . import CustomView, context_permissions
import os,sys,errno
from ..controllers.security import RootCore
import shutil
import subprocess
from ..Models import MediasFiles
from sqlalchemy import and_


class MediasFilesView(CustomView):

    def __init__(self, ref, parent):
        CustomView.__init__(self, ref, parent)
        self.actions = {
                        'upload': self.upload
                        }
        self.__acl__ = context_permissions[ref]

    def upload(self):
        if self.request.POST and 'fileBin' in self.request.POST and 'FK_Station' in self.request.POST: 
            FK_Station = self.request.POST['FK_Station']
            fileBin = self.request.POST['fileBin']
            fileName = fileBin.filename
            try :
                status = self.createFile(FK_Station,fileBin)
            except Exception as error:
                self.request.response.status_code = 409
                return error
            else:
                try :
                    newMedia = MediasFiles(
                        Path = os.path.join(dbConfig['mediasFiles']['path'],FK_Station),
                        Name= fileName,
                        Extension= fileName.split('.')[-1],
                        Creator = self.request.authenticated_userid['iss'],
                        FK_Station = FK_Station
                    )
                    self.session.add(newMedia)
                    self.session.flush()
                except Exception as error:
                    self.removeFile(fileName)
                    raise
            
            #create new file on hdd
            # if file exist 
                #erase it 
                #remove on DB
            #addSQL

        data = {}
        ( total , used, free) = shutil.disk_usage(dbConfig['camTrap']['path'])
        data['total'] = str(total)
        data['used'] = str(used)
        data['free'] = str(free)
        return data

    def createFile(self, FK_Station, fileBin):
        status = False
        errorMsg = None
        absolutePath = os.path.join( dbConfig['mediasFiles']['path'],FK_Station)
        absolutePathForFile = os.path.join( dbConfig['mediasFiles']['path'],FK_Station, fileBin.filename)
        fileName = fileBin.filename
        if os.path.isfile(absolutePathForFile):
            print("le fichier existe deja")
            try:
                print("on tente de le supprimer")
                self.removeFile(absolutePathForFile)
            except Exception :
                print("erreurs first")
                raise
        if not os.path.isfile(absolutePathForFile):
            # write in the file
            try:
                if not os.path.isdir(absolutePath):
                    os.mkdir(absolutePath)
            except OSError  as e:
                print("erreurs second")
                print(e)
                if e.errno != errno.EEXIST:
                    status = False
                    raise 
            try:
                with open(absolutePathForFile , 'wb') as output_file:
                    shutil.copyfileobj(fileBin.file, output_file)
                    status = True
                output_file.close()
            except Exception as error:
                print("erreurs third")
                status = False
                raise

        return status

    def removeFile(self , absolutePathForFile):
        path, fkStation, fileName = absolutePathForFile.rsplit('\\',2)

        try:
            print(os.path.join(path,fkStation),fileName,fkStation)
            mediaElem = self.session.query(MediasFiles).filter(
                    and_(
                        MediasFiles.Path == os.path.join(path,fkStation) ,
                        MediasFiles.Name == fileName,
                        MediasFiles.Extension == fileName.split('.')[-1],
                        MediasFiles.FK_Station == fkStation
                         )
                ).one()
            if mediaElem.Id:
                print("suppression du media Elem")
                self.session.delete(mediaElem)
                self.session.flush()
            oldAbsolutePathForFile = os.path.join(absolutePathForFile)
            os.remove(oldAbsolutePathForFile)
            print("suppression du fichier ")
        except Exception as error:
            print("erreur dans sql ou file")
            raise



RootCore.listChildren.append(('mediasfiles', MediasFilesView))

