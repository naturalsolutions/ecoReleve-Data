from .import_collection import ImportCollection
from .import_ressource import (
    ImportResource,
    ImportHistoryResource
)
from ecoreleve_server.core import RootCore


__all__ = [
    "ImportCollection",
    "ImportResource",
    "ImportHistoryResource"
]


def includeme(config):
    RootCore.children.append(('importHistory', ImportHistoryResource))
    config.scan('.import_view')
