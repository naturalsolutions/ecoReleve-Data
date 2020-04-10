from sqlalchemy import (
    Column,
    ForeignKey,
    Integer,
    Sequence,
    Unicode
    )

from ecoreleve_server.core import Base
from ecoreleve_server.modules.observations import Observation


class fieldActivity(Base):

    __tablename__ = 'fieldActivity'

    ID = Column(Integer, Sequence('fieldActivity__id_seq'), primary_key=True)
    Name = Column(Unicode(250) , nullable=False)


class FieldActivity_ProtocoleType(Base):

    __tablename__ = 'FieldActivity_ProtocoleType'

    FK_fieldActivity = Column(
        Integer,
        ForeignKey('fieldActivity.ID'),
        nullable=False,
        primary_key=True
        )
    FK_ProtocoleType = Column(
        Integer,
        ForeignKey('ProtocoleType.ID'),
        nullable=False,
        primary_key=True
        )
    Order = Column(
        Integer,
        nullable=False,
        server_default='1'
        )

ProtocoleType = Observation.TypeClass # i puke .... but we don't have choice for now

# class ProtocoleType ( Base ) :

#     __tablename__ = 'ProtocoleType'

#     ID = Column(Integer, Sequence('ProtocoleType__id_seq'), primary_key=True)
#     Name = Column(Unicode(250), nullable=True)
#     Status = Column(Integer, nullable=True)
#     OriginalId = Column(Unicode(250), nullable=True)
#     obsolete = Column(Boolean, nullable=True)