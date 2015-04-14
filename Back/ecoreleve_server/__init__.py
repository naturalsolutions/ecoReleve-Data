from datetime import datetime
from decimal import Decimal
from urllib.parse import quote_plus
from pyramid.config import Configurator
from sqlalchemy import engine_from_config
from pyramid.request import Request, Response
from pyramid.renderers import JSON
from pyramid.authentication import AuthTktAuthenticationPolicy
from pyramid.authorization import ACLAuthorizationPolicy
import transaction

from .Models import (
    DBSession,
    Base,
    dbConfig,
    ObservationDynProp,
    ProtocoleType,
    ProtocoleType_ObservationDynProp,
    ObservationDynPropValue,
    Observation
    )


def main(global_config, **settings):
    """ This function returns a Pyramid WSGI application.
    """
    settings['sqlalchemy.url'] = settings['cn.dialect'] + quote_plus(settings['sqlalchemy.url'])
    engine = engine_from_config(settings, 'sqlalchemy.')
    # dbConfig['data_schema'] = settings['data_schema']
    # dbConfig['sensor_schema'] = settings['sensor_schema']
    dbConfig['url'] = settings['sqlalchemy.url']
    DBSession.configure(bind=engine)
    Base.metadata.bind = engine
    Base.metadata.create_all(engine)
    Base.metadata.reflect(views=True, extend_existing=False)
    curObs = DBSession.query(Observation).one()
    #curObs.__init__()
    # curObs.LoadNowValues()
    #DBSession.add(curObs)
    bezin = {
        'Name':'Name from JSON',
        'Bezin': ' Bzein from JSON',
        'Numerci' : 51
    }
    curObs.UpdateFromJson(bezin)
    print(curObs.GetDTOWithSchema())
    print ('Valeur à modifier')
    curObs.SetProperty('Bezin','Valeur modifié après JSON')
    print('Valeur à ne pas modifier ')
    curObs.SetProperty('Bezin','Valeur modifié après JSON')
    transaction.commit()
    config = Configurator(settings=settings)
    config.include('pyramid_tm')
    config.add_route('home', '/')
    config.scan()
    return config.make_wsgi_app()
