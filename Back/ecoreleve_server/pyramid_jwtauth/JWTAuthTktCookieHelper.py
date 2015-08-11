from webob.cookies import CookieProfile


class _SimpleSerializer(object):
    def loads(self, bstruct):
        return native_(bstruct)

    def dumps(self, appstruct):
        return bytes_(appstruct)

class JWTAuthTktCookieHelper(object):
    """
    A helper class for use in third-party authentication policy
    implementations.  See
    :class:`pyramid.authentication.AuthTktAuthenticationPolicy` for the
    meanings of the constructor arguments.
    """


    def __init__(self, secret, cookie_name='auth_tkt', secure=False,
                 include_ip=False, timeout=None, reissue_time=None,
                 max_age=None, http_only=False, path="/", wild_domain=True,
                 hashalg='md5', parent_domain=False, domain=None):

        serializer = _SimpleSerializer()
            
        self.cookie_profile = CookieProfile(
            cookie_name = cookie_name,
            secure = secure,
            max_age = max_age,
            httponly = http_only,
            path = path,
            serializer=serializer
            )

        self.secret = secret
        self.cookie_name = cookie_name
        self.secure = secure
        self.include_ip = include_ip
        self.timeout = timeout
        self.reissue_time = reissue_time
        self.max_age = max_age
        self.wild_domain = wild_domain
        self.parent_domain = parent_domain
        self.domain = domain
        self.hashalg = hashalg





    def forget(self, request):
        return True

    def remember(self, request, userid, max_age=None, tokens=()):
        return True
        #return self._get_cookies(request, cookie_value, max_age)


class AuthTicket(object):
    """
    This class represents an authentication token.  You must pass in
    the shared secret, the userid, and the IP address.  Optionally you
    can include tokens (a list of strings, representing role names),
    'user_data', which is arbitrary data available for your own use in
    later scripts.  Lastly, you can override the cookie name and
    timestamp.

    Once you provide all the arguments, use .cookie_value() to
    generate the appropriate authentication ticket.

    Usage::

        token = AuthTicket('sharedsecret', 'username',
            os.environ['REMOTE_ADDR'], tokens=['admin'])
        val = token.cookie_value()

    """

    def __init__(self, secret, userid, ip, tokens=(), user_data='',
                 time=None, cookie_name='auth_tkt', secure=False,
                 hashalg='md5'):
        self.secret = secret
        self.userid = userid
        self.ip = ip
        self.tokens = ','.join(tokens)
        self.user_data = user_data
        if time is None:
            self.time = time_mod.time()
        else:
            self.time = time
        self.cookie_name = cookie_name
        self.secure = secure
        self.hashalg = hashalg

    def digest(self):
        return calculate_digest(
            self.ip, self.time, self.secret, self.userid, self.tokens,
            self.user_data, self.hashalg)

    def cookie_value(self):
        v = '%s%08x%s!' % (self.digest(), int(self.time),
                           url_quote(self.userid))
        if self.tokens:
            v += self.tokens + '!'
        v += self.user_data
        return v
