from sqlalchemy import select, and_, join
from ecoreleve_server.core.base_resource import CustomResource
# from ecoreleve_server.modules.permissions import context_permissions
from ecoreleve_server.database.main_db import (
    fieldActivity,
    FieldActivity_ProtocoleType,
    Observation
    )


ProtocoleType = Observation.TypeClass


class FieldActivityResource(CustomResource):
    item = None
    model = fieldActivity

    def __init__(self, ref, parent):
        CustomResource.__init__(self, ref, parent)
        print(ref)
        self.objectDB = self.session.query(fieldActivity).get(ref)

    def retrieve(self):
        return {'ID': self.objectDB.ID,
                'Name':self.objectDB.Name,
                'protocoleTypes': self.getProtocoleTypes()
                }

    def getProtocoleTypes(self):
        join_table = join(
            ProtocoleType,
            FieldActivity_ProtocoleType,
            ProtocoleType.ID == FieldActivity_ProtocoleType.FK_ProtocoleType)
        query = select([
            ProtocoleType.ID,
            ProtocoleType.Name,
            ProtocoleType.OriginalId
            ])
        query = query.where(
                and_(
                    ProtocoleType.Status.in_([4, 8, 10]),
                    FieldActivity_ProtocoleType.FK_fieldActivity == self.objectDB.ID
                    )
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


class FieldActivitiesResource(CustomResource):
    children = [('{int}', FieldActivityResource)]

    def retrieve(self):
        query = select([fieldActivity.ID.label('value'),
                        fieldActivity.Name.label('label')])
        result = self.session.execute(query).fetchall()
        res = []
        for row in result:
            res.append({'label': row['label'], 'value': row['value']})
        return sorted(res, key=lambda x: x['label'])
