from zope.interface import implementer
from ecoreleve_server.ModelDB.MAIN_DB import Station
from ecoreleve_server.core.base_view import IRestCommonView


@implementer(IRestCommonView)
class Root(object):
    __name__ = None
    __parent__ = None

    def __init__(self,name,parent,request):
        self.__name__ = name
        self.__parent__ = parent
        self.request = request
        print("init de "+type(self).__name__+" args name {} parent {}".format(name,parent))

    
    def __getitem__(self,key):
        try:
            return getattr(self,key)
        except AttributeError:
            raise KeyError()

    def retrieve(self):
        return self.__name__


class Home(Root):
    __name__ = ''
    __parent__ = None
    __model__ = None

    def __init__(self,name,parent,request):
        super().__init__(name,parent,request)
    

class StationsContainer(Root):
    __name__ = 'Stations'
    __parent__ = None
    __model__ = Station

    def __init__(self,name,parent,request):
        super().__init__(name,parent,request)

    def __getitem__(self,key):
        try:
            key = int(key)
            return StationsItem(key,self,self.request)
        except ValueError:
            if key == 'observations':
                return ObservationsContainer(key,self,self.request)
            else:
                print("value error key :",key)
                raise KeyError(key)



class StationsItem(StationsContainer):

    
    def __init__(self,name,parent,request):
        super().__init__(name,parent,request)

    def retrieve(self):
        a = self.request.dbsession.query(self.__parent__.__model__).get(self.__name__)
        print("dict")
        print(a.to_dict(rel=True))
        print("json")
        print(a.to_json())
        return 'ok'

class ObservationsContainer(StationsContainer):
    __name__ = 'Observations'
    __parent__ = None

    def __init__(self,name,parent,request):
        super().__init__(name,parent,request)

    def __getitem__(self,key):
        try:
            key = int(key)
            return ObservationsItem(key,self)
        except ValueError:
            print(key)
            raise KeyError(key)

class ObservationsItem(ObservationsContainer):

    def __init__(self,name,parent):
        super().__init__(name,parent)
