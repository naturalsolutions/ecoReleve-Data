from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Sequence,
    func
    )
from sqlalchemy.orm import relationship
from ecoreleve_server.ModelDB import MAIN_DB_BASE
from sqlalchemy.ext.hybrid import hybrid_property


class ProtocoleType_ObservationDynProp(MAIN_DB_BASE):

    __tablename__ = 'ProtocoleType_ObservationDynProp'

    ID = Column(Integer,
                Sequence('ProtocoleType_ObservationDynProp__id_seq'),
                primary_key=True)
    Required = Column(Integer,
                      server_default='0',
                      nullable=False)
    FK_ProtocoleType = Column(Integer,
                            ForeignKey('ProtocoleType.ID'),
                            nullable=True)
    FK_ObservationDynProp = Column(Integer,
                               ForeignKey('ProtocoleDynProp.ID'),
                               nullable=True)
    Locked = Column(Boolean, nullable=True)
    LinkedTable = Column(String(255), nullable=True)
    LinkedField = Column(String(255), nullable=True)
    LinkedID = Column(String(255), nullable=True)
    LinkSourceID = Column(String(255), nullable=True)
            
