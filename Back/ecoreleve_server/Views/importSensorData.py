from pyramid.view import view_config
from .argosImport import uploadFileArgos
from .GSMimport import uploadFilesGSM
from .RFIDimport import uploadFileRFID
from ..controllers.security import routes_permission


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
def uploadFile(request):
    type_ = request.matchdict['type']
    dictFuncImport = {
        'argos': uploadFileArgos,
        'gsm': uploadFilesGSM,
        'rfid': uploadFileRFID
    }
    return dictFuncImport[type_](request)
