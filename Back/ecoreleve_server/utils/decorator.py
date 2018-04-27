from functools import wraps
from time import time


def timing(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        start = time()
        result = f(*args, **kwargs)
        end = time()
        print('function {func} elapsed time: {timer} s'.format(func=f.__name__, timer=end-start))
        return result
    return wrapper