from pyramid.httpexceptions import HTTPUnauthorized, HTTPForbidden
from pyramid_jwtauth import JWTAuthenticationPolicy
from pyramid.security import (
    Allow,
    Authenticated,
    ALL_PERMISSIONS,
    Everyone
)
from pyramid.traversal import find_root
from pyramid.view import view_config, view_defaults
from ..Models import Station as StationDB, StationList, FrontModules, Base, Sensor as SensorDB, SensorList
from collections import OrderedDict
from sqlalchemy import select


class Resource(dict):

    def __init__(self, ref, parent):
        self.__name__ = ref
        self.__parent__ = parent

    def __repr__(self):
        # use standard object representation (not dict's)
        return object.__repr__(self)

    def add_child(self, ref, klass):
        resource = klass(ref=ref, parent=self)
        self[ref] = resource

    def integers(self, ref):
        try:
            ref = int(ref)
            if int(ref) == 0:
                return False
        except (TypeError, ValueError):
            return False
        return True


class SecurityRoot(Resource):
    __acl__ = [
        (Allow, Authenticated, 'read'),
        (Allow, Authenticated, 'all'),
        (Allow, 'group:admins', 'admin'),
        (Allow, 'group:admins', 'superUser'),
        (Allow, 'group:admins', 'all'),
        (Allow, 'group:superUsers', 'superUser'),
        (Allow, 'group:superUsers', 'all'),
        # DENY_ALL
    ]

    def __init__(self, request):
        Resource.__init__(self, ref='', parent=None)
        self.request = request

    def __getitem__(self, item):
        return RootCore(item, self)


class RootCore(SecurityRoot):

    def __init__(self, ref, parent):
        Resource.__init__(self, ref, parent)
        self.add_children()

    def add_children(self):
        self.add_child('TestSensors', Sensors)
        self.add_child('TestStations', Stations)

    def __getitem__(self, item):
        return self.get(item)


class DynamicObject(SecurityRoot):

    def __init__(self, ref, parent):
        Resource.__init__(self, ref, parent)
        root = find_root(self)
        self.request = root.request
        self.session = root.request.dbsession

        self.__actions__ = {'forms': self.getForm,
                            '0': self.getForm,
                            'getFields': self.getGrid,
                            'getFilters': self.getFilter,
                            'getType': self.getType,
                            }

        if self.integers(ref):
            self.objectDB = self.session.query(self.model).get(ref)
        else:
            self.objectDB = self.model()
            self.retrieve = self.actions.get(ref)

    @property
    def actions(self):
        return self.__actions__

    @actions.setter
    def actions(self, dictActions):
        self.__actions__.update(dictActions)

    @property
    def model(self):
        raise Exception('method has to be overriden')

    @property
    def formModuleName(self):
        raise Exception('method has to be overriden')

    @property
    def gridModuleName(self):
        raise Exception('method has to be overriden')

    def getData(self):
        self.objectDB.LoadNowValues()
        return self.objectDB.GetFlatObject()

    def getDataWithForm(self):
        conf = self.getConf()
        try:
            displayMode = self.request.params['DisplayMode']
        except:
            displayMode = 'display'
        self.objectDB.LoadNowValues()
        return self.objectDB.GetDTOWithSchema(conf, displayMode)

    @view_config(request_method='GET', renderer='json')
    def retrieve(self):
        return self.getDataWithForm()

    def update(self, data, patch=False):
        self.objectDB.UpdateFromJson(data)
        return 'update'

    def delete(self):
        return 'delete'

    def getConf(self):
        return self.session.query(FrontModules
                                  ).filter(FrontModules.Name == self.formModuleName
                                           ).first()

    def getForm(self):
        objectType = self.request.params['ObjectType']
        Conf = self.getConf()
        setattr(self.objectDB, self.objectDB.getTypeObjectFKName(), objectType)
        schema = self.objectDB.GetForm(Conf, 'edit')
        return schema

    def getGrid(self):
        cols = self.model().GetGridFields(self.gridModuleName)
        return cols

    def getFilter(self):
        moduleName = self.request.params.get('FilterName', None)
        if not moduleName:
            moduleName = self.gridModuleName
        filtersList = self.objectDB.GetFilters(moduleName)
        filters = {}
        for i in range(len(filtersList)):
            filters[str(i)] = filtersList[i]
        return filters

    def getType(self):
        table = Base.metadata.tables[self.objectDB.getTypeObjectName()]
        query = select([table.c['ID'].label('val'),
                        table.c['Name'].label('label')])
        response = [OrderedDict(row) for row in self.session.execute(query).fetchall()]
        return response


class DynamicObjectCollection(SecurityRoot):

    def __init__(self, ref, parent):
        Resource.__init__(self, ref, parent)
        print('DynamicObjectCollection')
        print(ref, parent)

    def __getitem__(self, ref):
        print('DynamicObjectCollection getitem')
        return self.item(ref, self)

    @property
    def item(self):
        raise Exception('method has to be overriden')

    @property
    def collection(self):
        raise Exception('method has to be overriden')

    def retrieve(self):
        return 'search return list of values'

    def create(self):
        return 'create/ insert return new ID'

    def export(self):
        return 'export return Excel File'


class Station(DynamicObject):

    model = StationDB
    formModuleName = 'StationForm'
    gridModuleName = 'StationGrid'


class Stations(DynamicObjectCollection):

    collection = StationList
    item = Station


class Sensor(DynamicObject):

    model = SensorDB
    formModuleName = 'SensorForm'
    gridModuleName = 'SensorFilter'


class Sensors(DynamicObjectCollection):
    __acl__ = [
        (Allow, Everyone, ALL_PERMISSIONS),
    ]
    collection = SensorList
    item = Sensor


# @view_config(request_method='GET', context=Stations, renderer='json')
# def search_stations(context, request):
#     r = context.retrieve()
#     return r


# @view_config(request_method='GET', context=Station, renderer='json')
# def get_station(context, request):
#     r = context.retrieve()
#     return r


# @view_config(request_method='GET', context=Sensors, renderer='json')
# def search_sensors(context, request):
#     r = context.retrieve()
#     return r


# @view_config(request_method='GET', context=Sensor, renderer='json')
# def get_sensor(context, request):
#     r = context.retrieve()
#     return r


@view_defaults(context=Sensors)
class View(object):

    def __init__(self, context, request):
        self.request = request
        self.context = context

    @view_config(request_method='GET', renderer='json')
    def search_stations(self):
        r = self.context.retrieve()
        return r



class myJWTAuthenticationPolicy(JWTAuthenticationPolicy):

    def get_userID(self, request):
        try:
            token = request.cookies.get("ecoReleve-Core")
            claims = self.decode_jwt(request, token)
            userid = claims['iss']
            return userid
        except:
            return

    def get_userInfo(self, request):
        try:
            token = request.cookies.get("ecoReleve-Core")
            claims = self.decode_jwt(request, token, verify=True)
            return claims, True
        except:
            try:
                token = request.cookies.get("ecoReleve-Core")
                claims = self.decode_jwt(request, token, verify=False)
                return claims, False
            except:
                return None, False

    def user_info(self, request):
        claim, verify_okay = self.get_userInfo(request)
        if claim is None:
            return None
        return claim

    def authenticated_userid(self, request):
        userid = self.get_userID(request)
        claim = self.user_info(request)

        if userid is None:
            return None
        return claim

    def unauthenticated_userid(self, request):
        userid = self.get_userID(request)
        return userid

    def remember(self, response, principal, **kw):
        response.set_cookie('ecoReleve-Core', principal, max_age=100000)

    def forget(self, request):
        request.response.delete_cookie('ecoReleve-Core')

    def _get_credentials(self, request):
        return self.get_userID(request)

    def _check_signature(self, request):
        if request.environ.get('jwtauth.signature_is_valid', False):
            return True

    def challenge(self, request, content="Unauthorized"):
        if self.authenticated_userid(request):
            return HTTPUnauthorized(content, headers=self.forget(request))

        return HTTPForbidden(content, headers=self.forget(request))


routes_permission = {
    'stations': {
        'GET': 'all',
        'POST': 'all',
        'PUT': 'all',
        'DELETE': 'admin'
    },
    'protocols': {
        'GET': 'all',
        'POST': 'all',
        'PUT': 'all',
        'DELETE': 'all'
    },
    'sensors': {
        'GET': 'all',
        'POST': 'admin',
        'PUT': 'admin',
        'DELETE': 'admin'
    },
    'individuals': {
        'GET': 'all',
        'POST': 'admin',
        'PUT': 'superUser',
        'DELETE': 'noONe'
    },
    'monitoredSites': {
        'GET': 'all',
        'POST': 'all',
        'PUT': 'all',
        'DELETE': 'admin'
    },
    'release': {
        'GET': 'admin',
        'POST': 'admin',
        'PUT': 'admin',
        'DELETE': 'admin'
    },
    'export': {
        'GET': 'all',
        'POST': 'all',
        'PUT': 'all',
        'DELETE': 'all'
    },
    'rfid': {
        'GET': 'all',
        'POST': 'all',
        'PUT': 'all',
        'DELETE': 'all'
    },
    'argos': {
        'GET': 'superUser',
        'POST': 'superUser',
        'PUT': 'superUser',
        'DELETE': 'superUser'
    },
    'gsm': {
        'GET': 'superUser',
        'POST': 'superUser',
        'PUT': 'superUser',
        'DELETE': 'superUser'
    },
}
