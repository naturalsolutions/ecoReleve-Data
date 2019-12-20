from .monitored_sites_history_resource import (
    MonitoredSiteHistoryResource,
    PositionCollection
)

__all__ = [
    "MonitoredSiteHistoryResource"
    "PositionCollection"
]


def includeme(config):
    config.scan(".monitored_site_history_view")