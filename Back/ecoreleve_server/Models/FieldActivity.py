
from ecoreleve_server.Models import Base,DBSession
from sqlalchemy import (Column,
 DateTime,
 Float,
 ForeignKey,
 Index,
 Integer,
 Numeric,
 String,
 Text,
 Unicode,
 text,
 Sequence,
 orm,
 and_,
 func,
 insert,
 select,
 UniqueConstraint)


# ------------------------------------------------------------------------------------------------------------------------- #
class fieldActivity(Base):

    __tablename__ = 'fieldActivity'

    ID = Column(Integer,Sequence('fieldActivity__id_seq'), primary_key=True)
    Name = Column(Unicode(250),nullable=False)


# ------------------------------------------------------------------------------------------------------------------------- #
class FieldActivity_ProtocoleType (Base) :
    __tablename__ = 'FieldActivity_ProtocoleType'

    ID = Column(Integer,Sequence('FieldActivity_ProtocoleType__id_seq'), primary_key=True)
    FK_fieldActivity = Column(Integer, ForeignKey('fieldActivity.ID') , nullable=False)
    FK_ProtocoleType = Column(Integer, ForeignKey('ProtocoleType.ID'), nullable=False)
