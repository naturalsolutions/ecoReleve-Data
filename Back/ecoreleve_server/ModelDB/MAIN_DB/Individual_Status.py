from sqlalchemy import (
    Column,
    ForeignKey,
    Integer,
    String,
    Table
    )
from ecoreleve_server.ModelDB import MAIN_DB_BASE


class IndividualStatus(MAIN_DB_BASE):
    __table__ = Table('IndividualStatus', MAIN_DB_BASE.metadata,
                      Column('FK_Individual', Integer, ForeignKey(
                          'Individual.ID'), primary_key=True),
                      Column('Status_', String)
                      )
    FK_Individual = __table__.c['FK_Individual']
    Status_ = __table__.c['Status_']
