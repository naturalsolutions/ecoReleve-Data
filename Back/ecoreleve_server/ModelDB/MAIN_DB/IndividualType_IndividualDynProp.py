from sqlalchemy import (
    Column,
    Integer,
    Sequence,
    )

from ecoreleve_server.ModelDB import MAIN_DB_BASE



class IndividualType_IndividualDynProp (MAIN_DB_BASE):

    __tablename__ = 'IndividualType_IndividualDynProp'


    ID = Column(Integer, Sequence('IndividualType_IndividualDynProp__id_seq'), primary_key=True)
    Required = Column(Integer, nullable=False)
    FK_IndividualType = Column(Integer,
                            ForeignKey('IndividualType.ID'),
                            nullable=False)
    FK_IndividualDynProp = Column(Integer,
                               ForeignKey('IndividualDynProp.ID'),
                               nullable=False)




