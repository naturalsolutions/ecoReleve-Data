from .authentificationPolicy import MyAuthenticationPolicy, myAuthorizationPolicy
from pyramid.security import DENY_ALL

__defaultCookieName = 'API-CORE'

def includeme(config):
    authorizationPolicy = myAuthorizationPolicy()
    config.set_authorization_policy (authorizationPolicy)

    customSettings = meaningConfig(config)

    authentificationPolicy = MyAuthenticationPolicy(**customSettings)
    config.set_authentication_policy (authentificationPolicy)

    # from now all view added to project will have 'read' permission by default
    # but BE CAREFUL and read the doc 
    # https://docs.pylonsproject.org/projects/pyramid/en/latest/narr/security.html#setting-a-default-permission
    # short way : use NO_PERMISSION_REQUIRED for overwrite this default permission
    config.set_default_permission('read')


def meaningConfig(config):
        '''
        pick params with need in *.ini file
        '''
        settings = config.get_settings()
        if settings.get('RENECO.SECURITE.TINS_LABEL') is None:
                '''
                this key is used to check your cookie claims
                if you are on SERVER B with an instance of ecoReleve
                You must have an Tins_Label to identify the app 
                Tips:
                The portal give you a domain cookie with all instance of all app on the server and your user role encoded in the payload
                like this ['role'] : {
                Tins_label : role
                }
                (example : erd PROD, erd DEV )
                '''
                raise Exception('You mus\'t have this key RENECO.SECURITE.TINS_LABEL defined in your *.ini file')

        return {
                # "header"         : settings.get('JWTSECURITY.HEADERS', None), # for portal
                "secretkey"      : settings.get('JWTSECURITY.MASTER_SECRET', None) ,
                "cookie_name"    : settings.get('JWTSECURITY.COOKIENAME', __defaultCookieName),
                "TIns_Label"     : settings.get('RENECO.SECURITE.TINS_LABEL')
        }
