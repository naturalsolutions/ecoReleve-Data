from sqlalchemy import select, desc, join, outerjoin, and_, not_, or_, exists, Table

from ecoreleve_server.core import Base
from ecoreleve_server.core.base_collection import Query_engine, eval_

allLocIndiv = Base.metadata.tables['allIndivLocationWithStations']
IndivLoc = select(allLocIndiv.c).where(
            allLocIndiv.c['FK_Individual'] == 1).cte()


@Query_engine(allLocIndiv)
class IndividualLocationsCollection:
    pass
    # def __init__(self, SessionMaker, id_=None):
    #     allLocIndiv = Base.metadata.tables['allIndivLocationWithStations']
    #     IndivLoc = select(allLocIndiv.c
    #                       ).where(
    #         allLocIndiv.c['FK_Individual'] == id_
    #     ).cte()
    #     super().__init__(IndivLoc, SessionMaker)