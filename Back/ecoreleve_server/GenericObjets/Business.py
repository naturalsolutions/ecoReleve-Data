from ..core import Base
from sqlalchemy import (
    select,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Unicode,
    Sequence,
    orm,
    func,
    event,
    text,
    bindparam
)
from collections import OrderedDict
import json
from sqlalchemy.ext.hybrid import hybrid_property
from pyramid import threadlocal
from pyramid.view import view_config


class BusinessRuleError(Exception):

    def __init__(self, value):
        self.value = value

    def __str__(self):
        return self.value

    def __repr__(self):
        return self.value


@view_config(context=BusinessRuleError, renderer='json')
def businessError_view(exc, request):
    request.response.status_code = 409
    request.response.text = exc.value
    return request.response


class BusinessRules(Base):
    __tablename__ = 'BusinessRules'

    ID = Column(Integer, primary_key=True)
    name = Column(String(250))
    target = Column(String(250))
    targetType = Column(String(250))
    actionType = Column(String(250))
    executing = Column(String(250))
    params = Column(String(250))
    description = Column(String(250))
    errorValue = Column(String(250))

    @hybrid_property
    def paramsJSON(self):
        return json.loads(self.params)

    @hybrid_property
    def targetTypes(self):
        if self.targetType:
            return json.loads(self.targetType)
        else:
            return []

    def raiseError(self):
        raise BusinessRuleError(self.errorValue)

    def buildQuery(self, entityDTO):
        ''' Build stored procedure statment, params:
                - entityDTO : dict()
            return text(query)'''
        paramsJSON = self.paramsJSON
        sqlParams = ' @result int; \n'
        declare_stmt = 'DECLARE ' + sqlParams
        params_stmt = ' :' + ', :'.join(paramsJSON) + ', @result OUTPUT; \n'
        bindparams = [bindparam(param, entityDTO.get(param, None))
                      for param in paramsJSON]

        stmt = text(declare_stmt + ' EXEC ' + self.executing +
                    params_stmt + '\n SELECT @result;', bindparams=bindparams)
        return stmt

    def execute(self, entityDTO):
        session = threadlocal.get_current_request().dbsession
        stmt = self.buildQuery(entityDTO)
        result = session.execute(stmt).scalar()

        if result:
            self.raiseError()
        # return result
