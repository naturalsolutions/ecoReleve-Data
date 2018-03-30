import json
from pyramid.authorization import ACLAuthorizationPolicy
from sqlalchemy import select

from .jwt_security import myJWTAuthenticationPolicy
from .. import Base, get_redis_con

localRedis = get_redis_con()

USERS = {2: 'superUser',
         3: 'user',
         1: 'admin'}

GROUPS = {'superUser': ['group:superUser'],
          'user': ['group:user'],
          'admin': ['group:admin']}


def groupfinder(userid, request):
    role = []
    role = get_role_from_redis(userid, request)

    if not role:
        print('role not found')
        session = request.dbsession
        Tuser_role = Base.metadata.tables['VUser_Role']
        query_check_role = select([Tuser_role.c['role']]).where(
            Tuser_role.c['userID'] == int(userid))
        currentUserRoleID = session.execute(query_check_role).scalar()

        if currentUserRoleID in USERS:
            currentUserRole = USERS[currentUserRoleID]
            role = GROUPS.get(currentUserRole, [])
            set_role_in_redis(userid, request, role)
    return role

def get_role_from_redis(userid, request):
    role = []
    if localRedis is not None:
        try:
            user_infos_redis = localRedis.get('user_'+str(userid))
            user_infos = json.loads(user_infos_redis.decode())
            if user_infos['cookie'] == request.cookies.get("ecoReleve-Core"):
                role = user_infos['role']
        except:
            from traceback import print_exc
            print_exc()

    return role

def set_role_in_redis(userid, request, role):
    if get_redis_con() is not None:
        user_infos = {
            'cookie': request.cookies.get("ecoReleve-Core"),
            'role': role
        }
        localRedis.set('user_'+str(userid), json.dumps(user_infos), ex=3600*1)


def include_jwt_policy(config):
    authz_policy = ACLAuthorizationPolicy()
    config.set_authorization_policy(authz_policy)

    settings = config.get_settings()
    authn_policy = myJWTAuthenticationPolicy.from_settings(settings)
    authn_policy.find_groups = groupfinder
    config.set_authentication_policy(authn_policy)
    config.set_default_permission('read')
    config.add_forbidden_view(authn_policy.challenge)