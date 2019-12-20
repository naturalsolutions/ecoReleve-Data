from sqlalchemy import select, join, not_, desc

from ecoreleve_server.core.base_resource import *
from ecoreleve_server.core import Base
from ecoreleve_server.database.main_db import Individual
from ecoreleve_server.modules.permissions import context_permissions

IndividualDynPropValue = Individual.DynamicValuesClass


class IndividualValueResource(DynamicValueResource):
    model = IndividualDynPropValue

    def retrieve(self):
        pass


class IndividualValuesResource(DynamicValuesResource):
    model = IndividualDynPropValue
    children = [('{int}', IndividualValueResource)]

    def retrieve(self):
        from ecoreleve_server.utils.parseValue import formatThesaurus

        propertiesTable = Base.metadata.tables[self.__parent__.objectDB.TypeClass.PropertiesClass.__tablename__]
        dynamicValuesTable = Base.metadata.tables[self.__parent__.objectDB.DynamicValuesClass.__tablename__]
        FK_name = 'FK_' + self.__parent__.objectDB.__tablename__
        FK_property_name = self.__parent__.objectDB.fk_table_DynProp_name

        tableJoin = join(dynamicValuesTable, propertiesTable,
                        dynamicValuesTable.c[FK_property_name] == propertiesTable.c['ID'])
        query = select([dynamicValuesTable, propertiesTable.c['Name']]
                    ).select_from(tableJoin).where(
                                            dynamicValuesTable.c[FK_name] == self.__parent__.objectDB.ID
                                                        )

        query = query.where(not_(propertiesTable.c['Name'].in_(['Release_Comments',
                                                                'Breeding ring kept after release',
                                                                'Box_ID',
                                                                'Date_Sortie',
                                                                'Poids']))
                            ).order_by(desc(dynamicValuesTable.c['StartDate']))

        result = self.session.execute(query).fetchall()
        response = []

        for row in result:
            curRow = OrderedDict(row)
            dictRow = {}
            for key in curRow:
                if curRow[key] is not None:
                    if key == 'ValueString' in key and curRow[key] is not None:
                        try:
                            thesauralValueObj = formatThesaurus(curRow[key])
                            dictRow['value'] = thesauralValueObj['displayValue']
                        except:
                            dictRow['value'] = curRow[key]
                    elif 'FK' not in key:
                        dictRow[key] = curRow[key]
            dictRow['StartDate'] = curRow[
                'StartDate'].strftime('%Y-%m-%d %H:%M:%S')
            response.append(dictRow)

        return response
