# from eventlet import wsgi
# from pyramid.paster import get_app, get_appsettings, setup_logging
from wsgiref.simple_server import make_server
# import eventlet
# eventlet.monkey_patch()  # raise errors but it works...


# ini_conf = 'development.ini'


# if __name__ == '__main__':
#     conf = get_appsettings(ini_conf)
#     setup_logging(ini_conf)
#     app = get_app(ini_conf, 'main')
#     server = make_server('127.0.0.1', 6545, app)
#     server.serve_forever()

#     listener = eventlet.listen(('127.0.0.1',
#                                 6545))
#     print('server listening at 127.0.0.1 port 6545')
#     try:
#         wsgi.server(listener, app, log_output=True)
#     except KeyboardInterrupt:
#         print('server will be killed')
#         pass


import aiohttp
import asyncio
from aiohttp import web
from webtest import TestApp
from pyramid.config import Configurator
from pyramid.response import Response
from pyramid.paster import get_app, get_appsettings, setup_logging


ini_conf = 'development.ini'


async def websocket_handler(request):

    ws = web.WebSocketResponse()
    await ws.prepare(request)

    while not ws.closed:
        msg = await ws.receive()

        if msg.tp == aiohttp.MsgType.text:
            if msg.data == 'close':
                await ws.close()
            else:
                hello = TestApp(request.app.pyramid).get('/')
                ws.send_str(hello.text)
        elif msg.tp == aiohttp.MsgType.close:
            print('websocket connection closed')
        elif msg.tp == aiohttp.MsgType.error:
            print('ws connection closed with exception %s' %
                  ws.exception())
        else:
            ws.send_str('Hi')

    return ws


def hello(request):
    return Response('Hello world!')

async def init(loop):
    app = web.Application(loop=loop)
    # app.router.add_route('GET', '/{name}', websocket_handler)
    # config = Configurator()
    # config.add_route('hello_world', '/')
    # config.add_view(hello, route_name='hello_world')
    # app.pyramid = config.make_wsgi_app()

    conf = get_appsettings(ini_conf)
    appPyramid = get_app(ini_conf, 'main')
    setup_logging(ini_conf)
    app.pyramid = appPyramid

    server = make_server('127.0.0.1', 6545, app.pyramid)
    server.serve_forever()
    srv = await loop.create_server(app.make_handler(),
                                   '127.0.0.1', 6545)
    print("Server started at http://127.0.0.1:6545")
    return srv

loop = asyncio.get_event_loop()
loop.run_until_complete(init(loop))
try:
    loop.run_forever()
except KeyboardInterrupt:
    pass
