

from pyramid.security import NO_PERMISSION_REQUIRED
from pyramid.view import view_config
from sqlalchemy import select
from ecoreleve_server.Models import DBSession, User

@view_config(
    route_name='core/user',
    permission=NO_PERMISSION_REQUIRED,
    renderer='json'
)
def users(request):
    """Return the list of all the users with their ids.
    """
    query = select([
        User.id,
        User.Login
    ]).order_by(User.Lastname, User.Firstname)
    return [dict(row) for row in DBSession.execute(query).fetchall()]
    
@view_config(
    route_name='core/currentUser',
    renderer='json'
)
def current_user(request):
    """Return the list of all the users with their ids.
    """
    query = select([
        User.id,
        User.Login
    ]).where(User.id == request.authenticated_userid)
    return dict(DBSession.execute(query).fetchone())