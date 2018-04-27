from ..Models import (
    Individual,
    # IndividualDynPropValue,
    Individual_Location,
    IndividualStatus,
    Sensor,
    IndividualList,
    Base,
    IndivLocationList,
    Station,
    ErrorCheckIndividualCodes
)
import json
from datetime import datetime
from sqlalchemy import select, join, desc, not_
from collections import OrderedDict
from ..controllers.security import RootCore, Resource, SecurityRoot, context_permissions
from . import DynamicObjectView, DynamicObjectCollectionView, DynamicObjectValue, DynamicObjectValues
from pyramid.traversal import find_root

SensorType = Sensor.TypeClass
IndividualDynPropValue = Individual.DynamicValuesClass


class IndividualValueView(DynamicObjectValue):
    model = IndividualDynPropValue
    item = None

    def retrieve(self):
        pass


class IndividualValuesView(DynamicObjectValues):
    model = IndividualDynPropValue
    item = IndividualValueView

    def retrieve(self):
        from ..utils.parseValue import formatThesaurus

        propertiesTable = Base.metadata.tables[self.parent.objectDB.GetDynPropTable()]
        dynamicValuesTable = Base.metadata.tables[self.parent.objectDB.GetDynPropValuesTable()]
        FK_name = self.parent.objectDB.GetSelfFKNameInValueTable()
        FK_property_name = self.parent.objectDB.GetDynPropFKName()

        tableJoin = join(dynamicValuesTable, propertiesTable,
                         dynamicValuesTable.c[FK_property_name] == propertiesTable.c['ID'])
        query = select([dynamicValuesTable, propertiesTable.c['Name']]
                       ).select_from(tableJoin).where(
                                            dynamicValuesTable.c[FK_name] == self.parent.objectDB.ID
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


class IndividualView(DynamicObjectView):
    model = Individual

    def __init__(self, ref, parent):
        DynamicObjectView.__init__(self, ref, parent)
        self.add_child('locations', IndividualLocationsView)
        self.add_child('history', IndividualValuesView)
        self.actions = {'equipment': self.getEquipment}

    def __getitem__(self, ref):
        if ref in self.actions:
            self.retrieve = self.actions.get(ref)
            return self
        return self.get(ref)

    def getEquipment(self):
        table = Base.metadata.tables['IndividualEquipment']
        joinTable = join(table, Sensor, table.c['FK_Sensor'] == Sensor.ID)
        joinTable = join(joinTable,
                         SensorType,
                         Sensor.type_id == SensorType.ID)
        query = select([table.c['StartDate'],
                        table.c['EndDate'],
                        Sensor.UnicIdentifier,
                        Sensor.ID.label('SensorID'),
                        table.c['FK_Individual'],
                        SensorType.Name.label('Type')]
                       ).select_from(joinTable
                                     ).where(table.c['FK_Individual'] == self.objectDB.ID
                                             ).order_by(desc(table.c['StartDate']))

        result = self.session.execute(query).fetchall()
        response = []
        for row in result:
            curRow = OrderedDict(row)
            curRow['StartDate'] = curRow['StartDate'].strftime('%Y-%m-%d %H:%M:%S')
            if curRow['EndDate'] is not None:
                curRow['EndDate'] = curRow['EndDate'].strftime('%Y-%m-%d %H:%M:%S')
            else:
                curRow['EndDate'] = ''
            response.append(curRow)

        return response


class IndividualsView(DynamicObjectCollectionView):

    Collection = IndividualList
    item = IndividualView
    moduleFormName = 'IndivForm'
    moduleGridName = 'IndivFilter'

    def __init__(self, ref, parent):
        DynamicObjectCollectionView.__init__(self, ref, parent)
        self.__acl__ = context_permissions[ref]

        if not self.typeObj:
            self.typeObj = 1

    def insert(self):
        # if set True create automatically a new indiv  = not what we want
        self.session.autoflush = False
        data = {}
        startDate = None

        for items, value in self.request.json_body.items():
            data[items] = value
        existingIndivID = None

        if 'stationID' in data:
            curSta = self.session.query(Station).get(data['stationID'])
            startDate = curSta.StationDate
        self.typeObj = data['FK_IndividualType']
        newIndiv = self.item.model(FK_IndividualType=self.typeObj,
                                   creationDate=datetime.now(),
                                   Original_ID='0')
        newIndiv.init_on_load()
        try:
            newIndiv.updateFromJSON(data, startDate=startDate)

            if self.typeObj == 2:
                existingIndivID = self.checkExisting(newIndiv)
                if existingIndivID is not None:
                    self.session.rollback()
                    self.session.close()
                    indivID = existingIndivID

            if existingIndivID is None:
                self.session.add(newIndiv)
                self.session.flush()
                indivID = newIndiv.ID
            return {'ID': indivID}
        except ErrorCheckIndividualCodes as e:
            self.request.response.status_code = 520
            return str(e)

    def checkExisting(self, indiv):
        indivData = indiv.__properties__

        searchInfo = {'criteria':
                            [{'Column': key,
                              'Operator': 'is',
                              'Value': val}
                             for key, val in indivData.items()],
                      'order_by': ['ID:asc']}

        moduleFront = self.getConf(self.moduleGridName)

        listObj = IndividualList(moduleFront, typeObj=2)
        dataResult = listObj.GetFlatDataList(searchInfo)

        if len(dataResult) > 0:
            existingID = dataResult[0]['ID']
        else:
            existingID = None

        return existingID

    def retrieve(self):
        import time
        from ..GenericObjets.SearchEngine import QueryEngine, DynamicPropertiesQueryEngine
        from ..Models.Equipment import Equipment
        table = Base.metadata.tables['IndividualEquipment']
        collection = DynamicPropertiesQueryEngine(self.session, Individual, from_history=None, object_type=1)  #, object_type=1, from_history='10/01/2012' )

        filters = [
            # {
            #     'Column':'ID',
            #     'Operator':'>',
            #     'Value': '100000'
            # },  
            {
                'Column':'Sex',
                'Operator':'is',
                'Value': 'femelle'
            },
            {
                'Column':'Monitoring_Status',
                'Operator':'is null',
                'Value': 'retiré'
            },
            # {
            #     'Column':'Species',
            #     'Operator':'contains',
            #     'Value': 'undulata'
            # },
            # {
            #     'Column':'Status_',
            #     'Operator':'=',
            #     'Value': 'mort'
            # }
        ]
        result = collection.search(filters, limit=1000) #, order_by=['Sex:desc'])
        count = collection._count(filters)
        return [{'total_entries': count}, result]



class IndividualLocationsView(SecurityRoot):

    def __init__(self, ref, parent):
        Resource.__init__(self, ref, parent)
        self.parent = parent
        root = find_root(self)
        self.request = root.request
        self.session = root.request.dbsession
        self.__actions__ = {'getFields': self.getFieldsLoc,
                            }

    def __getitem__(self, ref):
        if ref in self.actions:
            self.retrieve = self.actions.get(ref)
            return self
        return self

    def retrieve(self):
        return self.getLocations()

    def update(self):
        self.delete()

    def delete(self):
        IdList = json.loads(self.request.params['IDs'])
        self.session.query(Individual_Location).filter(
            Individual_Location.ID.in_(IdList)).delete(synchronize_session=False)
        return True

    def getFieldsLoc(self):
        gene = IndivLocationList(self.session, None)
        return gene.get_col()

    def getLocations(self):
        id_ = self.parent.objectDB.ID
        gene = IndivLocationList(self.session, id_)
        data = self.request.params.mixed()
        if 'criteria' in data:
            criteria = json.loads(data['criteria'])
        else:
            criteria = {}

        if 'per_page' in data:
            offset = json.loads(data['offset'])
            per_page = json.loads(data['per_page'])
        else:
            offset = None
            per_page = None

        if 'geo' in self.request.params:
            result = gene.get_geoJSON(
                criteria, ['ID', 'Date', 'type_', 'precision'], ['Date:asc'])
            for feature in result['features']:
                feature['properties']['Date'] = feature['properties']['Date'].strftime('%Y-%m-%d %H:%M:%S')
            return result
        else:
            result = gene.search(criteria,
                                 offset=offset,
                                 per_page=per_page,
                                 order_by=['StationDate:desc'])
            for row in result:
                row['Date'] = row['Date'].strftime('%Y-%m-%d %H:%M:%S')
                row['format'] = 'YYYY-MM-DD HH:mm:ss'

        return result


RootCore.listChildren.append(('individuals', IndividualsView))
RootCore.listChildren.append(('individualsValues', IndividualValuesView))
