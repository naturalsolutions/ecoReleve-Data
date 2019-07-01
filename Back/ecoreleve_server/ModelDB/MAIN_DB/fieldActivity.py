from sqlalchemy import (Column,
                        Integer,
                        Sequence,
                        Unicode
                        )
from ecoreleve_server.ModelDB import MAIN_DB_BASE


class fieldActivity(MAIN_DB_BASE):

    __tablename__ = 'fieldActivity'

    ID = Column(Integer, Sequence('fieldActivity__id_seq'), primary_key=True)
    Name = Column(Unicode(250), nullable=False)
