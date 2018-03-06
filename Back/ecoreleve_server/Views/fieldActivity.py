from ..Models import (
    fieldActivity,
    FieldActivity_ProtocoleType,
    ProtocoleType
)
import json
import itertools
from datetime import datetime
from sqlalchemy import select, and_, join
from sqlalchemy.exc import IntegrityError
from ..controllers.security import RootCore
from . import CustomView, context_permissions


class FieldActivityView(CustomView):
    item = None
    model = fieldActivity
    def __init__(self, ref, parent):
        CustomView.__init__(self, ref, parent)
        print(ref)
        self.objectDB = self.session.query(fieldActivity).get(ref)
        print(self.objectDB)
        self.actions = {'protocoleTypes': self.getProtocoleTypes,
                        }

    def retrieve(self):
        return {'ID': self.objectDB.ID,
                'Name':self.objectDB.Name,
                'protocoleTypes': self.getProtocoleTypes()
                }

    def getProtocoleTypes(self):
        join_table = join(ProtocoleType, FieldActivity_ProtocoleType,
                            ProtocoleType.ID == FieldActivity_ProtocoleType.FK_ProtocoleType)
        query = select([ProtocoleType.ID, ProtocoleType.Name, ProtocoleType.OriginalId]
                        ).where(and_(ProtocoleType.Status.in_([4, 8, 10]),
                                    FieldActivity_ProtocoleType.FK_fieldActivity == self.objectDB.ID)
                                ).select_from(join_table)
        
        query = query.where(ProtocoleType.obsolete == False)
        result = self.session.execute(query).fetchall()
        res = []
        for row in result:
            elem = {}
            elem['ID'] = row['ID']
            elem['DisplayName'] = row['Name'].replace('_', ' ')
            elem['Name'] = row['Name']
            elem['FormBuilder_initialID'] = row['OriginalId'].replace('FormBuilder-', '')
            res.append(elem)
        res = sorted(res, key=lambda k: k['Name'])
        return res

class FieldActivitiesView(CustomView):
    item = FieldActivityView

    def retrieve(self):
        query = select([fieldActivity.ID.label('value'),
                        fieldActivity.Name.label('label')])
        result = self.session.execute(query).fetchall()
        res = []
        for row in result:
            res.append({'label': row['label'], 'value': row['value']})
        return sorted(res, key=lambda x: x['label'])

RootCore.listChildren.append(('fieldActivities', FieldActivitiesView))