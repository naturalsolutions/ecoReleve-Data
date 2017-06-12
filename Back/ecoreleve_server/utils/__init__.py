from .eval import Eval
from pyramid import threadlocal

def getSession():
    return threadlocal.get_current_request().dbsession