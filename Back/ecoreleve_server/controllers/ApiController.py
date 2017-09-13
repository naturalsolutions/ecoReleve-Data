from pyramid.view import view_config
from pyramid.security import (
    Allow,
    Authenticated,
    ALL_PERMISSIONS,
    Everyone,
    Deny
)
# ###
# TODO: create ApiController
# ###

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
         (Allow, 'group:superUsers', 'all')
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


class RESTView(object):
    def __init__(self, context, request):
        self.request = request
        self.context = context

    @view_config(request_method='GET', renderer='json', permission='read')
    def get(self):
        return self.context.retrieve()

    @view_config(request_method='POST', renderer='json', permission='create')
    def post(self):
        return self.context.create()

    @view_config(request_method='DELETE', renderer='json', permission='delete')
    def delete(self):
        return self.context.delete()

    @view_config(request_method='PATCH', renderer='json', permission='update')
    def patch(self):
        return self.context.update()

    @view_config(request_method='PUT', renderer='json', permission='update')
    def put(self):
        return self.context.update()
