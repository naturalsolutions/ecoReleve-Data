# import eventlet
# from eventlet import wsgi

# from pyramid.config import Configurator
# from pyramid.response import Response
# from pyramid.view import view_config
# from stargate import WebSocketAwareResource, WebSocketView, is_websocket
# import simplejson as json


# class JobRoot(object):
#     """A container for jobs

#     Gets or creates Job objects for certain ids
#     """

#     def __init__(self):
#         self._jobs = {}

#     def __getitem__(self, item):
#         try:
#             return self._jobs[item]
#         except KeyError:
#             return self.create_job(item)

#     def create_job(self, id):
#         job = Job(id, self)
#         self._jobs[id] = job
#         return job


# class Job(WebSocketAwareResource):
#     """This is a permanent object.

#     It's responsible for maintaning a list of connected clients (websockets)
#     and updating them when its state changes
#     """

#     def __init__(self, id, parent):
#         self.__name__ = id
#         self.__parent__ = parent
#         self.state = "OFF"

#     def control(self, state):
#         """This function updates the state

#         Its called by the control function (in response to a post)
#         It triggers the sending of self.state to all connected clients. If you
#         connect multiple browsers (or tabs) they will all be updated
#         """
#         self.state = state
#         self.send(state)


# class Root(dict):
#     """The root of url traversal"""

#     def __init__(self):
#         super(Root, self).__init__(jobs=JobRoot())
