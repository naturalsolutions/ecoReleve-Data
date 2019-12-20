from ecoreleve_server.core.base_resource import *
from ecoreleve_server.modules.permissions import context_permissions
from ecoreleve_server.database.main_db import Sensor

SensorDynPropValue = Sensor.DynamicValuesClass


class SensorValueResource(DynamicValueResource):
    model = SensorDynPropValue

    def retrieve(self):
        pass


class SensorValuesResource(DynamicValuesResource):
    model = SensorDynPropValue


    def retrieve(self):
        from ecoreleve_server.utils.parseValue import formatThesaurus

        propertiesTable = Base.metadata.tables[self.__parent__.objectDB.TypeClass.PropertiesClass.__tablename__]
        dynamicValuesTable = Base.metadata.tables[self.__parent__.objectDB.DynamicValuesClass.__tablename__]
        FK_name = 'FK_' + self.__parent__.objectDB.__tablename__
        FK_property_name = self.__parent__.objectDB.fk_table_DynProp_name

        tableJoin = sa.join(dynamicValuesTable, propertiesTable,
                         dynamicValuesTable.c[FK_property_name] == propertiesTable.c['ID'])
        query = sa.select([dynamicValuesTable, propertiesTable.c['Name']]
                       ).select_from(tableJoin).where(
            dynamicValuesTable.c[FK_name] == self.__parent__.objectDB.ID
        ).order_by(sa.desc(dynamicValuesTable.c['StartDate']))

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
                    elif key in ['ValueDate','ValueFloat','ValueInt']:
                        dictRow['value'] = curRow[key]
                    elif 'FK' not in key:
                        dictRow[key] = curRow[key]
            dictRow['StartDate'] = curRow[
                'StartDate'].strftime('%Y-%m-%d %H:%M:%S')
            response.append(dictRow)

        return response