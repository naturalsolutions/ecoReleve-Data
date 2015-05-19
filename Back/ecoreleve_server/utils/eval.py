import operator

class Eval():
	def get_operator_fn(self,op):
	    return {
	        '<' : operator.lt,
	        '>' : operator.gt,
	        '=' : operator.eq,
	        '<>': operator.ne,
	        '<=': operator.le,
	        '>=': operator.ge,
			'Is' : operator.eq,
			'Is not' : operator.ne,
	        'Like': operator.eq,
	        'Not Like': operator.ne,
	        }[op]
	def eval_binary_expr(self,op1, operator, op2):
	    op1,op2 = op1, op2
	    if(operator == 'Contains') :
	       return op1.like('%'+op2+'%')
	    return self.get_operator_fn(operator)(op1, op2)
