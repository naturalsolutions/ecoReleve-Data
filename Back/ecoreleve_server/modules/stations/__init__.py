from .station_collection import (
    StationCollection
)
from .station_resource import (
    StationsResource,
    StationResource

)
from ecoreleve_server.core import RootCore

__all__ = [
    "StationCollection",
    "StationsResource",
    "StationResource"
]


def includeme(config):
    RootCore.children.append(('stations', StationsResource))
    config.scan('.station_view')
