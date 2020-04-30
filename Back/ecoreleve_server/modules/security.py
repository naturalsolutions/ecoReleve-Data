from pyramid.security import (
    forget,
    NO_PERMISSION_REQUIRED
)
from pyramid.view import (
    view_config,
    forbidden_view_config
)
from pyramid.httpexceptions import (
    HTTPUnauthorized,
    HTTPForbidden
)
route_prefix = 'security/'


@view_config(
    route_name=route_prefix+'logout',
    permission=NO_PERMISSION_REQUIRED
)
def logout(request):
    forget(request)
    return request.response


@view_config(
    route_name=route_prefix+'has_access',
    permission=NO_PERMISSION_REQUIRED
)
def has_access(request):
    return request.response


@forbidden_view_config()
def forbidden(request):
    '''
    IF no cookie in the request
    or when effective_principals in cookie didn't match view permission
    HTTPForbidden() is raised

    forbidden_view_config is hook that invoke the method when
    HTTPForbidden() is raised (when is RAISED! not whend returned)
    '''

    # case when no cookie
    # return 401
    if getattr(request, 'authenticated_userid') is None:
        return HTTPUnauthorized('No cookie')

    # effective_principals didn't match
    # return 403
    return HTTPForbidden()
