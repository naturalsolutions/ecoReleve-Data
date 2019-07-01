from sqlalchemy import (
    Column,
    ForeignKey,
    Integer
    )

from ecoreleve_server.ModelDB import MAIN_DB_BASE



class PhotosTags(MAIN_DB_BASE):

    __tablename__ = 'PhotosTags'

    FK_Tags = Column(Integer,
                            ForeignKey('Tags.ID'),
                            nullable=False)
    FK_Photos = Column(Integer,
                               ForeignKey('Photos.ID'),
                               nullable=False)              
