import hashlib
from jwcrypto import jwt as jwtcrypto, jwk as jwkcrypto
from jwcrypto.common import base64url_encode,base64url_decode

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

        self.hashedsecretkey    = self.generateHashedSecretKey(secretkey=secretkey)    
        self.key                = self.generatePrivateKey(self.hashedsecretkey)

        self.callback           = self.getClaims


    def checkLoginAndGetUserId(self,login,password,request):
        userId = None

        if login == 'toto' and password == '12':
            userId = '12'
        return userId
   

    def getClaims (self, allClaims, request):   

        ## return all payload could be usefull for app
        # 
        return allClaims 
        # claims = None

        # if 'roles' in allClaims:
        #     claims = allClaims['roles'].get(self.TIns_Label)   
        # return claims

    def generateHashedSecretKey (self, secretkey = None):
        if secretkey is None:
            raise ValueError('secretkey should not be empty')
        else:
            bytesSecretKey = bytes( secretkey , encoding='utf-8' ) 
            return bytesSecretKey
            # return hashlib.sha512( bytesSecretKey ).digest() # hash the secretKey
    
    def generatePrivateKey (self,hashedsecretkey = None):
        return jwkcrypto.JWK(
                                 kty='oct', # MANDATORY KeyType  Octet sequence (used to represent symmetric keys)   https://tools.ietf.org/html/rfc7518#section-6.1
                                 size=512 , # MANDATORY key size will be automatically match with alg used in config
                                 k=base64url_encode(hashedsecretkey) # OPTIONNAL secret key hashed and encoded
                            )   


    def createToken(self, claims=None): 
        return jwtcrypto.JWT(header=self.header,
                            claims=claims,
                            )

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


    def authenticated_userid(self, request, activated=False):
        ''' this function will check if datas (sub and role ) in cookie's payload in request
            match with what we have in database when you do the request

            for later maybe of if needed you should do the request 
        '''

        verifedClaims = None
        userCookieClaims = self.unauthenticated_userid(request)
        if userCookieClaims is not None:
            effectiveClaimsOnRequestTime = self.getClaims(userCookieClaims, request)
            if effectiveClaimsOnRequestTime is None:
                return verifedClaims
            #DUMB TEST (we trust cookie payload )!!!! that's not really "verfiedClaims" if you really want to "verify"" claims role in cookie match TRUE roles in database when request is invoked
            # you should make a request to database and implement your own check :) dunno if it's really possible with import scaffold for now and sqlachemy dbsession 
            if userCookieClaims.get('roles').get(self.TIns_Label) == effectiveClaimsOnRequestTime.get('roles').get(self.TIns_Label):
                verifedClaims = effectiveClaimsOnRequestTime
              
        return verifedClaims

    def unauthenticated_userid(self, request):
        userCookieClaims = None
        cookie = request.cookies.get(self.cookie_name)
        if cookie:
            userCookieClaims = self.extractClaimsFromCookie(cookie)

        return userCookieClaims

    def extractClaimsFromCookie(self, jwt):
        claims = None
        
        token = jwtcrypto.JWT(header= {"alg" : "HS256", "typ" : "JWT" },key=self.key, jwt=jwt)
        claims = json.loads(token.claims)
        return claims

    '''
    dont use this in your app 
    '''    
    def remember(self, request, userid):

        '''
        call by login view
        given userid we gonna generate claims add in payload
        will generate cookie headers for response

        '''
        Sec = 1
        Mins = 60 * Sec
        Hours = 60 * Mins
        Days = 24 * Hours
        Weeks = 7 * Days

        maxAge = 7 * Days

        claims = self.getClaims(userid, request)

        token = self.createToken(claims=claims)
        token.make_signed_token(self.key)

        request.response.set_cookie(name=self.cookie_name,
                                    value=token.serialize(),
                                    max_age=maxAge,
                                    path='/',
                                    domain=None,
                                    secure=False,  # becareful if activated cookie will travel only on securized canal (HTTPS)
                                    httponly=True, # security manipulate cookie by javascript in client
                                    comment=None,
                                    expires=None,
                                    overwrite=False,
                                    samesite=None)

    def forget(self, request):
        '''
        Delete a cookie from the client.  Note that ``path`` and ``domain``
        must match how the cookie was originally set.

        Will sets the cookie to the empty string, and ``max_age=0`` so
        that it should expire immediately.
        '''
        request.response.delete_cookie(name=self.cookie_name, path='/', domain=None)


from pyramid.authorization import ACLAuthorizationPolicy

class myAuthorizationPolicy(ACLAuthorizationPolicy):
    def authenticated_userid(self, request):
        print("authenticated_userid policy")
        return []

    def effective_principals(self, request):
        print("effective_principals policy")
        return []