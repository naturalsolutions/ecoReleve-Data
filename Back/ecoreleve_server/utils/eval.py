import operator
import re
from sqlalchemy import not_

class Eval():

    def eval_binary_expr(self,op1, operator, op2):
        op = operator.lower()
        try : 
            return self.get_operator_fn(op)(op1, op2)
        except (NameError,KeyError): 
            return not_(self.get_operator_fn(op.replace('not','').replace(' ',''))(op1, op2))

    def get_operator_fn(self,op):
        return {
            '<' : operator.lt,
            '>' : operator.gt,
            '=' : operator.eq,
            '<>': operator.ne,
            '<=': operator.le,
            '>=': operator.ge,
            'is' : operator.eq,
            'is not' : operator.ne,
            'like': operator.eq,
            'not like': operator.ne,
            'contains': self._contains,
            'contain': self._contains,
            'in': self._in,
            'checked': self.checked,
            'ends': self.end_with,
            'end': self.end_with,
            'begins': self.begin_with,
            'begin': self.begin_with,
            }[op]

    def _in(self,op1,op2):
        l = [s for s in re.split("[,|;\W]+", op2)]
        return op1.in_(l)

    def _contains(self,op1,op2):
        return op1.like('%'+op2+'%')

    def not_contains(self,op1,op2):
        return not_(op1.like('%'+op2+'%'))

    def checked(self,op1,op2):
        if '-1' in op2:
                return None
        return op1.in_(op2)

    def begin_with(self,op1,op2):
        return op1.like(op2+'%')

    def end_with(self,op1,op2):
        return op1.like('%'+op2)



