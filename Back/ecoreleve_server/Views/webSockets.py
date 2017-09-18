from ..utils.stargate import WebSocketView
import eventlet
from pyramid.view import view_config
from pyramid.security import NO_PERMISSION_REQUIRED
from ..controllers.WebSocket import FileImportJob
from ..Models.File_Import import File
from pyramid import threadlocal
import json


@view_config(context=FileImportJob, permission=NO_PERMISSION_REQUIRED)
class JobView(WebSocketView):
    """The view connects pyramid with the resource

    In this simple example it simply adds the websocket to the Job's listeners.
    It then goes to sleep *blocking the thread it's in* this is where eventlet
    comes in. In real life you'd do things like listening for updates and
    handling messages coming in on the websocket in the while block.
    """

    def handler(self, websocket):
        session = threadlocal.get_current_registry().dbmaker()
        job = self.request.context
        job.add_listener(websocket)
        curFile = session.query(File).get(job.__name__)
        runner = curFile.main_process()
        for result in runner:
            process, msg = result
            job.send(msg)
            # if process.Blocking and json.loads(msg)['error'] == "1":
            #     break

