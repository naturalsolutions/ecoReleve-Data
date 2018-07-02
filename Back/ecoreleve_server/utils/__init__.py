from .eval import Eval
from pyramid import threadlocal
from .thesaurusLoad import *

def getSession():
    return threadlocal.get_current_request().dbsession