from ecoreleve_server.core.base_collection import Query_engine
from . import Station


@Query_engine(Station)
class StationCollection:
    pass