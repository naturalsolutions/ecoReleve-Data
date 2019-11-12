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


class TraversalRessource(MetaRootRessource):
    __acl__ = []

    def __getitem__(self, name):
        if name == 'formbuilder':
            return FormBuilderRessource(name=name, parent=self, request=self.__request__)
        if name == 'import':
            return ImportRessource(name=name, parent=self, request=self.__request__)
        if name == 'stations':
            return StationsCollection(name=name, parent=self, request=self.__request__)
        else:
            raise KeyError

class StationsCollection(MetaCollectionRessource):
    pass

class StationsItem(MetaItemRessource):
    pass

class ImportRessource(MetaEmptyNodeRessource):
    __acl__ = []
    
    def __getitem__(self, name):
        if name == 'gsm':
            return GSMImport(name=name, parent=self, request=self.__request__)
        elif name == 'argos':
            return ARGOSImport(name=name, parent=self, request=self.__request__)
        else:
            raise KeyError  

class FormBuilderRessource(MetaEmptyNodeRessource):
    __acl__ = []

    def __getitem__(self, name):
        if name == 'FieldActivity':
            return FieldActivityCollection(name=name, parent=self, request=self.__request__)
        elif name == 'FieldActivity_ProtocoleType':
            return FieldActivityProtocoleTypeCollection(name=name, parent=self, request=self.__request__)
        elif name == 'ProtocoleType':
            return ProtocoleTypeCollection(name=name, parent=self, request=self.__request__)
        else:
            raise KeyError
