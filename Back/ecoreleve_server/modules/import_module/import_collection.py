from ecoreleve_server.core.base_collection import Query_engine
from ecoreleve_server.database.sensor_db import Import


@Query_engine(Import)
class ImportCollection:
    pass
