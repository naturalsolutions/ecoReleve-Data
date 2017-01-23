# from stargate import WebSocketView
# import eventlet
from pyramid.view import view_config

# @view_config(route_name='fileImport/run',
#              renderer='json')
from socketio.namespace import BaseNamespace
from socketio import socketio_manage

class ChatNamespace(BaseNamespace):
    def on_chat(self, msg):
        self.emit('chat', msg)

def socketio_service(request):
    socketio_manage(request.environ, {'/chat': ChatNamespace},
                    request)
    return "out"
# def JobView(WebSocketView):
#     """The view connects pyramid with the resource

#     In this simple example it simply adds the websocket to the Job's listeners.
#     It then goes to sleep *blocking the thread it's in* this is where eventlet
#     comes in. In real life you'd do things like listening for updates and
#     handling messages coming in on the websocket in the while block.
#     """

#     def handler(self, websocket):
#         job = self.request.context
#         job.add_listener(websocket)
#         while True:
#             eventlet.sleep(60)


# def control(job, request):
#     """Post to this view to set the state

#     this will trigger Job to report the state to connected clients
#     """
#     state = request.POST.get("state")
#     if state:
#         job.control(state)
#     return dict(id=job.__name__, state=job.state)
