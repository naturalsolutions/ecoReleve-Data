from .region_resource import (
    RegionsResource,
    RegionResource,
)
from ecoreleve_server.core import RootCore

__all__ = [
    "RegionsResource",
    "RegionResource"
]


def includeme(config):
    RootCore.children.append(('regions', RegionsResource))
    config.scan('.region_view')
