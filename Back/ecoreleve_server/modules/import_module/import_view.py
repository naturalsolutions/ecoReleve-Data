from pyramid.view import view_config

from ..permissions import routes_permission
from .importArgos import uploadFileArgos
from .importGSM import uploadFilesGSM
from .importRFID import uploadFileRFID
from .importGPX import uploadFileGPX

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
