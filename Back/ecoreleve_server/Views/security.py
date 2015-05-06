from pyramid.httpexceptions import HTTPUnauthorized
from pyramid.security import remember, forget, NO_PERMISSION_REQUIRED
from pyramid.view import view_config
from ecoreleve_server.Models import DBSession, User
import transaction

route_prefix = 'security/'

@view_config(
    route_name=route_prefix+'login',
    permission=NO_PERMISSION_REQUIRED,
    request_method='POST')
def login(request):
    user_id = request.POST.get('user_id', '')
    print ('_________________________\n')
    print (user_id)
    pwd = request.POST.get('password', '')
    user = DBSession.query(User).filter(User.id==user_id).one()

    if user is not None and user.check_password(pwd):
        headers = remember(request, user_id)
        response = request.response
        response.headerlist.extend(headers)
        transaction.commit()
        return response
    else:
        transaction.commit()
        return HTTPUnauthorized()
        
@view_config(
    route_name=route_prefix+'logout', 
    permission=NO_PERMISSION_REQUIRED,)
def logout(request):
    headers = forget(request)
    request.response.headerlist.extend(headers)
    return request.response
    
@view_config(route_name=route_prefix+'has_access')
def has_access(request):
    transaction.commit()
    return request.response

