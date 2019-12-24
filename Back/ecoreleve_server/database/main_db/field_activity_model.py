from sqlalchemy import (
    Column,
    ForeignKey,
    Integer,
    Sequence,
    Unicode
    )

from ecoreleve_server.database.meta import Main_Db_Base
from ecoreleve_server.database.main_db import Observation
# from ecoreleve_server.modules.observations import Observation


class fieldActivity(Main_Db_Base):

    __tablename__ = 'fieldActivity'

    ID = Column(Integer, Sequence('fieldActivity__id_seq'), primary_key=True)
    Name = Column(Unicode(250) , nullable=False)


class FieldActivity_ProtocoleType(Main_Db_Base):

    __tablename__ = 'FieldActivity_ProtocoleType'

    ID = Column(Integer, Sequence('FieldActivity_ProtocoleType__id_seq'), primary_key=True)
    FK_fieldActivity = Column(Integer, ForeignKey('fieldActivity.ID'), nullable=False)
    FK_ProtocoleType = Column(Integer, ForeignKey('ProtocoleType.ID'), nullable=False)

ProtocoleType = Observation.TypeClass # i puke .... but we don't have choice for now

# class ProtocoleType ( Base ) :

#     __tablename__ = 'ProtocoleType'

#     ID = Column(Integer, Sequence('ProtocoleType__id_seq'), primary_key=True)
#     Name = Column(Unicode(250), nullable=True)
#     Status = Column(Integer, nullable=True)
#     OriginalId = Column(Unicode(250), nullable=True)
#     obsolete = Column(Boolean, nullable=True)