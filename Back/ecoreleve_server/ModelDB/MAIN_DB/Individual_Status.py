from sqlalchemy import (
    Column,
    ForeignKey,
    Integer,
    String,
    Table
    )
from ecoreleve_server.ModelDB import MAIN_DB


class IndividualStatus(MAIN_DB):
    __table__ = Table('IndividualStatus', MAIN_DB.metadata,
                      Column('FK_Individual', Integer, ForeignKey(
                          'Individual.ID'), primary_key=True),
                      Column('Status_', String)
                      )
    FK_Individual = __table__.c['FK_Individual']
    Status_ = __table__.c['Status_']
