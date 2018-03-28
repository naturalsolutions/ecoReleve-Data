# from permissions import context_permissions, routes_permission
from pyramid.authorization import ACLAuthorizationPolicy
from sqlalchemy import select

from .jwt_security import myJWTAuthenticationPolicy
from .. import Base


USERS = {2: 'superUser',
         3: 'user',
         1: 'admin'}

GROUPS = {'superUser': ['group:superUser'],
          'user': ['group:user'],
          'admin': ['group:admin']}


def groupfinder(userid, request):
    session = request.dbsession
    Tuser_role = Base.metadata.tables['VUser_Role']
    query_check_role = select([Tuser_role.c['role']]).where(
        Tuser_role.c['userID'] == int(userid))
    currentUserRoleID = session.execute(query_check_role).scalar()

    if currentUserRoleID in USERS:
        currentUserRole = USERS[currentUserRoleID]
        return GROUPS.get(currentUserRole, [])


def include_jwt_policy(config):
    authz_policy = ACLAuthorizationPolicy()
    config.set_authorization_policy(authz_policy)

    settings = config.get_settings()
    authn_policy = myJWTAuthenticationPolicy.from_settings(settings)
    authn_policy.find_groups = groupfinder
    config.set_authentication_policy(authn_policy)
    config.set_default_permission('read')
    config.add_forbidden_view(authn_policy.challenge)