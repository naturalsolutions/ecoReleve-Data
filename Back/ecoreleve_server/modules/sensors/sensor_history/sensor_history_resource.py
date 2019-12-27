from ecoreleve_server.core.base_resource import (
    DynamicValueResource,
    DynamicValuesResource
)
from collections import OrderedDict
from ecoreleve_server.database.main_db import Sensor
from ecoreleve_server.database.meta import Main_Db_Base
from sqlalchemy import (
    join,
    select,
    desc
)

SensorDynPropValue = Sensor.DynamicValuesClass


class SensorValueResource(DynamicValueResource):
    model = SensorDynPropValue

    def retrieve(self):
        pass


class SensorValuesResource(DynamicValuesResource):
    model = SensorDynPropValue

    def retrieve(self):
        from ecoreleve_server.utils.parseValue import formatThesaurus

        propertiesTable = Main_Db_Base.metadata.tables[self.__parent__.objectDB.TypeClass.PropertiesClass.__tablename__]
        dynamicValuesTable = Main_Db_Base.metadata.tables[self.__parent__.objectDB.DynamicValuesClass.__tablename__]
        FK_name = 'FK_' + self.__parent__.objectDB.__tablename__
        FK_property_name = self.__parent__.objectDB.fk_table_DynProp_name

        tableJoin = join(dynamicValuesTable, propertiesTable,
                         dynamicValuesTable.c[FK_property_name] == propertiesTable.c['ID'])
        query = select([dynamicValuesTable, propertiesTable.c['Name']])
        query = query.select_from(tableJoin)
        query = query.where(dynamicValuesTable.c[FK_name] == self.__parent__.objectDB.ID)
        query = query.order_by(desc(dynamicValuesTable.c['StartDate']))

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
