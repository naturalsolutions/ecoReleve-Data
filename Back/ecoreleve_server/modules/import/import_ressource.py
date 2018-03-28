import json
from pyramid import threadlocal
from pyramid.view import view_config

from ecoreleve_server.core import RootCore
from ecoreleve_server.core.base_resource import DynamicObjectCollectionResource
from .import_model import Import
from .import_collection import ImportCollection
from ..permissions import context_permissions


class ImportView(object):

    model = Import


class ImportHistoryView(DynamicObjectCollectionResource):
    Collection = ImportCollection
    item = ImportView
    moduleGridName = 'ImportHistoryFilter'

    __acl__ = context_permissions['import']

    def __init__(self, ref, parent):
        CustomView.__init__(self, ref, parent)
        self.objectDB = self.item.model()
        self.objectDB.session = threadlocal.get_current_request().dbsession
        # self.__acl__ = context_permissions['stations']
        # self.__actions__ = {'forms': self.getForm,
        #             'getFields': self.getGrid,
        #             'getFilters': self.getFilter,
        #             'getType': self.getType,
        #             'export': self.export,
        #             'count': self.count_,
        #             }
        self.typeObj = None

    def insert(self):
        pass
    
    def retrieve(self):
        return self.getHistory()

    def getHistory(self):
        gene = self.Collection(self.session)
        data = self.request.params.mixed()
        if 'criteria' in data:
            criteria = json.loads(data['criteria'])
        else:
            criteria = {}

        if 'per_page' in data:
            offset = json.loads(data['offset'])
            per_page = json.loads(data['per_page'])
        else:
            offset = None
            per_page = None

        order_by = json.loads(data['order_by'], [])
        result = gene.search(criteria,
                                offset=offset,
                                per_page=per_page,
                                order_by=order_by)
        return result


RootCore.children.append(('importHistory', ImportHistoryView))
