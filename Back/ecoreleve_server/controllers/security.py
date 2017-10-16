from pyramid.httpexceptions import HTTPUnauthorized, HTTPForbidden
from pyramid_jwtauth import JWTAuthenticationPolicy
from pyramid.security import (
    Allow,
    Authenticated,
    ALL_PERMISSIONS,
    Everyone,
    Deny
)


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
        (Allow, 'group:admins', ALL_PERMISSIONS),
        (Allow, 'group:superUsers', ('create', 'update', 'read')),
        (Allow, 'group:users', ('create', 'update', 'read'))
    ],

    'observations': [
        (Allow, 'group:admins', ALL_PERMISSIONS),
        (Allow, 'group:superUsers', ALL_PERMISSIONS),
        (Allow, 'group:users', ALL_PERMISSIONS)
    ],

    'individuals': [
        (Allow, 'group:admins', ('create', 'update', 'read')),
        (Allow, 'group:superUsers', ('update', 'read')),
        (Allow, 'group:users', 'read')
    ],

    'monitoredSites': [
        (Allow, 'group:admins', ALL_PERMISSIONS),
        (Allow, 'group:superUsers', ('create', 'update', 'read')),
        (Allow, 'group:users', ('create', 'update', 'read'))
    ],

    'sensors': [
        (Allow, 'group:admins', ALL_PERMISSIONS),
        (Allow, 'group:superUsers', 'read'),
        (Allow, 'group:users', 'read')
    ],

    'release': [
        (Allow, 'group:admins', ALL_PERMISSIONS),
        (Deny, 'group:superUsers', ALL_PERMISSIONS),
        (Deny, 'group:users', ALL_PERMISSIONS),
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
