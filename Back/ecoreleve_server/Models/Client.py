from sqlalchemy import (
    Column,
    DateTime,
    Index,
    Integer,
    Sequence,
    String,
    func,
    UniqueConstraint,

)
from sqlalchemy.orm import relationship
from sqlalchemy.ext.hybrid import hybrid_property
from ..Models import Base, dbConfig
from ..GenericObjets.OrmModelsMixin import HasStaticProperties, GenericType


class Client(HasStaticProperties, Base):
    __tablename__ = 'Client'
    ID = Column(Integer, Sequence('Client__id_seq'), primary_key=True)
    Name = Column(String(250))
    description = Column(String)
    CreationDate = Column(DateTime, nullable=False, server_default=func.now())

    Projects = relationship('Project')

    __table_args__ = (UniqueConstraint('Name',
                                       name='uqc_Client_name',
                                       ), {}
                      )
