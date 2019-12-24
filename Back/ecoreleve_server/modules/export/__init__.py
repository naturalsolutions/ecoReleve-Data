from ecoreleve_server.core import RootCore
from .export_resource import (
    CustomExportResource,
    ExportQueryResource,
    ExportCollectionQueryResource,
    ExportThemeResource,
    ExportCollectionThemeResource,
    ExportCoreResource
)

__all__ = [
    "CustomExportResource",
    "ExportQueryResource",
    "ExportCollectionQueryResource",
    "ExportThemeResource",
    "ExportCollectionThemeResource",
    "ExportCoreResource"
]


def includeme(config):
    RootCore.children.append(('export', ExportCoreResource))
    config.scan('.export_view')
