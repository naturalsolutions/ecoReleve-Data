from pyramid.httpexceptions import HTTPUnauthorized, HTTPForbidden
from pyramid_jwtauth import JWTAuthenticationPolicy
from pyramid.security import (
    Allow,
    Authenticated,
    ALL_PERMISSIONS,
    Everyone,
    Deny
)


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
            # if int(ref) == 0:
            #     return False
        except (TypeError, ValueError):
            return False
        return True


class SecurityRoot(Resource):
    __acl__ = [
        (Allow, Authenticated, 'read'),
        (Allow, Authenticated, 'all'),
        (Allow, 'group:admin', 'admin'),
        (Allow, 'group:admin', 'superUser'),
        (Allow, 'group:admin', 'all'),
        (Allow, 'group:superUser', 'superUser'),
        (Allow, 'group:superUser', 'all')
    ]

    def __init__(self, request):
        Resource.__init__(self, ref='', parent=None)
        self.request = request

    def __getitem__(self, item):
        if item == 'ecoReleve-Core':
            return RootCore(item, self)


class RootCore(SecurityRoot):

    listChildren = []

    def __init__(self, ref, parent):
        Resource.__init__(self, ref, parent)
        self.add_children()

    def add_children(self):
        for ref, klass in self.listChildren:
            self.add_child(ref, klass)

    def __getitem__(self, item):
        return self.get(item)

    def retrieve(self):
        return {'next items': self}


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


context_permissions = {
    'stations': [
        (Allow, 'group:admin', ALL_PERMISSIONS),
        (Allow, 'group:superUser', ('create', 'update', 'read')),
        (Allow, 'group:user', ('create', 'update', 'read'))
    ],

    'observations': [
        (Allow, 'group:admin', ALL_PERMISSIONS),
        (Allow, 'group:superUser', ALL_PERMISSIONS),
        (Allow, 'group:user', ALL_PERMISSIONS)
    ],

    'individuals': [
        (Allow, 'group:admin', ALL_PERMISSIONS),
        (Allow, 'group:superUser', ('update', 'read')),
        (Allow, 'group:user', 'read')
    ],

    'monitoredSites': [
        (Allow, 'group:admin', ALL_PERMISSIONS),
        (Allow, 'group:superUser', ('create', 'update', 'read')),
        (Allow, 'group:user', ('create', 'update', 'read'))
    ],

    'sensors': [
        (Allow, 'group:admin', ALL_PERMISSIONS),
        (Allow, 'group:superUser', 'read'),
        (Allow, 'group:user', 'read')
    ],

    'release': [
        (Allow, 'group:admin', ALL_PERMISSIONS),
        (Deny, 'group:superUser', ALL_PERMISSIONS),
        (Deny, 'group:user', ALL_PERMISSIONS),
    ],
}


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
