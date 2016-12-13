from ..Models import Base
from sqlalchemy import Column, Integer, Sequence, String


class Region(Base):

    __tablename__ = 'Region'
    ID = Column(Integer, Sequence('Region__id_seq'), primary_key=True)
    Country = Column(String(250))
    Region = Column(String(250))
