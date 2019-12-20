from pyramid.security import (
    Allow,
    Authenticated
)

from .init_db import get_redis_con
from .base_model import *
from .base_view import *
from .base_resource import *
from .configuration_model import *
# from ecoreleve_server.traversal.database.MAIN_DB.Views import individualequipment


class SecurityRoot(Resource):
    __acl__ = [
        (Allow, Authenticated, 'fixForOld'),
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