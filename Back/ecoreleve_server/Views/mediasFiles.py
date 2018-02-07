from ..Models import (
    dbConfig
)

from . import CustomView, context_permissions
import os,sys,errno
from ..controllers.security import RootCore
import shutil
import subprocess
import urllib.parse
from ..Models import MediasFiles
from sqlalchemy import and_

class MediaFileView(CustomView):

    model = MediasFiles
    

    def __init__(self, ref, parent):
        CustomView.__init__(self, ref, parent)
        self.itemID = int(ref)
    
    def __getitem__(self, ref):
        return self

    def retrieve(self):

        item = self.session.query(MediasFiles).get(self.itemID)
        if item:
            return item.serialize()
        else:
            self.request.response.status_code = 404
            return

    def delete(self):
        if self.itemID > 0 :
            item = self.session.query(MediasFiles).get(self.itemID)
        if item and item.Id > 0:
            absPath = os.path.join(item.Path , item.Name)
            self.removeFile(absPath)
            self.session.delete(item)  
            return 'deleted'
        else:
            self.request.response.status_code = 404
            return 

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
                self.session.delete(mediaElem)
                self.session.flush()
            oldAbsolutePathForFile = os.path.join(absolutePathForFile)
            os.remove(oldAbsolutePathForFile)
        except Exception as error:
            print("erreur dans sql ou file")
            raise

class MediasFilesView(CustomView):
    item = MediaFileView

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
        else :
            self.request.response.status_code = 400
            return

    def createFile(self, FK_Station, fileBin):
        status = False
        errorMsg = None
        absolutePath = os.path.join( dbConfig['mediasFiles']['path'],FK_Station)
        absolutePathForFile = os.path.join( dbConfig['mediasFiles']['path'],FK_Station, fileBin.filename)
        fileName = fileBin.filename
        if os.path.isfile(absolutePathForFile):
            try:
                self.removeFile(absolutePathForFile)
            except Exception :
                raise
        if not os.path.isfile(absolutePathForFile):
            # write in the file
            try:
                if not os.path.isdir(absolutePath):
                    os.mkdir(absolutePath)
            except OSError  as e:
                if e.errno != errno.EEXIST:
                    status = False
                    raise 
            try:
                with open(absolutePathForFile , 'wb') as output_file:
                    shutil.copyfileobj(fileBin.file, output_file)
                    status = True
                output_file.close()
            except Exception as error:
                status = False
                raise

        return status

    def removeFile(self , absolutePathForFile):
        path, fkStation, fileName = absolutePathForFile.rsplit('\\',2)

        try:
            mediaElem = self.session.query(MediasFiles).filter(
                    and_(
                        MediasFiles.Path == os.path.join(path,fkStation) ,
                        MediasFiles.Name == fileName,
                        MediasFiles.Extension == fileName.split('.')[-1],
                        MediasFiles.FK_Station == fkStation
                         )
                ).one()
            if mediaElem.Id:
                self.session.delete(mediaElem)
                self.session.flush()
            oldAbsolutePathForFile = os.path.join(absolutePathForFile)
            os.remove(oldAbsolutePathForFile)
        except Exception as error:
            print("erreur dans sql ou file")
            raise




RootCore.listChildren.append(('mediasfiles', MediasFilesView))

