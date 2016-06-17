from pyramid.security import NO_PERMISSION_REQUIRED
from pyramid.view import view_config
from sqlalchemy import select
from ..Models import DBSession, User, userOAuthDict, USERS

# ------------------------------------------------------------------------------------------------------------------------- #
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

# ------------------------------------------------------------------------------------------------------------------------- #
@view_config(
    route_name='core/currentUser',
    renderer='json'
)
def current_user(request):
    """Return the list of all the users with their ids.
    """
    session = request.dbsession

    currentUserRoleID = userOAuthDict.loc[userOAuthDict['user_id'] == int(request.authenticated_userid['iss']),'role_id'].values[0]
    currentUserRole = USERS[currentUserRoleID]

    query = select([
        User.id.label('PK_id'),
        User.Login.label('fullname')
    ]).where(User.id == request.authenticated_userid['iss'])
    response = dict(session.execute(query).fetchone())
    response['role'] = currentUserRole
    return response


@view_config(
    route_name='users/id',
    renderer='json'
)
def getUser(request) :
    session = request.dbsession
    user_id = request.matchdict['id']

    currentUserRoleID = userOAuthDict.loc[userOAuthDict['user_id'] == int(userid),'role_id'].values[0]
    currentUserRole = USERS[currentUserRoleID]

    query = select([User]).where(User.id == user_id)
    response = dict(session.execute(query).fetchone())
    response['role'] = currentUserRole

    return response
