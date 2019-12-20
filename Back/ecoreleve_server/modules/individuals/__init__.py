from .individual_history import (
    IndividualValueResource,
    IndividualValuesResource
)
from .individual_locations import (
    IndividualLocationsResource,
    IndividualLocationsCollection
)

from .individual_collection import (
    IndividualCollection
)

from .individual_resource import (
    IndividualResource,
    IndividualsResource
)
from ecoreleve_server.core import RootCore


__all__ = [
    "IndividualValueResource",
    "IndividualValuesResource",
    "IndividualLocationsResource",
    "IndividualLocationsCollection",
    "IndividualCollection",
    "IndividualResource",
    "IndividualsResource"
]


def includeme(config):
    RootCore.children.append(('individuals', IndividualsResource))
    config.scan('.individual_view')
