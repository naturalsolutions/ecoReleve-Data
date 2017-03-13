import eventlet
from eventlet import wsgi
from paste.httpserver import serve
from pyramid.config import Configurator
from pyramid.response import Response
from pyramid.view import view_config
from ecoreleve_server.utils.stargate import WebSocketAwareResource, WebSocketView, is_websocket
import simplejson as json

host = "127.0.0.1"
port = 9999

home_html = """\
<html>
    <head>
        <script type="text/javascript" src="http://ajax.googleapis.com/ajax/libs/jquery/1.6.4/jquery.min.js"></script>
        <script>
            $(function() {
    ws = new WebSocket("ws://%(host)s:%(port)s/jobs/1/");
    ws.onmessage = function(msg) {
        $("body").append("<p>" + msg.data + "</p>");
    };
    STARTED = false;
    $("#start-stop").click(function(evt) {
        $.post("/jobs/1/", {state: STARTED ? "stop" : "start"}, function(result) {
            STARTED = !STARTED;
            $('#start-stop span').text(STARTED ? "on" : "off");

        });
    });
});
        </script>
    </head>
    <body>
        <h1>Hi</h1>
        <button id="start-stop">Job 1 <span>off</span></button>
    </body>
</html>
""" % dict(host=host, port=port)

class JobRoot(object):
    """A container for jobs

    Gets or creates Job objects for certain ids
    """

    def __init__(self):
        self._jobs = {}

    def __getitem__(self, item):
        try:
            return self._jobs[item]
        except KeyError:
            return self.create_job(item)

    def create_job(self, id):
        job = Job(id, self)
        self._jobs[id] = job
        return job


class Job(WebSocketAwareResource):
    """This is a permanent object.

    It's responsible for maintaning a list of connected clients (websockets)
    and updating them when its state changes
    """

    def __init__(self, id, parent):
        self.__name__ = id
        self.__parent__ = parent
        self.state = "OFF"

    def control(self, state):
        """This function updates the state

        Its called by the control function (in response to a post)
        It triggers the sending of self.state to all connected clients. If you
        connect multiple browsers (or tabs) they will all be updated
        """
        self.state = state
        self.send(state)


# @view_config(route_name='job', request_method='GET')
class JobView(WebSocketView):
    """The view connects pyramid with the resource

    In this simple example it simply adds the websocket to the Job's listeners.
    It then goes to sleep *blocking the thread it's in* this is where eventlet
    comes in. In real life you'd do things like listening for updates and
    handling messages coming in on the websocket in the while block.
    """

    def handler(self, websocket):
        job = self.request.context
        job.add_listener(websocket)
        i = 5
        while i > 0:
            job.send('toto')
            eventlet.sleep(2)
            i -=1

def control(job, request):
    """Post to this view to set the state

    this will trigger Job to report the state to connected clients
    """
    print('in controll job ')
    state = request.POST.get("state")
    if state:
        job.control(state)
    return dict(id=job.__name__, state=job.state)

class Root(dict):
    """The root of url traversal"""

    def __init__(self):
        super(Root, self).__init__(jobs=JobRoot())

# class RootCustom(dict):
#     """The root of url traversal"""

#     def __init__(self, request):
#         self.request = request

# @view_config(route_name='home', context=Root)
def home(request):
    """Serves up home_html, setting up a simple js demo"""
    return Response(home_html)


# @view_config(route_name='toto', renderer='json',
#              request_method='GET')
# def toto(request):
#     """Serves up home_html, setting up a simple js demo"""
#     return 'toto'

root = Root()

def resource_factory(request):
    return RootCustom(request)

def root_factory(request):
    return root

if __name__ == '__main__':
    config = Configurator()
    config.set_root_factory(root_factory)
    config.add_view(home, context=Root)
    config.add_view(JobView, context=Job, custom_predicates=[is_websocket])

    # config.add_view(control, context=Job, renderer="json", xhr=True)
    config.scan()

    app = config.make_wsgi_app()
    listener = eventlet.listen((host, port))
    wsgi.server(listener, app)
