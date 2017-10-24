from sqlalchemy import create_engine, text, bindparam
from ..Models import dbConfig
from pyramid import threadlocal
import traceback
import sys
import json
from urllib.parse import quote_plus
import transaction


def sendLog(logLevel, domaine, msg_number=500, scope='Pyramid', errorDict=None, logMsg=None):
    request = threadlocal.get_current_request()

    try:
        engine = create_engine(
            dbConfig['cn.dialect'] + quote_plus(dbConfig['dbLog.url']))
        session = engine.connect()
        try:
            body = json.loads(request.body.decode("utf-8"))
        except:
            body = {}

        try:
            params = request.params.mixed()
        except:
            params = {}
        if errorDict is None:
            exc_type, exc_value, exc_traceback = sys.exc_info()
            errorDict = json.dumps({
                'stackTrace': traceback.format_exc(),
                'request': {
                    'url': request.url,
                    'method': request.method,
                    'body': body,
                    'params': params}
            })
            logMsg = str(exc_value)

        stmt = text("""
            EXEC  """ + dbConfig['dbLog.schema']
                    + """.[PR_LOG_MESSAGE] :lvl, :origin, :scope, :user, :domain , :msg_number, :other, :log_msg;
            """).bindparams(
            bindparam('lvl', logLevel),
            bindparam('origin', 'ecoReleveData'),
            bindparam('scope', scope),
            bindparam('user', request.authenticated_userid['username']),
            bindparam('domain', domaine),
            bindparam('msg_number', msg_number),
            bindparam('other', errorDict),
            bindparam('log_msg', logMsg)
        )
        session.execute(stmt.execution_options(autocommit=True))
        transaction.commit()
        session.close()
    except:
        # traceback.print_exc()
        pass
