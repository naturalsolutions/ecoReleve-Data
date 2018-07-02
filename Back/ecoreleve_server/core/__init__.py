from pyramid.security import (
    Allow,
    Authenticated,
    ALL_PERMISSIONS,
    Everyone,
    Deny
)

from .init_db import Base, BaseExport, dbConfig, get_redis_con
from .base_model import *
from .base_view import *
from .base_resource import *
from .configuration_model import *


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
        else:
            raise KeyError


class RootCore(Resource):

    children = []

    def retrieve(self):
        return {'next items': self}