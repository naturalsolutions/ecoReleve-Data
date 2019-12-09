
class MetaRootRessource (dict):
    __acl__ = []
    __name__ = ''
    __parent__ = None

    def __init__(self, name, parent, request):
        self.__name__ = name
        self.__parent__ = parent
        self.__request__ = request

    def __getitem__(self, name):
        if name:
            return MetaCollectionRessource(name=name, parent=self, request=self.__request__)
        else:
            raise KeyError

    def retrieve(self):
        print('retrieve from Ressource(type: '+str(self.__class__.__name__)+'):' +str(self.__name__))
        return 'retrieve from Ressource:' + str(self.__name__)

    def create(self):
        print('create from :' + str(self.__name__))
        return 'create from :' + str(self.__name__)

    def delete(self):
        print('delete from :' + str(self.__name__))
        return 'delete from :' + str(self.__name__)

    def patch(self):
        print('patch from :' + str(self.__name__))
        return 'patch from :' + str(self.__name__)

    def update(self):
        print('update from :' + str(self.__name__))
        return 'update from :' + str(self.__name__)


class MetaEmptyNodeRessource (MetaRootRessource):
    pass

class MetaCollectionRessource (MetaRootRessource):

    dbModel = None
    

    def __getitem__(self, name):
        try:
            val = int(name)
            print("name is an int we gonna return a ressource", name, val)
            return MetaItemRessource(name=name, parent=self, request=self.__request__)
        except ValueError:
            print("WE GONNA RAISE ERROR")
            raise KeyError


class MetaItemRessource (MetaCollectionRessource):

    def __getitem__(self, name):
        print("it's the __getitem__ from Meta CLASS you should implement you own ressource")
        if name:
            return MetaCollectionRessource(name=name, parent=self, request=self.__request__)
        else:
            raise KeyError


class MetaEndPointNotREST (MetaRootRessource):
    pass