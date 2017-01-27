from ..utils.stargate import WebSocketView
import eventlet
from pyramid.view import view_config
from pyramid.security import NO_PERMISSION_REQUIRED
from ..controllers.WebSocket import FileImportJob


def coroutine(func):
    def starter(*args, **kwargs):
        gen = func(*args, **kwargs)
        next(gen)
        return gen
    return starter

@coroutine
def printer(prefix=''):
    while True:
        data = yield
        print('{}{}'.format(prefix, data))


@view_config(context=FileImportJob, permission=NO_PERMISSION_REQUIRED)
class JobView(WebSocketView):
    """The view connects pyramid with the resource

    In this simple example it simply adds the websocket to the Job's listeners.
    It then goes to sleep *blocking the thread it's in* this is where eventlet
    comes in. In real life you'd do things like listening for updates and
    handling messages coming in on the websocket in the while block.
    """

    @coroutine
    def run(self):
        yield
        for process in self.processList:
        # while True:
            print('je fais tourné mon process : '+str(process))
            yield process+' a bien tourné'
            eventlet.sleep(1)

    def handler(self, websocket):
        print('in handler WS')
        print(websocket)
        self.processList = ['toto', 'tata' , 'tutu']
        job = self.request.context
        job.add_listener(websocket)
        runner = self.run()
        for result in runner:
            job.send(result)


@view_config(context=FileImportJob, renderer="json", xhr=True, permission=NO_PERMISSION_REQUIRED)
def control(job, request):
    """Post to this view to set the state

    this will trigger Job to report the state to connected clients
    """
    state = request.POST.get("state")
    if state:
        job.control(state)
    return dict(id=job.__name__, state=job.state)
