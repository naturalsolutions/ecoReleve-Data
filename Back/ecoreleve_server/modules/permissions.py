from pyramid.security import (
    Allow,
    ALL_PERMISSIONS,
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
# means IF your principal is 'group:admin'
# you are ALLOWED to (create, update, read)
###


# NEED A TRUE REFACT (
# that's not just autorization access for ressources we need a global vision
# for now we gonna create a "special" action 'fixForOld'
# )
# but for now we g


context_permissions = {
    'dashboard': [
        (Allow, 'group:admin', ALL_PERMISSIONS),
        (Allow, 'group:superUsers', 'read'),
        (Allow, 'group:users', 'read')
    ],
    'export': [
        (Allow, 'group:admin', ALL_PERMISSIONS),
        (Allow, 'group:superUsers', 'read'),
        (Allow, 'group:users', 'read')
    ],
    'fieldActivities': [
        (Allow, 'group:admin', ALL_PERMISSIONS),
        (Allow, 'group:superUsers', 'read'),
        (Allow, 'group:users', 'read')
    ],
    'importHistory': [
        (Allow, 'group:admin', ALL_PERMISSIONS),
        (Allow, 'group:superUsers', 'read'),
        (Allow, 'group:users', 'read')
    ],
    'individuals': [
        (Allow, 'group:admin', ('create', 'read', 'update')),
        (Allow, 'group:superUser', ('update', 'read')),
        (Allow, 'group:user', 'read')
    ],
    'individuals_history': [
        (Allow, 'group:admin', ('read', 'update', 'delete')),
        (Allow, 'group:superUser', ('read', 'update', 'delete')),
        (Allow, 'group:user', 'read')
    ],
    'individual_locations': [
        (Allow, 'group:admin', ('read', 'update', 'delete')),
        (Deny, 'group:superUser', ('update', 'delete')),
        (Allow, 'group:superUser', ('read')),
        (Allow, 'group:user', ('read'))
    ],
    'monitoredSites': [
        (Allow, 'group:admin', ALL_PERMISSIONS),
        (Allow, 'group:superUser', ('create', 'read', 'update')),
        (Allow, 'group:user', ('create', 'read', 'update'))
    ],
    'sensors': [
        (Allow, 'group:admin', ('create', 'read', 'update')),
        (Allow, 'group:superUser', ('create', 'read', 'update')),
        (Allow, 'group:user', 'read')
    ],
    'sensors_history': [
        (Allow, 'group:admin', ('read', 'update', 'delete')),
        (Allow, 'group:superUser', ('read', 'update', 'delete')),
        (Allow, 'group:user', 'read')
    ],
    'SensorDatasByType': [
        (Allow, 'group:admin', ALL_PERMISSIONS),
        (Allow, 'group:superUser', ALL_PERMISSIONS),
        (Allow, 'group:user', ('GPX', 'RFID', 'CAMTRAP')),
        (Deny, 'group:user', ('GSM', 'ARGOS'))
    ],
    'release': [
        (Allow, 'group:admin', ALL_PERMISSIONS),
        (Allow, 'group:superUser', ALL_PERMISSIONS),
        (Deny, 'group:user', ALL_PERMISSIONS),
    ],
    'regions': [
        (Allow, 'group:admin', ALL_PERMISSIONS),
        (Allow, 'group:superUser', ('create', 'read', 'update')),
        (Allow, 'group:user', ('read'))
    ],
    'import': [
        (Allow, 'group:admin', ALL_PERMISSIONS),
        (Allow, 'group:superUser', ('create', 'read', 'update')),
        (Allow, 'group:user', ('create', 'read', 'update'))
    ],
    'stations': [
        (Allow, 'group:admin', ALL_PERMISSIONS),
        (Allow, 'group:superUser', ('create', 'read', 'update')),
        (Allow, 'group:user', ('create', 'read', 'update'))
    ],
    'observations': [
        (Allow, 'group:admin', ALL_PERMISSIONS),
        (Allow, 'group:superUser', ALL_PERMISSIONS),
        (Allow, 'group:user', ALL_PERMISSIONS)
    ],
    'mediasfiles': [
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
        'DELETE': 'noONe'
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
    }
}
