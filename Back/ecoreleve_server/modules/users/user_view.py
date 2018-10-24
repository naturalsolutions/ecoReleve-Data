import json
from sqlalchemy import select
from pyramid.security import NO_PERMISSION_REQUIRED, remember
from pyramid.view import view_config
from pyramid.response import Response
from pyramid.interfaces import IAuthenticationPolicy

from .user_model import User
from ecoreleve_server.core.security import groupfinder


@view_config(
    route_name='core/user',
    permission=NO_PERMISSION_REQUIRED,
    renderer='json'
)
def users(request):
    """Return the list of all the users with their ids.
    """
    session = request.dbsession
    query = select([
        User.id.label('PK_id'),
        User.Login.label('fullname')
    ]).order_by(User.Lastname, User.Firstname)
    return [dict(row) for row in session.execute(query).fetchall()]


@view_config(
    route_name='core/currentUser',
    renderer='json'
)
def current_user(request, user_id=None):
    """Return the list of all the users with their ids.
    """
    session = request.dbsession

    if user_id is not None:
        userid = user_id
    else:
        userid = int(request.authenticated_userid['iss'])
    currentUserRole = groupfinder(userid, request)

    query = select([
        User.id.label('PK_id'),
        User.Login.label('fullname'),
        User.Firstname.label('Firstname'),
        User.Language.label('Language'),
        User.Lastname.label('Lastname')
    ]).where(User.id == userid)
    response = dict(session.execute(query).fetchone())
    response['role'] = currentUserRole[0].replace('group:', '')

    if 'app_roles' not in request.authenticated_userid:
        response = setRoleInCookie(request, response, currentUserRole)
    return response


def setRoleInCookie(request, body, role):
    user_infos = request.authenticated_userid

    claims = user_infos
    claims['app_roles'] = {'ecoreleve': role}
    jwt = make_jwt(request, claims)
    response = Response(body=json.dumps(body), content_type='text/plain')
    remember(response, jwt)
    return response

def make_jwt(request, claims):
    policy = request.registry.queryUtility(IAuthenticationPolicy)
    return policy.encode_jwt(request, claims)


@view_config(
    route_name='users/id',
    renderer='json'
)
def getUser(request):
    user_id = int(request.matchdict['id'])
    return current_user(request, user_id=user_id)
