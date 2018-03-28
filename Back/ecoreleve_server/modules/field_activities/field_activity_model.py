from ecoreleve_server.core import Base
from sqlalchemy import (Column,
                        ForeignKey,
                        Integer,
                        Sequence,
                        Unicode)


class fieldActivity(Base):

    __tablename__ = 'fieldActivity'

    ID = Column(Integer, Sequence('fieldActivity__id_seq'), primary_key=True)
    Name = Column(Unicode(250), nullable=False)


class FieldActivity_ProtocoleType (Base):
    __tablename__ = 'FieldActivity_ProtocoleType'

    ID = Column(Integer, Sequence(
        'FieldActivity_ProtocoleType__id_seq'), primary_key=True)
    FK_fieldActivity = Column(Integer, ForeignKey(
        'fieldActivity.ID'), nullable=False)
    FK_ProtocoleType = Column(Integer, ForeignKey(
        'ProtocoleType.ID'), nullable=False)
