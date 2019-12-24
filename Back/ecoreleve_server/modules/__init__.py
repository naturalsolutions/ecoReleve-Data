# from os.path import dirname
# import os


# def import_submodule():
#     modules_folder = os.listdir(dirname(__file__))
#     modules = [ f for f in modules_folder if '.' not in f]

#     __import__('ecoreleve_server.modules',globals(), locals(),modules)


from .permissions import (
    context_permissions,
    routes_permission
)


__all__ = [
    "context_permissions",
    "routes_permission"
]


def includeme(config):
    config.scan('.autocomplete')
    config.scan('.security')
    config.scan('.statistics')
    config.include('.url_dispatch')
