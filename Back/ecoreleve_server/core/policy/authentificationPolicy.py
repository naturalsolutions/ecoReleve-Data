import hashlib
# from jwcrypto import jwt as jwtcrypto, jwk as jwkcrypto
# from jwcrypto.common import base64url_encode,base64url_decode
import jwt
from zope.interface import implementer
from pyramid.interfaces import IAuthenticationPolicy
from pyramid.authentication import CallbackAuthenticationPolicy
from pyramid.security import Everyone,Authenticated
import json


"""
Process:
@@login
(login,password) == generate => jwt cookie with payload contain app name and your role

"""

@implementer(IAuthenticationPolicy)
class MyAuthenticationPolicy(CallbackAuthenticationPolicy):

    """
    A custom authentification policy 
    This object will be create once

    Constructor Arguments

    ``header``
    
        A dict or a JSON string with the JWT Header data.

    """

    def __init__(self, header=None, secretkey=None, cookie_name=None, TIns_Label=None):

        self.header             = header
        self.cookie_name        = cookie_name
        #   Welcome to the real world neo :D
        #   from    *.ini  key = ecorelevé
        #   parsed         key = ecoRelevÃ©
        #   encoded to latin1 and decoded in utf-8 you get back key = ecorelevé lol ? so fun...
        self.TIns_Label         = TIns_Label.encode('latin1').decode('utf-8') 

        #self.hashedsecretkey    = self.generateHashedSecretKey(secretkey=secretkey)    
        self.key                = secretkey
        self.callback           = self.getClaims

    def getClaims (self, allClaims, request):   

        ## return all payload could be usefull for app
        # 
        return allClaims 
        # claims = None

        # if 'roles' in allClaims:
        #     claims = allClaims['roles'].get(self.TIns_Label)   
        # return claims



    def effective_principals(self, request):
        principals = [Everyone]
        verifedClaims = self.authenticated_userid(request)
        if verifedClaims:
            #map new with old :(
            GROUPS = {
                'Super Utilisateur'     : 'group:superUser',
                'Utilisateur'           : 'group:user',
                'Administrateur'        : 'group:admin'
            }

            if 'roles' in verifedClaims:
                cookieRole = verifedClaims['roles'].get(self.TIns_Label,None)
                if cookieRole:
                    principals += [Authenticated,GROUPS.get(cookieRole,None)]

        return principals


    def authenticated_userid(self, request):
        ''' this function will check if datas (sub and role ) in cookie's payload in request
            match datas in database when you do the request

            for later or specific case
        '''

        verifedClaims = None
        userCookieClaims = self.unauthenticated_userid(request)
        if userCookieClaims is not None:
            effectiveClaimsOnRequestTime = self.getClaims(userCookieClaims, request)
            if effectiveClaimsOnRequestTime is None:
                return verifedClaims
            # DUMB TEST (we trust cookie payload )!!!! that's not really "verfiedClaims" 
            # if you really want to "verify"" claims role in cookie match TRUE roles in database when request is invoked
            # you should make a request to database and implement your own check :) dunno if it's really possible with import scaffold for now and sqlachemy dbsession 
            if userCookieClaims.get('roles').get(self.TIns_Label) == effectiveClaimsOnRequestTime.get('roles').get(self.TIns_Label):
                verifedClaims = effectiveClaimsOnRequestTime
              
        return verifedClaims

    def unauthenticated_userid(self, request):
        userCookieClaims = None
        cookie = request.headers.get('Authorization', None)
        if cookie:
            userCookieClaims = self.extractClaimsFromCookie(cookie)

        return userCookieClaims

    def extractClaimsFromCookie(self, tokenValue):
        claims = None
        tokenValue = tokenValue.replace('Bearer ', '')
        claims = self.myDecode(tokenValue, self.key)
        #claims = json.loads(token.claims)
        return claims

    def myDecode(self, token, secret):
        payloadValided = False
        try:
            payloadValided = jwt.decode(
                token,
                secret,
                algorithms=['HS512'],
                verify=False
                )
        except jwt.ExpiredSignatureError:
            raise jwt.ExpiredSignatureError(
                f'You take too much time for getting your token.',
                f'You need to login again'
                )
        except jwt.InvalidTokenError:
            raise jwt.InvalidTokenError(
                f'Exception when decode()'
                )
        except jwt.DecodeError:
            raise jwt.DecodeError(
                f'We canno\'t decode your token'
                )
        except jwt.InvalidSignatureError:
            raise jwt.InvalidSignatureError(
                f'Your token’s signature doesn’t match'
                f' the one provided as part of the token'
            )
        return payloadValided

from pyramid.authorization import ACLAuthorizationPolicy

class myAuthorizationPolicy(ACLAuthorizationPolicy):
    def authenticated_userid(self, request):
        print("authenticated_userid policy")
        return []

    def effective_principals(self, request):
        print("effective_principals policy")
        return []