from .release_resource import (
    ReleaseIndividualsResource,
    ReleaseResource
)
from ecoreleve_server.core import RootCore

__all__ = [
    "ReleaseIndividualsResource",
    "ReleaseResource"
]


def includeme(config):
    RootCore.children.append(('release', ReleaseResource))
    config.scan(".release_view")