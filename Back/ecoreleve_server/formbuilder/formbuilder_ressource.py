from ecoreleve_server.modules.permissions import context_permissions
from ecoreleve_server.modules.field_activities.field_activity_model import *
from sqlalchemy import asc
from zope.interface import implementer
from ecoreleve_server.core.base_view import IRestCommonView
from pyramid.traversal import find_root


class MetaRootRessource (dict):
    __acl__ = context_permissions['formbuilder']
    __name__ = ''
    __parent__ = None

    def __init__ (self, name, ref, request):
        self.__name__ = name
        self.__parent__ = ref
        self.__request__ = request

    def __getitem__ (self, name):
        if name:
            return MetaCollectionRessource(name,self, self.__request__)
        else:
            raise KeyError

    def retrieve (self):
        print('retrieve from Ressource(type: '+str(self.__class__.__name__)+'):' +str(self.__name__))
        return 'retrieve from Ressource:' +str(self.__name__)

    def create (self):
        print('create from :' +str(self.__name__))
        return 'create from :' +str(self.__name__)

    def delete (self):
        print('delete from :' +str(self.__name__))
        return 'delete from :' +str(self.__name__)

    def patch (self):
        print('patch from :' +str(self.__name__))
        return 'patch from :' +str(self.__name__)

    def update (self):
        print('update from :' +str(self.__name__))
        return 'update from :' +str(self.__name__)


class MetaCollectionRessource (MetaRootRessource):
    __acl__ = context_permissions['formbuilder']
    __name__ = ''
    __parent__ = None

    def __init__ (self, name, ref, request):
        self.__name__ = name
        self.__parent__ = ref
        self.__request__ = request

    def __getitem__ (self, name):
        if name:
            return MetaItemRessource(name,self, self.__request__)
        else:
            raise KeyError

class MetaItemRessource (MetaCollectionRessource):
    __acl__ = context_permissions['formbuilder']
    __name__ = ''
    __parent__ = None

    def __init__ (self, name, ref, request):
        self.__name__ = name
        self.__parent__ = ref
        self.__request__ = request
    
    def __getitem__ (self, name):
        print("it's the __getitem__ from Meta CLASS you should implement you own ressource")
        if name:
            return MetaCollectionRessource(name,self, self.__request__)
        else:
            raise KeyError



class FormBuilderRessource (dict):
    
    __acl__ = context_permissions['formbuilder']
    __name__ = ''
    __parent__ = None

    def __init__(self, name, ref, request):
        self.__name__ = name
        self.__parent__ = ref
        self.__request__ = request

    def __getitem__(self, name):
        if name == 'FieldActivity':
            return FieldActivityCollection(name,self)
        else:
            raise KeyError

    
    def retrieve(self):
        return 'Formbuilder Ressource(root node)'


class FieldActivityCollection (FormBuilderRessource):

    __acl__ = context_permissions['formbuilder']
    params = {
        'protocoleType' : {
            'ID' : None,
            'Name' : None
        }
    }

    def __init__(self, name, ref):
        self.__name__ = name
        self.__parent__ = ref
        self.__request__ = ref.__request__

    def __getitem__ (self,name):
        print("getitem de fieldActivityCollection")
        try:
            val = int(name)
            print("name is an int we gonna return a ressource", name, val)
            return FieldActivityRessource(val,self)
        except ValueError:
            print("WE GONNA RAISE ERROR")
            raise KeyError


    def parseQueryString(self):
        multiDictParams = self.request.GET

        if 'protocoleType.ID' in multiDictParams:
            #should raise warning if len > 2
            self.params['protcoleType']['ID'] = multiDictParams['protocoleType.ID'][0]
        if 'protocoleType.Name' in multiDictParams:
            self.params['protocoleType']['Name'] = multiDictParams['protocoleType.Name'][0]
            
    def retrieve (self):
        res = self.__request__.dbsession.\
            query(fieldActivity.ID,fieldActivity.Name).\
            join(FieldActivity_ProtocoleType, fieldActivity.ID == FieldActivity_ProtocoleType.FK_fieldActivity).\
            join(ProtocoleType, FieldActivity_ProtocoleType.FK_ProtocoleType == ProtocoleType.ID).\
            order_by(asc(fieldActivity.ID)).\
            all()

        toRet = []
        for item in res: 
            toRet.append(item._asdict())

        return toRet

class FieldActivityRessource (FieldActivityCollection):

    __acl__ = context_permissions['formbuilder']
   
    
    def __init__(self, name, ref):
        self.__name__ = name
        self.__parent__ = ref
        self.__request__ = ref.__request__


    def retrieve (self):
        item = self.__request__.dbsession.query(fieldActivity).get(self.__name__)

        return {
                'ID' : getattr(item, 'ID'),
                'Name': getattr(item, 'Name')
                }

