from .dashboard_resource import (
    DashboardResource
)
from ecoreleve_server.core import RootCore

__all__ = [
    "DashboardResource"
]


def includeme(config):
    RootCore.children.append(('dashboard', DashboardResource))
    config.scan(".dashboard_view")
