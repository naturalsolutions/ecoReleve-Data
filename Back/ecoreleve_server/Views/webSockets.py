from ..utils.stargate import WebSocketView
import eventlet
from pyramid.view import view_config
from pyramid.security import NO_PERMISSION_REQUIRED
from ..controllers.WebSocket import FileImportJob


@view_config(context=FileImportJob, permission=NO_PERMISSION_REQUIRED)
class JobView(WebSocketView):
    """The view connects pyramid with the resource

    In this simple example it simply adds the websocket to the Job's listeners.
    It then goes to sleep *blocking the thread it's in* this is where eventlet
    comes in. In real life you'd do things like listening for updates and
    handling messages coming in on the websocket in the while block.
    """
    # def __init__(self, **kwarg):
    #     print('init JobView')

    def handler(self, websocket):
        print('in handler WS')
        job = self.request.context
        print(job.__name__)
        job.add_listener(websocket)
        while True:
            job.send('toto')
            print('send TO' + str(job.__name__))
            
            eventlet.sleep(5)
