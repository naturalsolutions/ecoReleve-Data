# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this file,
# You can obtain one at http://mozilla.org/MPL/2.0/.
"""

A Pyramid authentication plugin for JSON Web Tokens:

    http://self-issued.info/docs/draft-ietf-oauth-json-web-token.html

"""

from __future__ import absolute_import

__ver_major__ = 0
__ver_minor__ = 1
__ver_patch__ = 2
__ver_sub__ = ""
__ver_tuple__ = (__ver_major__, __ver_minor__, __ver_patch__, __ver_sub__)
__version__ = "%d.%d.%d%s" % __ver_tuple__

import sys
import functools

from datetime import datetime
from calendar import timegm

from zope.interface import implementer

from pyramid.interfaces import IAuthenticationPolicy
from pyramid.security import Everyone, Authenticated
from pyramid.authorization import ACLAuthorizationPolicy
from pyramid.httpexceptions import HTTPUnauthorized
from pyramid.util import DottedNameResolver

import jwt

#from .utils import parse_authz_header, normalize_request_object

@implementer(IAuthenticationPolicy)
class JWTAuthenticationPolicy(object):
    """Pyramid Authentication Policy implementing JWT Access Auth.

    This class provides an IAuthenticationPolicy implementation based on
    signed requests, using the JSON Web Token Authentication standard.

    The plugin can be customized with the following arguments:

        * find_groups:  a callable taking a userid and a Request object, and
                        returning a list of the groups that userid is a
                        member of.

        * master_secret:  a secret known only by the server, used for signing
                          JWT auth tokens in the default implementation.

        * private_key:  An RSA private_key
        * private_key_file: a file holding an RSA encoded (PEM/DER) key file.

        * public_key:  An RSA public_key
        * public_key_file: a file holding an RSA encoded (PEM/DER) key file.

        * algorithm:  The algorithm used to sign the key (defaults to HS256)

        * leeway:  The default leeway (as a datetime.timedelta). Defaults to
                   None

        * userid_in_claim: The claim that the userid can be found in.  Normally
                           this is the 'sub' claim of the JWT, but this can
                           be overridden here.  This is used in
                           authenticated_userid() and related functions.

        * scheme: The scheme name used in the ``Authorization`` header. JWT
          implementations vary in their use of ``JWT`` (our default) or
          ``Bearer``.

    The following configuration options are to DISABLE the verification options
    in the PyJWT decode function.  If the app configures this then it OUGHT to
    ensure that the claim is verified IN the application.

        * decode_options (these are passed to the __init__() = undefined OR {}
          with the following keys (these are the defaults):

            options = {
               'verify_signature': True,
               'verify_exp': True,
               'verify_nbf': True,
               'verify_iat': True,
               'verify_aud': True
            }

          i.e to switch off audience checking, pass 'verify_aud': True in
          decode_options.

          These are passed as the following as part of the ini options/settings

          jwtauth.disable_verify_signature = true (default false)
          jwtauth.disable_verify_exp = true (default false)
          jwtauth.disable_verify_nbf = true (default false)
          jwtauth.disable_verify_iat = true (default false)
          jwtauth.disable_verify_aud = true (default false)

          NOTE: they are reversed between the settings vs the __init__().

    The library takes either a master_secret or private_key/public_key pair.
    In the later case the algorithm must be an RS* version.
    """

    # The default value of master_secret is None, which will cause the library
    # to generate a fresh secret at application startup.
    master_secret = None

    def __init__(self,
                 find_groups=None,
                 master_secret=None,
                 private_key=None,
                 private_key_file=None,
                 public_key=None,
                 public_key_file=None,
                 algorithm='HS256',
                 leeway=None,
                 userid_in_claim=None,
                 scheme='JWT',
                 decode_options=None):
        if find_groups is not None:
            self.find_groups = find_groups
        if master_secret is not None:
            self.master_secret = master_secret
        self.private_key = private_key
        if private_key_file is not None:
            with open(private_key_file, 'r') as rsa_priv_file:
                self.private_key = rsa_priv_file.read()
        self.public_key = public_key
        if public_key_file is not None:
            with open(public_key_file, 'r') as rsa_pub_file:
                self.public_key = rsa_pub_file.read()
        self.algorithm = algorithm
        if leeway is not None:
            self.leeway = leeway
        else:
            self.leeway = 0
        if userid_in_claim is not None:
            self.userid_in_claim = userid_in_claim
        else:
            self.userid_in_claim = 'sub'
        self.scheme = scheme
        self.decode_options = decode_options


    @classmethod
    def from_settings(cls, settings={}, prefix="jwtauth.", **extra):
        """Construct a JWTAuthenticationPolicy from deployment settings.

        This is a helper function for loading a JWTAuthenticationPolicy from
        settings provided in the pyramid application registry.  It extracts
        settings with the given prefix, converts them to the appropriate type
        and passes them into the constructor.
        """
        # Grab out all the settings keys that start with our prefix.
        jwtauth_settings = {}
        for name in settings:
            if not name.startswith(prefix):
                continue
            jwtauth_settings[name[len(prefix):]] = settings[name]
        # Update with any additional keyword arguments.
        jwtauth_settings.update(extra)
        # Pull out the expected keyword arguments.
        kwds = cls._parse_settings(jwtauth_settings)
        # Error out if there are unknown settings.
        for unknown_setting in jwtauth_settings:
            raise ValueError("unknown jwtauth setting: %s" % unknown_setting)
        # And finally we can finally create the object.
        return cls(**kwds)

    @classmethod
    def _parse_settings(cls, settings):
        """Parse settings for an instance of this class.

        This classmethod takes a dict of string settings and parses them into
        a dict of properly-typed keyword arguments, suitable for passing to
        the default constructor of this class.

        Implementations should remove each setting from the dict as it is
        processesed, so that any unsupported settings can be detected by the
        calling code.
        """
        load_function = _load_function_from_settings
        # load_object = _load_object_from_settings
        kwds = {}
        kwds["find_groups"] = load_function("find_groups", settings)
        kwds["master_secret"] = settings.pop("master_secret", None)
        kwds["private_key"] = settings.pop("private_key", None)
        kwds["private_key_file"] = settings.pop("private_key_file", None)
        kwds["public_key"] = settings.pop("public_key", None)
        kwds["public_key_file"] = settings.pop("public_key_file", None)
        kwds["algorithm"] = settings.pop("algorithm", "HS256")
        kwds["leeway"] = settings.pop("leeway", 0)
        kwds["userid_in_claim"] = settings.pop("userid_in_claim", "sub")
        disable_options = {
            'verify_signature': settings.pop("disable_verify_signature", None),
            'verify_exp': settings.pop("disable_verify_exp", None),
            'verify_nbf': settings.pop("disable_verify_nbf", None),
            'verify_iat': settings.pop("disable_verify_iat", None),
            'verify_aud': settings.pop("disable_verify_aud", None),
        }
        kwds["decode_options"] = {
            k: not v for k, v in disable_options.items()}
        return kwds



    def get_userID(self, request):
        try :
            token = request.cookies.get("ecoReleve-Core")
            claims = self.decode_jwt(request, token)
            userid = claims['iss']
            return userid
        except: 
            self.challenge(request)


    def authenticated_userid(self, request):
        userid = self.get_userID(request)
        if userid is None:
            return None
        return userid

    def unauthenticated_userid(self, request):
        userid = self.get_userID(request)
        return userid

    def effective_principals(self, request):
        principals = [Everyone]

        userid = self.get_userID(request)
        if userid is None:
            return principals
        groups = self.find_groups(userid, request)
        if userid:
            principals += [Authenticated, 'u:%s' % userid]
        return principals

    def remember(self, response, principal, **kw):
        response.set_cookie('ecoReleve-Core', principal, max_age = 100000)

    def forget(self, request):
        request.response.delete_cookie('ecoReleve-Core')

    def challenge(self, request, content="Unauthorized"):
        """Challenge the user for credentials.

        This method returns a 401 response using the WWW-Authenticate field
        as constructed by forget().  You might like to use it as pyramid's
        "forbidden view" when using this auth policy.
        """
        return HTTPUnauthorized(content, headers=self.forget(request))

    def find_groups(self, userid, request):
        return []

    def decode_jwt(self, request, jwtauth_token,
                   leeway=None, verify=True, options=None):
        """Decode a JWTAuth token into its claims.

        This method deocdes the given JWT to provide the claims.  The JWT can
        fail if the token has expired (with appropriate leeway) or if the
        token won't validate due to the secret (key) being wrong.

        If the JWT doesn't verify then a number of Exceptions can be raised:
            DecodeError() - if the algorithm in the token isn't supported.
            DecodeError() - if the secret doesn't match (key, etc.)
            ExpiredSignature() - if the 'exp' claim has expired.

        If private_key/public key is set then the public_key will be used to
        decode the key.

        Note that the 'options' value is normally None, as this function is
        usually called via the (un)authenticated_userid() which is called by
        the framework.  Thus the decode 'options' are set as part of
        configuring the module through Pyramid settings.

        :param request: the Pyramid Request object
        :param jwtauth_token: the string (bString - Py3) - of the full token
                              to decode
        :param leeway: Integer - the number of seconds of leeway to pass to
                       jwt.decode()
        :param verify: Boolean - True to verify - passed to jwt.decode()
        :param options: set of options for what to verify.
        """
        if leeway is None:
            leeway = self.leeway
        if self.public_key is not None:
            key = self.public_key
        else:
            key = self.master_secret
        _options = self.decode_options or {}
        if options:
            _options.update(options)
        if len(_options.keys()) == 0:
            _options = None
        claims = jwt.decode(jwtauth_token,
                            key=key,
                            leeway=leeway,
                            verify=verify,
                            options=_options)
        return claims

    def encode_jwt(self, request, claims, key=None, algorithm=None):
        """Encode a set of claims into a JWT token.

        This is just a proxy for jwt.encode() but uses the default
        master_secret that may have been set in configuring the library.

        If the private_key is set then self.private_key is used for the encode
        (assuming key = None!)  algorithm also has to be an RS* algorithm and
        if not set, then self.algorithm is used.
        """
        if key is None:
            if self.private_key is not None:
                key = self.private_key
            else:
                key = self.master_secret
        if algorithm is None:
            algorithm = self.algorithm
        # fix for older version of PyJWT which doesn't covert all of the time
        # claims.  This won't be needed in the future.
        encode_claims = maybe_encode_time_claims(claims)

        jwtauth_token = jwt.encode(encode_claims, key=key, algorithm=algorithm)
        return jwtauth_token


def maybe_encode_time_claims(claims):
    encode_claims = claims.copy()
    # convert datetime to a intDate value in known time-format claims
    for time_claim in ['exp', 'iat', 'nbf']:
        if isinstance(encode_claims.get(time_claim), datetime):
            encode_claims[time_claim] = (
                timegm(encode_claims[time_claim].utctimetuple()))
    return encode_claims


def _load_function_from_settings(name, settings):
    """Load a plugin argument as a function created from the given settings.

    This function is a helper to load and possibly curry a callable argument
    to the plugin.  It grabs the value from the dotted python name found in
    settings[name] and checks that it is a callable.  It then looks for args
    of the form settings[name_*] and curries them into the function as extra
    keyword argument before returning.
    """
    # See if we actually have the named object.
    dotted_name = settings.pop(name, None)
    if dotted_name is None:
        return None
    func = DottedNameResolver(None).resolve(dotted_name)
    # Check that it's a callable.
    if not callable(func):
        raise ValueError("Argument %r must be callable" % (name,))
    # Curry in any keyword arguments.
    func_kwds = {}
    prefix = name + "_"
    for key in list(settings.keys()):
        if key.startswith(prefix):
            func_kwds[key[len(prefix):]] = settings.pop(key)
    # Return the original function if not currying anything.
    # This is both more efficent and better for unit testing.
    if func_kwds:
        func = functools.partial(func, **func_kwds)
    return func


def _load_object_from_settings(name, settings):
    """Load a plugin argument as an object created from the given settings.

    This function is a helper to load and possibly instanciate an argument
    to the plugin.  It grabs the value from the dotted python name found in
    settings[name].  If this is a callable, it looks for arguments of the
    form settings[name_*] and calls it with them to instanciate an object.
    """
    # See if we actually have the named object.
    dotted_name = settings.pop(name, None)
    if dotted_name is None:
        return None
    obj = DottedNameResolver(None).resolve(dotted_name)
    # Extract any arguments for the callable.
    obj_kwds = {}
    prefix = name + "_"
    for key in list(settings.keys()):
        if key.startswith(prefix):
            obj_kwds[key[len(prefix):]] = settings.pop(key)
    # Call it if callable.
    if callable(obj):
        obj = obj(**obj_kwds)
    elif obj_kwds:
        raise ValueError("arguments provided for non-callable %r" % (name,))
    return obj


def includeme(config):
    """Install JWTAuthenticationPolicy into the provided configurator.

    This function provides an easy way to install JWT Access Authentication
    into your pyramid application.  Loads a JWTAuthenticationPolicy from the
    deployment settings and installs it into the configurator.
    """
    # Hook up a default AuthorizationPolicy.
    # ACLAuthorizationPolicy is usually what you want.
    # If the app configures one explicitly then this will get overridden.
    # In auto-commit mode this needs to be set before adding an authn policy.
    authz_policy = ACLAuthorizationPolicy()
    config.set_authorization_policy(authz_policy)

    # Build a JWTAuthenticationPolicy from the deployment settings.
    settings = config.get_settings()
    authn_policy = JWTAuthenticationPolicy.from_settings(master_secret = "test")
    config.set_authentication_policy(authn_policy)

    # Set the forbidden view to use the challenge() method on the policy.
    # The following causes a problem with cornice (fighting - open to options
    # about them playing properly together.)
    # config.add_forbidden_view(authn_policy.challenge)
