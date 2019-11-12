from ecoreleve_server.traversal.core import MetaEndPointNotREST
from ecoreleve_server.modules.permissions import context_permissions
from pyramid.httpexceptions import HTTPBadRequest


class ImportWithFileLikeCSV(MetaEndPointNotREST):
    __acl__ = context_permissions['formbuilder']

    def create(self):
        filePosted = self.getFile()
        if filePosted is not None:
            "we got a file "
            print(filePosted)
            csvpandas = self.parseFile()
        else:
            HTTPBadRequest()
        "haaaaaaaaaa on veut poster du gsm"

    def getFile(self):
        if 'file' in self.__request__.POST:
            return self.__request__.POST['file']
        else:
            return None

    def parseFile(self):
        print("you should implement you own")
        return None


class GSMImport(ImportWithFileLikeCSV):

    __acl__ = context_permissions['formbuilder']
    
    def retrieve(self):
        return 'youhouuo GSMImport'
    
    def parseFile(self):
        print("on est dans le parsing des fichers gsm")


class ARGOSImport(ImportWithFileLikeCSV):
    __acl__ = context_permissions['formbuilder']

    def retrieve(self):
        return 'youhouuo ARGOSImport'

    def parseFile(self):
        print("on est dans le parsing des fichers ARGOS")