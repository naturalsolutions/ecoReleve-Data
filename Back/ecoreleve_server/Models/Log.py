from sqlalchemy import Column,create_engine,text,bindparam
from sqlalchemy.types import DateTime, Integer, String
from sqlalchemy.sql import func
from ..Models import Base,dbConfig
import logging
from pyramid import threadlocal
import traceback , sys
import json
from urllib.parse import quote_plus
import transaction


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


def sendLog(logLevel,domaine,msg_number = 500):
    request = threadlocal.get_current_request()
    # session = request.dbsession

    engine = create_engine(dbConfig['cn.dialect'] + quote_plus(dbConfig['dbLog.url']))
    session = engine.connect()

    exc_type, exc_value, exc_traceback = sys.exc_info()

    try : 
        body = json.loads(request.body.decode("utf-8")) 
    except : 
        body = {}

    try :
        params = request.params.mixed()
    except :
        params = {}

    stmt = text(""" 
        EXEC  """+dbConfig['dbLog.schema']+ """.[PR_LOG_MESSAGE] :lvl, :origin, :scope, :user, :domain , :msg_number, :other, :log_msg;
        """
                ).bindparams(
                bindparam('lvl', logLevel)
                ,bindparam('origin', 'ecoReleveData')
                ,bindparam('scope', 'Pyramid')
                ,bindparam('user', request.authenticated_userid['username'])
                ,bindparam('domain', domaine)
                ,bindparam('msg_number', msg_number)
                ,bindparam('other', json.dumps({
                    'stackTrace': traceback.format_exc(), 
                    'request': {
                    'url': request.url,
                    'method': request.method,
                    'body': body,
                    'params' : params}
                    }) )
                ,bindparam('log_msg', str(exc_value))
                )
    res = session.execute(stmt.execution_options(autocommit=True))
    transaction.commit()
    session.close()
    # newLog = Log(LOG_LEVEL= logLevel
    #     ,ORIGIN='ecoReleveData'
    #     ,SCOPE='Pyramid'
    #     ,LOGUSER=request.authenticated_userid['username']
    #     ,DOMAINE = domaine
    #     ,MESSAGE_NUMBER=msg_number
    #     ,LOG_MESSAGE=str(exc_value)
    #     ,OTHERSINFOS= json.dumps({
    #         'stackTrace': traceback.format_exc(), 
    #         'request': {
    #             'url': request.url,
    #             'method': request.method,
    #             'body': body,
    #             'params' : params
    #         }
    #     })
    #     )
    # session = request.dbsession
    # session.add(newLog)
    # session.commit()