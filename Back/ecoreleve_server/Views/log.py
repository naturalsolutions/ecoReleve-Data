from ..Models.Log import sendLog
from pyramid.view import view_config
import json



# ------------------------------------------------------------------------------------------------------------------------- #
@view_config(route_name='jsLog', renderer='json' ,request_method='POST')
def jsLogError(request):
	data = request.params.mixed()
	print(data)
	sendLog(logLevel=5,domaine=5,scope = 'JS',errorDict=json.dumps(data),logMsg =data['errorMsg'])
	return 