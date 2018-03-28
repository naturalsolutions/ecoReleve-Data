# from pyramid.security import (
#     Allow,
#     Authenticated,
#     ALL_PERMISSIONS,
#     Everyone,
#     Deny
# )

# class SecurityRoot(Resource):
#     __acl__ = [
#         (Allow, Authenticated, 'read'),
#         (Allow, Authenticated, 'all'),
#         (Allow, 'group:admin', 'admin'),
#         (Allow, 'group:admin', 'superUser'),
#         (Allow, 'group:admin', 'all'),
#         (Allow, 'group:superUser', 'superUser'),
#         (Allow, 'group:superUser', 'all')
#     ] # depricated ?? 

#     def __init__(self, request):
#         super().__init__(self, ref='', parent=None)
#         self.request = request

#     def __getitem__(self, item):
#         if item == 'ecoReleve-Core':
#             return RootCore(item, self)


# class RootCore(SecurityRoot):

#     listChildren = []

#     def __init__(self, ref, parent):
#         Resource.__init__(self, ref, parent)
#         self.add_children()

#     def add_children(self):
#         for ref, klass in self.listChildren:
#             self.add_child(ref, klass)

#     def __getitem__(self, item):
#         return self.get(item)

#     def retrieve(self):
#         return {'next items': self}