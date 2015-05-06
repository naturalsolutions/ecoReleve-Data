from sqlalchemy import (
   Column,
   DateTime,
   Index,
   Integer,
   Sequence,
   String,
   func
 )

from sqlalchemy.ext.hybrid import hybrid_property
from ecoreleve_server.Models import Base, dbConfig

db_dialect = dbConfig['dialect']

class User(Base):
    __tablename__ = 'User'
    id = Column('ID', Integer, Sequence('seq_user_pk_id'), primary_key=True)
    Lastname = Column(String(50), nullable=False)
    Firstname = Column(String(50), nullable=False)
    CreationDate = Column(DateTime, nullable=False,server_default=func.now())
    Login = Column(String, nullable=False)
    Password = Column(String, nullable=False)
    Language = Column(String(2))
    Role = Column(String(15), nullable=False)
    ModificationDate = Column(DateTime, nullable=False,server_default=func.now())
    if db_dialect =='mssql':
        __table_args__ = (
            Index('idx_Tuser_lastname_firstname', Lastname, Firstname, mssql_include=[id]),
        )
    else:
        __table_args__ = (
            Index('idx_Tuser_lastname_firstname', Lastname, Firstname),
        )

    @hybrid_property
    def fullname(self):
        """ Return the fullname of a user.
        """
        return self.Lastname + ' ' + self.Firstname
    
    def check_password(self, given_pwd):
        """Check the password of a user.
        
        Parameters
        ----------
        given_pwd : string
            The password to check, assumed to be an SHA1 hash of the real one.
            
        Returns
        -------
        boolean
            Either the password matches or not
        """
        return self.Password == given_pwd.lower()
