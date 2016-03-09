from pyramid.security import NO_PERMISSION_REQUIRED
from pyramid.view import view_config
from sqlalchemy import select
from ..Models import DBSession, User

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

    query = select([
        User.id.label('PK_id'),
        User.Login.label('fullname')
    ]).where(User.id == request.authenticated_userid['iss'])
    return dict(session.execute(query).fetchone())

@view_config(
    route_name='users/id',
    renderer='json'
)
def getUser(request) :
    session = request.dbsession
    user_id = request.matchdict['id']
    query = select([User]).where(User.id == user_id)
    return dict(session.execute(query).fetchone())
