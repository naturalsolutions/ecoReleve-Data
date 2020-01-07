from .field_activity_resource import (
    FieldActivityResource,
    FieldActivitiesResource
)
from ecoreleve_server.core import RootCore

__all__ = [
    "FieldActivityResource",
    "FieldActivityResource"
]


def includeme(config):
    RootCore.children.append(('fieldActivities', FieldActivitiesResource))
    config.scan(".field_activity_view")
