from ..Models import (
    Sensor,
    MonitoredSite,
    Base,
    Equipment
    # SensorList
)
from sqlalchemy import select, desc, join, outerjoin, and_, not_, or_, exists, Table
from sqlalchemy.orm import aliased, exc
from collections import OrderedDict
from sqlalchemy.exc import IntegrityError
from ..controllers.security import RootCore, context_permissions
from . import DynamicObjectView, DynamicObjectCollectionView, DynamicObjectValue, DynamicObjectValues
from ..GenericObjets.SearchEngine import Query_engine
from ..utils.datetime import parse


SensorDynPropValue = Sensor.DynamicValuesClass

@Query_engine(Sensor)
class SensorList():

    def extend_from(self, _from):
        curEquipmentTable = Base.metadata.tables['CurrentlySensorEquiped']
        MonitoredSiteTable = Base.metadata.tables['MonitoredSite']
        table_join = outerjoin(_from,
                        curEquipmentTable,
                        curEquipmentTable.c['FK_Sensor'] == Sensor.ID)
        
        table_join = outerjoin(
            table_join,
            MonitoredSite,
            MonitoredSiteTable.c['ID'] == curEquipmentTable.c[
                'FK_MonitoredSite'])
        
        self.selectable.append(MonitoredSiteTable.c[
                               'Name'].label('FK_MonitoredSiteName'))
        self.selectable.append(curEquipmentTable.c[
                               'FK_Individual'].label('FK_Individual'))
        return table_join

@Query_engine.add_filter(SensorList, 'toto')
def toto(self, query, criteria):
    pass

@Query_engine.add_filter(SensorList, 'availableOn')
def available_filter(self, query, criteria):
    date = criteria['Value']
    try:
        date = parse(date.replace(' ', ''))
    except:
        pass
    e = aliased(Equipment)
    e2 = aliased(Equipment)
    e3 = aliased(Equipment)

    subQueryEquip = select([e2]).where(
        and_(e.FK_Sensor == e2.FK_Sensor,
                and_(e.StartDate < e2.StartDate, e2.StartDate <= date)))

    querySensor = select([e]).where(
        and_(e.StartDate <= date,
                and_(e.Deploy == 0,
                    and_(Sensor.ID == e.FK_Sensor,
                        not_(exists(subQueryEquip)))
                    )
                ))

    subQueryNotEquip = select([e3]).where(
        and_(Sensor.ID == e3.FK_Sensor,
                e3.StartDate < date))

    if criteria['Operator'].lower() != 'is not':
        query = query.where(or_(exists(querySensor),
                                not_(exists(subQueryNotEquip))))
    else:
        query = query.where(or_(not_(exists(querySensor)),
                                not_(exists(subQueryNotEquip))))
    return query


class SensorValueView(DynamicObjectValue):
    model = SensorDynPropValue
    item = None

    def retrieve(self):
        pass


class SensorValuesView(DynamicObjectValues):
    model = SensorDynPropValue
    item = SensorValueView


class SensorView(DynamicObjectView):

    model = Sensor

    def __init__(self, ref, parent):
        DynamicObjectView.__init__(self, ref, parent)
        self.actions = {'equipment': self.getEquipment,
                        'locations': self.getLocations}
        self.add_child('history', SensorValuesView)
        print('test')

    def __getitem__(self, ref):
        if ref in self.actions:
            self.retrieve = self.actions.get(ref)
            return self
        return self.get(ref)

    def getLocations(self):
        return 'no locations available'

    def getEquipment(self):
        _id = self.objectDB.ID

        table = Base.metadata.tables['SensorEquipment']
        joinTable = join(table, Sensor, table.c['FK_Sensor'] == Sensor.ID)
        joinTable = outerjoin(joinTable, MonitoredSite, table.c[
                        'FK_MonitoredSite'] == MonitoredSite.ID)
        query = select([table.c['StartDate'],
                        table.c['EndDate'],
                        Sensor.UnicIdentifier,
                        MonitoredSite.Name,
                        MonitoredSite.ID.label('MonitoredSiteID'),
                        table.c['FK_Individual']]
                       ).select_from(joinTable
                                     ).where(table.c['FK_Sensor'] == _id
                                             ).order_by(desc(table.c['StartDate']))

        result = self.session.execute(query).fetchall()
        response = []
        for row in result:
            curRow = OrderedDict(row)
            curRow['StartDate'] = curRow['StartDate'].strftime('%Y-%m-%d %H:%M:%S')
            curRow['EndDate'] = curRow['EndDate'].strftime(
                '%Y-%m-%d %H:%M:%S') if curRow['EndDate'] is not None else None
            curRow['format'] = 'YYYY-MM-DD HH:mm:ss'
            response.append(curRow)

        return response


class SensorsView(DynamicObjectCollectionView):

    Collection = SensorList
    item = SensorView
    moduleFormName = 'SensorForm'
    moduleGridName = 'SensorFilter'

    def __init__(self, ref, parent):
        DynamicObjectCollectionView.__init__(self, ref, parent)
        self.actions = {'getUnicIdentifier': self.getUnicIdentifier}
        self.__acl__ = context_permissions[ref]

    def search(self, paging=True, params={}, noCount=False):
        params, history, startDate = self.formatParams(params, paging)
        conf_grid = self.getGrid()
        cols = list(map(lambda x: x['field'].replace('.','@'),conf_grid))

        self.collection = SensorList(session = self.session)
        dataResult = self.collection.search(selectable=cols,filters=params.get('criteria', []), offset=params.get('offset'), limit=params.get('per_page'), order_by=params.get('order_by'))
        
        # table = Base.metadata.tables['VArgosData_With_EquipIndiv']
        # self.collection = QueryEngine(session = self.session, model=table)
        # dataResult = self.collection.search(filters=params.get('criteria', []), offset=params.get('offset'), limit=params.get('per_page'), order_by=params.get('order_by'))

        countResult = self.collection._count(filters=params.get('criteria', []))
        result = [{'total_entries': countResult}]
        result.append(dataResult)

        return result

    def insert(self):
        try:
            response = DynamicObjectCollectionView.insert(self)
        except IntegrityError as e:
            self.session.rollback()
            self.request.response.status_code = 520
            response = self.request.response
            response.text = "This identifier is already used for another sensor"
            pass
        return response

    def getUnicIdentifier(self):
        sensorType = self.request.params['sensorType']
        query = select([Sensor.UnicIdentifier.label('label'), Sensor.ID.label(
            'val')]).where(Sensor.FK_SensorType == sensorType)
        response = [OrderedDict(row) for row in self.session.execute(query).fetchall()]

        return response


RootCore.listChildren.append(('sensors', SensorsView))
