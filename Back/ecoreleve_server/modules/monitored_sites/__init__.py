from .monitored_sites_history import (
    PositionCollection,
    MonitoredSiteHistoryResource
)
from .monitored_site_collection import (
    MonitoredSiteCollection
)
from .monitored_site_resource import (
    MonitoredSiteResource,
    MonitoredSitesResource
)
from ecoreleve_server.core import RootCore

__all__ = [
    "PositionCollection",
    "MonitoredSiteCollection",
    "MonitoredSiteHistoryResource",
    "MonitoredSiteResource",
    "MonitoredSitesResource"
]


def includeme(config):
    RootCore.children.append(('monitoredSites', MonitoredSitesResource))
    config.include("ecoreleve_server.modules.monitored_sites.monitored_sites_history")
    config.scan('.monitored_site_view')