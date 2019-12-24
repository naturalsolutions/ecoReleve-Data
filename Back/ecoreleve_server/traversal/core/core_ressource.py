from webargs import fields
from webargs.pyramidparser import parser

class MetaRootRessource (dict):
    __acl__ = []
    __name__ = ''
    __parent__ = None

    def __init__(self, name, parent, request):
        self.__name__ = name
        self.__parent__ = parent
        # DON'T CHANGE THIS :)
        # webargs expect 'request' key in object for parsing
        # for now i don't know another or workaround
        self.request = request


    def __getitem__(self, name):
        if name:
            return MetaCollectionRessource(name=name, parent=self, request=self.request)
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

    # Should have a limitParams too
    # If we want to paginate EVERY request it's for limit number of objects
    # you can fetch in one
    # query client can't ask offset = 0 and limit = 5 000 000

    # We could by default overwrite the offset and limit params for request
    # But we need to have control in the ressource
    # TODO: Create a class with LimitQuery and NoLimitQuerry
    missing = {
        'offset'    :   0,
        'limit'     : 500
    }
    defaultParams = {
        'offset' : fields.Int(missing=missing.get('offset')),
        'limit'  : fields.Int(missing=missing.get('limit'))
    }

    paramsForContext = {
    }

    def __init__(self, name, parent, request):
        super().__init__(name=name, parent=parent, request=request)
        self.defaultParams = self._setDefaultParams()

    def _setDefaultParams(self):
        '''
        Will add a default pagination parameters for querybuilder
        and everything we will need for every MetaCollectionRessource and child
        '''
        toRet = {}
        toRet.update(self.handlePagination())
        return toRet

    @parser.use_args(defaultParams)
    def handlePagination(self,args):
        return args

    def getParamsForContext(self):
        return self.paramsForContext

    def setParamsForContext(self,params):
        self.paramsForContext = params


    def __getitem__(self, name):
        try:
            val = int(name)
            print("name is an int we gonna return a ressource", name, val)
            return MetaItemRessource(name=name, parent=self, request=self.request)
        except ValueError:
            print("WE GONNA RAISE ERROR")
            raise KeyError


class MetaItemRessource (MetaCollectionRessource):

    def __getitem__(self, name):
        print("it's the __getitem__ from Meta CLASS you should implement you own ressource")
        if name:
            return MetaCollectionRessource(name=name, parent=self, request=self.request)
        else:
            raise KeyError


class MetaEndPointNotREST (MetaRootRessource):
    pass