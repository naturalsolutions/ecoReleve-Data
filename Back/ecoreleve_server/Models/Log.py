from sqlalchemy import Column
from sqlalchemy.types import DateTime, Integer, String
from sqlalchemy.sql import func
from ..Models import Base
import logging
from pyramid import threadlocal
import traceback , sys
import json

class Log(Base):
    __tablename__ = 'TLOG_MESSAGES'
    ID = Column(Integer, primary_key=True) # auto incrementing
    JCRE = Column(DateTime, nullable = False, default = func.now())
    LOG_LEVEL = Column(Integer, nullable = False)
    ORIGIN = Column(String(255))
    SCOPE = Column(String(255))
    LOGUSER = Column(String(255))
    DOMAINE = Column(String(255))
    MESSAGE_NUMBER = Column(Integer)
    LOG_MESSAGE = Column(String(255))
    OTHERSINFOS = Column(String)

    __table_args__ = ({'schema': 'NSLog.dbo'})


def sendLog(**kwargs):
    request = threadlocal.get_current_request()
    session = request.dbsession

    exc_type, exc_value, exc_traceback = sys.exc_info()
    newLog = Log(LOG_LEVEL= kwargs['logLevel']
        ,ORIGIN='ecoReleveData'
        ,SCOPE='Pyramid'
        ,LOGUSER=request.authenticated_userid['username']
        ,DOMAINE = kwargs['domaine']
        ,MESSAGE_NUMBER=500
        ,LOG_MESSAGE=str(exc_value)
        ,OTHERSINFOS= json.dumps({'stackTrace':traceback.format_exc()})
        )
    session = request.dbsession
    session.add(newLog)
    session.commit()