from ecoreleve_server.traversal.core import (
    MetaRootRessource,
    MetaCollectionRessource,
    MetaItemRessource,
    MetaEmptyNodeRessource
)
from ecoreleve_server.traversal.formbuilder import (
    FieldActivityCollection,
    FieldActivityProtocoleTypeCollection,
    ProtocoleTypeCollection
)
from ecoreleve_server.traversal.importdatas import (
    GSMImport,
    ARGOSImport
)

from ecoreleve_server.traversal.validate import (
    Validate
)


class TraversalRessource(MetaRootRessource):
    __acl__ = []

    def __getitem__(self, name):
        routes = {
            'formbuilder': FormBuilderRessource,
            'import': ImportRessource,
            'stations': StationsCollection,
            'validate': Validate
        }

        toRet = None
        toRet = routes.get(name.lower(), None)

        if toRet is None:
            raise KeyError
        else:
            return toRet(name=name, parent=self, request=self.request)


        # if name == 'formbuilder':
        #     return FormBuilderRessource(name=name, parent=self, request=self.request)
        # if name == 'import':
        #     return ImportRessource(name=name, parent=self, request=self.request)
        # if name == 'stations':
        #     return StationsCollection(name=name, parent=self, request=self.request)
        # if name == 'validate':
        #     return Validate(name=name, parent=self, request=self.request)
        # else:
        #     raise KeyError

class StationsCollection(MetaCollectionRessource):
    pass

class StationsItem(MetaItemRessource):
    pass

class ImportRessource(MetaEmptyNodeRessource):
    __acl__ = []

    def __getitem__(self, name):
        if name == 'gsm':
            return GSMImport(name=name, parent=self, request=self.request)
        elif name == 'argos':
            return ARGOSImport(name=name, parent=self, request=self.request)
        else:
            raise KeyError

class FormBuilderRessource(MetaEmptyNodeRessource):
    __acl__ = []

    def __getitem__(self, name):
        if name == 'FieldActivity':
            return FieldActivityCollection(name=name, parent=self, request=self.request)
        elif name == 'FieldActivity_ProtocoleType':
            return FieldActivityProtocoleTypeCollection(name=name, parent=self, request=self.request)
        elif name == 'ProtocoleType':
            return ProtocoleTypeCollection(name=name, parent=self, request=self.request)
        else:
            raise KeyError
