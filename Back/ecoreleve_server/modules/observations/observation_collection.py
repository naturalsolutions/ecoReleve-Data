from sqlalchemy import select, desc, join, func, outerjoin, and_, not_, or_, exists, Table

from ecoreleve_server.core import Base
from ecoreleve_server.core.base_collection import Query_engine
from . import Observation


@Query_engine(Observation)
class ObservationCollection:
    pass

