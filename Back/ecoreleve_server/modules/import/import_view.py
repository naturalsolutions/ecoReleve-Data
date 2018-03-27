from pyramid.view import view_config
from .importArgos import uploadFileArgos
from .importGSM import uploadFilesGSM
from .importRFID import uploadFileRFID
from .importGPX import uploadFileGPX
from ..controllers.security import routes_permission, RootCore, context_permissions
from . import DynamicObjectCollectionView, CustomView
from ..Models import Import, ImportList
from pyramid import threadlocal
import json


route_prefix = 'sensors/'


@view_config(route_name=route_prefix + 'datas',
             renderer='json',
             request_method='POST',
             match_param='type=rfid',
             permission=routes_permission['rfid']['POST'])
@view_config(route_name=route_prefix + 'datas',
             renderer='json',
             request_method='POST',
             match_param='type=gsm',
             permission=routes_permission['gsm']['POST'])
@view_config(route_name=route_prefix + 'datas',
             renderer='json',
             request_method='POST',
             match_param='type=argos',
             permission=routes_permission['argos']['POST'])
@view_config(route_name=route_prefix + 'datas',
             renderer='json',
             request_method='POST',
             match_param='type=gpx',
             permission=routes_permission['stations']['POST'])
def uploadFile(request):
    type_ = request.matchdict['type']
    dictFuncImport = {
        'argos': uploadFileArgos,
        'gsm': uploadFilesGSM,
        'rfid': uploadFileRFID,
        'gpx': uploadFileGPX
    }
    return dictFuncImport[type_](request)


class ImportView(object):

    model = Import


class ImportHistoryView(DynamicObjectCollectionView):
    Collection = ImportList
    item = ImportView
    moduleGridName = 'ImportHistoryFilter'

    def __init__(self, ref, parent):
        CustomView.__init__(self, ref, parent)
        self.objectDB = self.item.model()
        self.objectDB.session = threadlocal.get_current_request().dbsession
        self.__acl__ = context_permissions['stations']
        self.__actions__ = {'forms': self.getForm,
                    'getFields': self.getGrid,
                    'getFilters': self.getFilter,
                    'getType': self.getType,
                    'export': self.export,
                    'count': self.count_,
                    }
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


RootCore.listChildren.append(('importHistory', ImportHistoryView))
