from ecoreleve_server.core.base_collection import Query_engine
from . import MonitoredSite


@Query_engine(MonitoredSite)
class MonitoredSiteCollection:
    pass