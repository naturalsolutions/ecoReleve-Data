import json
from pyramid import threadlocal
from pyramid.view import view_config

from ecoreleve_server.core import RootCore
from ecoreleve_server.core.base_resource import DynamicObjectCollectionResource
from .import_model import Import
from .import_collection import ImportCollection
from ..permissions import context_permissions


class ImportResource(object):
    model = Import


class ImportHistoryResource(DynamicObjectCollectionResource):
    Collection = ImportCollection
    model = Import
    moduleGridName = 'ImportHistoryFilter'

    __acl__ = context_permissions['import']

    def insert(self):
        pass
    
    def retrieve(self):
        return self.getHistory()

    def getHistory(self):
        import_collection = self.Collection(session=self.session)
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
        result = import_collection.search(filters=criteria,
                                offset=offset,
                                limit=per_page,
                                order_by=order_by)
        countResult = import_collection._count(filters=criteria)
        
        return [{'total_entries': countResult}, result]


RootCore.children.append(('importHistory', ImportHistoryResource))
