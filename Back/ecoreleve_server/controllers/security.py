"""
Created on Mon Aug 25 13:00:16 2014
@author: Natural Solutions (Thomas)
"""

from ..Models import DBSession , User, userOAuthDict
import transaction 
from pyramid.httpexceptions import HTTPUnauthorized

from pyramid.security import (
    ALL_PERMISSIONS,
    DENY_ALL,
    Allow,
    Authenticated,
)

# Root class security #
class SecurityRoot(object):
    __acl__ = [
        (Allow, Authenticated, 'read'),
        (Allow, 'groups:admins', 'edit'),
        (Allow, 'groups:editors', 'view'),
        DENY_ALL
    ]
    
    def __init__(self, request):
        # print(role_loader(request.authenticated_userid['iss'], request))
        self.request = request
        # self.request.response = HTTPUnauthorized()

# Useful fucntions #
def role_loader(user_id, request):
    print('passsss')
    return 4

