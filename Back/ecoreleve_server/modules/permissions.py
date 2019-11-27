from pyramid.security import (
    Allow,
    Authenticated,
    ALL_PERMISSIONS,
    Everyone,
    Deny
)
###
# RTFM!!!!!!!
# https://docs.pylonsproject.org/projects/pyramid/en/latest/narr/security.html#elements-of-an-acl
#
# SO and acl = (A,B,C)
# A could be Allow or Deny
# B is a principal 
# C is the persmission or sequence of permissions
# example:
# (Allow, 'group:admin' , ('create','update','read') )
# means IF your principal is 'group:admin' you are ALLOWED to (create, update, read)
###


## NEED A TRUE REFACT (
# that's not just autorization access for ressources we need a global vision 
# for now we gonna create a "special" action 'fixForOld'
# )
## but for now we g


context_permissions = {
    'regions': [
        (Allow, 'group:admin', ALL_PERMISSIONS),
        # (Allow, Authenticated, ALL_PERMISSIONS),
        (Allow, 'group:superUser', ('create', 'update', 'read')),
        (Allow, 'group:user', ('read'))
    ],

    'import': [
        (Allow, 'group:admin', ALL_PERMISSIONS),
        (Allow, 'group:superUser', ('create', 'update', 'read')),
        (Allow, 'group:user', ('create', 'update', 'read'))
    ],

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
    'dashboard' : [
        (Allow, 'group:admin', ALL_PERMISSIONS),
        (Allow, 'group:superUsers', 'read'),
        (Allow, 'group:users', 'read')
    ],
    'mediasfiles' : [
        (Allow, 'group:admin', ALL_PERMISSIONS),
        (Allow, 'group:superUsers', ('create', 'update', 'read')),
        (Allow, 'group:users', 'read')
    ]
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
    'dashboard': {
        'GET': 'all',
        'POST': 'superUser',
        'PUT': 'superUser',
        'DELETE': 'superUser'
    },
    'mediasfiles': {
        'GET': 'all',
        'POST': 'admin',
        'PUT': 'admin',
        'DELETE': 'admin'
    },
}
