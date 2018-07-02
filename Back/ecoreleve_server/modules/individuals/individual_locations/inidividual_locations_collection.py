from sqlalchemy import select, desc, join, outerjoin, and_, not_, or_, exists, Table

from ecoreleve_server.core import Base
from ecoreleve_server.core.base_collection import Query_engine, eval_

allLocIndiv = Base.metadata.tables['allIndivLocationWithStations']


@Query_engine(allLocIndiv)
class IndividualLocationsCollection:
    pass
