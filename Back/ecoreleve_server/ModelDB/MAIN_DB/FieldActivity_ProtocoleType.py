from sqlalchemy import (Column,
                        ForeignKey,
                        Integer,
                        Sequence)
from ecoreleve_server.ModelDB import MAIN_DB_BASE


class FieldActivity_ProtocoleType (MAIN_DB_BASE):
    __tablename__ = 'FieldActivity_ProtocoleType'

    ID = Column(Integer, Sequence(
        'FieldActivity_ProtocoleType__id_seq'), primary_key=True)
    FK_fieldActivity = Column(Integer, ForeignKey(
        'fieldActivity.ID'), nullable=False)
    FK_ProtocoleType = Column(Integer, ForeignKey(
        'ProtocoleType.ID'), nullable=False)
