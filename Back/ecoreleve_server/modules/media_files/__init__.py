from .media_file_resource import (
    MediaFileResource,
    MediasFilesResource
)
from ecoreleve_server.core import RootCore


__all__ = [
    "MediaFileResource",
    "MediasFilesResource"
]


def includeme(config):
    RootCore.children.append(('mediasfiles', MediasFilesResource))
    config.scan('.media_file_view')
