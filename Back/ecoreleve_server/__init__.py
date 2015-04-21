from datetime import datetime
from decimal import Decimal
import transaction
from urllib.parse import quote_plus

from sqlalchemy import engine_from_config

from pyramid.config import Configurator
from pyramid.request import Request, Response
from pyramid.renderers import JSON
from pyramid.authentication import AuthTktAuthenticationPolicy
from pyramid.authorization import ACLAuthorizationPolicy

from ecoreleve_server.controllers.security import SecurityRoot, role_loader
from ecoreleve_server.renderers.csvrenderer import CSVRenderer
from ecoreleve_server.renderers.pdfrenderer import PDFrenderer
from ecoreleve_server.renderers.gpxrenderer import GPXRenderer
from ecoreleve_server.Models import (
    DBSession,
    Base,
    dbConfig,
    ObservationDynProp,
    ProtocoleType,
    ProtocoleType_ObservationDynProp,
    ObservationDynPropValue,
    Observation
    )


def datetime_adapter(obj, request):
    """Json adapter for datetime objects.
    """
    return str(obj)
    
def decimal_adapter(obj, request):
    """Json adapter for Decimal objects.
    """
    return float(obj)

def main(global_config, **settings):
    """ This function returns a Pyramid WSGI application.
    """
    settings['sqlalchemy.url'] = settings['cn.dialect'] + quote_plus(settings['sqlalchemy.url'])
    engine = engine_from_config(settings, 'sqlalchemy.')
    dbConfig['url'] = settings['sqlalchemy.url']
    DBSession.configure(bind=engine)
    Base.metadata.bind = engine
    Base.metadata.create_all(engine)
    Base.metadata.reflect(views=True, extend_existing=False)

    # curObs = DBSession.query(Observation).first()
    # # #curObs.__init__()
    # # #DBSession.add(curObs)
    # bezin = {
        
    #     'Toto': ' Bzein from JSON',
    #     'Tutu' : 51
    # }
    # curObs.UpdateFromJson(bezin)
    # print(curObs.GetDTOWithSchema())
    # print ('Valeur à modifier')
    # curObs.SetProperty('Bezin','Valeur modifié après JSON')
    # print('Valeur à ne pas modifier ')
    # curObs.SetProperty('Toto','Bzein from JSON')
    # transaction.commit()
    # request = testing.DummyRequest(
    #         matchdict={
    #         'ID': 91
    #         },
    #         json_body = {
    #         'Toto': 'MaValeurTOTO',
    #         'Tutu': '18'
    #         })
    # setObservation(request)
    config = Configurator(settings=settings)
    # Add renderer for datetime objects
    json_renderer = JSON()
    json_renderer.add_adapter(datetime, datetime_adapter)
    json_renderer.add_adapter(Decimal, decimal_adapter)
    config.add_renderer('json', json_renderer)

    # Add renderer for CSV files.
    config.add_renderer('csv', CSVRenderer)
    config.add_renderer('pdf', PDFrenderer)
    config.add_renderer('gpx', GPXRenderer)

    # Set up authentication and authorization

    authn_policy = AuthTktAuthenticationPolicy(
            settings['auth.secret'],
            cookie_name='ecoReleve-Core',
            callback=role_loader,
            hashalg='sha512',
            max_age=86400)
    authz_policy = ACLAuthorizationPolicy()

    # config.set_authentication_policy(authn_policy)
    # config.set_authorization_policy(authz_policy)
    # config.set_root_factory(SecurityRoot)

    # Set the default permission level to 'read'
    config.set_default_permission('read')
    config.include('pyramid_tm')
    add_routes(config)
    config.scan()
    return config.make_wsgi_app()
