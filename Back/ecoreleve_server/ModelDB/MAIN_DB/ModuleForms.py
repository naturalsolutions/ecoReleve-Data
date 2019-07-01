from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Sequence,
    Unicode,
    func
    )

from ecoreleve_server.ModelDB.meta import MAIN_DB_BASE

class ModuleForms(MAIN_DB_BASE):

    __tablename__ = 'ModuleForms'

    ID = Column(Integer, Sequence('ModuleForms__id_seq'), primary_key=True)
    module_id = Column(Integer, nullable=True)
    TypeObj = Column(Integer, nullable=True)
    Name = Column(Unicode(250), nullable=True)
    Label = Column(Unicode(250), nullable=True)
    Required = Column(Boolean, nullable=True )
    FieldSizeEdit = Column(Integer, nullable=False)
    FieldSizeDisplay = Column(Integer, nullable=False)
    InputType = Column(Unicode(100), nullable=True)
    editorClass = Column(Unicode(100), nullable=True)
    FormRender = Column(Integer, nullable=True)
    FormOrder = Column(Integer, nullable=True)
    Legend = Column(Unicode(500), nullable=True)
    Options = Column(Unicode(255), nullable=True)
    Validators = Column(Unicode(255), nullable=True)
    displayClass = Column(Unicode(150), nullable=True)
    EditClass = Column(Unicode(150), nullable=True)
    Status = Column(Integer, nullable=True)
    Locked = Column(Boolean, nullable=True)
    DefaultValue = Column(String(150), nullable=True)
    Rules = Column(String(550), nullable=True)
    Orginal_FB_ID = Column(Integer, nullable=True)