from datetime import datetime
from sqlalchemy import types

class IntegerDateTime(types.TypeDecorator):
    """Used for working with epoch timestamps.
 
Converts datetimes into epoch on the way in.
    Converts epoch datetimes to timestamps on the way out.
    """
    impl = types.DateTime
    def process_bind_param(self, value, dialect):
        return value.timetuple()
    def process_result_value(self, value, dialect):
        return value.timestamp()