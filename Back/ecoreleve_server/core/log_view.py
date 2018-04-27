import traceback
import sys
import json
import transaction
from urllib.parse import quote_plus
from pyramid import threadlocal
from pyramid.view import view_config
from pyramid.security import NO_PERMISSION_REQUIRED
from sqlalchemy import create_engine, text, bindparam

from .init_db import dbConfig


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
        traceback.print_exc()
        pass


@view_config(context=Exception, permission=NO_PERMISSION_REQUIRED)
def error_view(exc, request):
    sendLog(logLevel=5, domaine=3)
    if exc and exc.orig and exc.orig.args and '[Microsoft][ODBC SQL Server Driver][SQL Server]' in exc.orig.args[1]:
        request.response.status_code = 500
        request.response.text = exc.orig.args[1]
    else:
        request.response.status_code = 500
        request.response.text = 'Something goes wrong in API.<BR>'
    return request.response