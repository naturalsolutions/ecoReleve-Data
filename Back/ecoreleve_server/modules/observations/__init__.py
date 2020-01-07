from .observation_collection import (
    ObservationCollection
)
from .observation_resource import (
    ObservationResource,
    ObservationsResource
)
from ecoreleve_server.core import RootCore


__all__ = [
        "ObservationCollection",
        "ObservationResource",
        "ObservationsResource"
]


def includeme(config):
    RootCore.children.append(('protocols', ObservationsResource))
    RootCore.children.append(('observations', ObservationsResource))
    config.scan('.observation_view')
