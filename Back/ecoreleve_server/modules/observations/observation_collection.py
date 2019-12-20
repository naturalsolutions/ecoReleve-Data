from ecoreleve_server.core.base_collection import Query_engine
from ecoreleve_server.database.main_db import Observation


@Query_engine(Observation)
class ObservationCollection:
    pass
