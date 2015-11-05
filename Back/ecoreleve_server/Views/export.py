from pyramid.view import view_config
from sqlalchemy import func, desc, select, union, union_all, and_, bindparam, update, or_, literal_column, join, text, update
import json
import pandas as pd
import numpy as np
from ..Models import dbConfig, DBSession