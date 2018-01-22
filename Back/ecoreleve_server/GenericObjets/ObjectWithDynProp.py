from ..Models import Base, dbConfig
from sqlalchemy import select
from collections import OrderedDict
from datetime import datetime
from .DataBaseObjects import ConfiguredDbObjectMapped, DbObject
from pyramid import threadlocal
from ..utils.parseValue import find, isEqual, parser
from abc import abstractmethod
from sqlalchemy.orm.exc import *
from .Business import *
from traceback import print_exc


analogType = {'String': 'ValueString',
              'Float': 'ValueFloat',
              'Date': 'ValueDate',
              'Integer': 'ValueInt',
              'float': 'ValueFloat',
              'Time': 'ValueDate',
              'Date Only': 'ValueDate'}

LinkedTables = {}


class ObjectWithDynProp(ConfiguredDbObjectMapped, DbObject):
    ''' Class to extend for mapped object with dynamic properties '''
    allProp = None

    def __init__(self):
        DbObject.__init__(self)
        self.session = threadlocal.get_current_request().dbsession
        self.GetAllProp()

    @abstractmethod
    def GetNewValue(self):
        pass

    @abstractmethod
    def GetStartDate(self):
        pass

    @abstractmethod
    def GetType(self):
        pass

    def bulk_insert(sef):
        pass

    def GetAllProp(self):
        ''' Get all object properties (dynamic and static) '''
        if self.allProp is None:
            try:
                # IF typeObj is setted retrieve only dynamic props of this type
                type_ = self.GetType()
            except:
                # ELSE retrieve all dyn props
                type_ = None
            dynPropTable = Base.metadata.tables[self.GetDynPropTable()]
            if type_:
                result = type_.GetDynProps()
            else:
                result = self.session.execute(
                    select([dynPropTable])).fetchall()
            statProps = [{'name': statProp.key, 'type': statProp.type,
                          'ID': None} for statProp in self.__table__.columns]
            dynProps = [{'name': dynProp.Name, 'type': dynProp.TypeProp,
                         'ID': dynProp.ID} for dynProp in result]
            statProps.extend(dynProps)
            self.allProp = statProps
        return self.allProp

    def GetPropWithName(self, nameProp):
        if self.allProp is None:
            self.GetAllProp()
        return find(lambda x: x['name'].lower() == nameProp.lower(), self.allProp)

    def getTypeObjectName(self):
        return self.__tablename__ + 'Type'

    def getTypeObjectFKName(self):
        return 'FK_' + self.__tablename__ + 'Type'

    def GetDynPropValuesTable(self):
        return self.__tablename__ + 'DynPropValue'

    def GetDynPropValuesTableID(self):
        return 'ID'

    def GetDynPropTable(self):
        return self.__tablename__ + 'DynProp'

    def GetDynPropFKName(self):
        return 'FK_' + self.__tablename__ + 'DynProp'

    def GetSelfFKNameInValueTable(self):
        return 'FK_' + self.__tablename__

    def GetpkValue(self):
        return self.ID

    def beforeUpdate(self):
        self.LoadNowValues()

    def setProperty(self, propertyName, value, useDate=None):
        ''' Set object properties (static and dynamic)
            value can have two forms:
            {
              value: value
              date: date
            }

            or value
        '''

        # extract value and date from dict value
        if isinstance(value, dict) and "date" in value:
            useDate = parser(value.get("date"))
            value = value.get("value", None)

        DbObject.setProperty(self, propertyName, value)
        if (propertyName.lower() in self.GetType().DynPropNames):
            if ((propertyName not in self.__properties__
                 ) or (isEqual(self.__properties__[propertyName], value) is False)):

                value = parser(value)
                oldValueObject = None
                if useDate is not None:
                    oldValueObject = self.getDynPropWithDate(
                        propertyName, StartDate=useDate)

                self.setPropertyAtDate(
                    propertyName, value, useDate, oldValueObject)
                self.__properties__[propertyName] = value
            else:
                '''dynamic property already exist with the same value
                => value is not stored for history'''
                return

    def setPropertyAtDate(self, propertyName, value, useDate=None, existingValueObject=None):
        if not existingValueObject:
            valueObject = self.GetNewValue(propertyName)
            valueObject.StartDate = datetime.utcnow() if useDate is None else useDate
        else:
            valueObject = existingValueObject
        setattr(valueObject, analogType[
                self.GetPropWithName(propertyName)['type']], value)
        self.GetDynPropValues().append(valueObject)
        return

    def getDynPropWithDate(self, dynPropName, StartDate=None):
        startDate = StartDate if StartDate is not None else self.GetStartDate()
        if isinstance(dynPropName, list):
            dynPropID = [self.GetPropWithName(
                name)['ID'] for name in dynPropName]
            res = list(filter(lambda x: x.StartDate == startDate and getattr(
                x, self.GetDynPropFKName()) in dynPropID, self.GetDynPropValues()))
        else:
            dynPropID = self.GetPropWithName(dynPropName)['ID']
            res = find(lambda x: x.StartDate == startDate and getattr(
                x, self.GetDynPropFKName()) == dynPropID, self.GetDynPropValues())
        return res

    def LoadNowValues(self):
        if self.GetpkValue():
            curQuery = 'select V.*, P.Name,P.TypeProp from ' + self.GetDynPropValuesTable() + \
                ' V JOIN ' + self.GetDynPropTable() + \
                ' P ON P.' + self.GetDynPropValuesTableID() + '= V.' + \
                self.GetDynPropFKName() + ' where '
            curQuery += 'not exists (select * from ' + \
                self.GetDynPropValuesTable() + ' V2 '
            curQuery += 'where V2.' + self.GetDynPropFKName() + ' = V.' + self.GetDynPropFKName() + ' and V2.' + \
                self.GetSelfFKNameInValueTable() + ' = V.' + self.GetSelfFKNameInValueTable() + ' '
            curQuery += 'AND V2.startdate > V.startdate)'
            curQuery += 'and v.' + self.GetSelfFKNameInValueTable() + ' =  ' + \
                str(self.GetpkValue())

            Values = self.session.execute(curQuery).fetchall()
            for curValue in Values:
                row = OrderedDict(curValue)
                self.__properties__[row['Name']] = self.GetRealValue(row)

    def GetRealValue(self, row):
        return row[analogType[row['TypeProp']]]

    def getForm(self, displayMode='edit', type_=None, moduleName=None):
        from ..utils.parseValue import formatValue
        isGrid = False
        ObjType = self.GetType()
        if (ObjType.Status == 10):
            isGrid = True

        form = ConfiguredDbObjectMapped.getForm(
            self, displayMode, ObjType.ID, moduleName, isGrid=isGrid)

        form['data'] = {'id': 0}
        data = formatValue(form['schema']['defaultValues'], form['schema'])
        form['data'].update(data)
        form['data'][self.getTypeObjectFKName()] = ObjType.ID
        return form

    def getDataWithSchema(self, displayMode='edit'):
        ''' Function to call: return full schema
        according to configuration (table :ModuleForms) '''

        resultat = self.getForm(displayMode=displayMode)

        '''IF ID is send from front --> get data of this object in order to
        display value into form which will be sent'''
        data = self.getFlatObject(schema=resultat['schema'])
        resultat['data'] = data
        resultat['recursive_level'] = 0
        resultat = self.getDefaultValue(resultat)
        if self.ID:
            resultat['data']['id'] = self.ID
        else:
            # add default values for each field in data if exists
            # for attr in schema:
            resultat['data']['id'] = 0
            resultat['data'].update(resultat['schema']['defaultValues'])

        return resultat

    def getLinkedField(self):
        curQuery = 'select D.ID, D.Name , D.TypeProp , C.LinkedTable , C.LinkedField, C.LinkedID, C.LinkSourceID from ' + \
            self.GetType().GetDynPropContextTable()
        curQuery += ' C  JOIN ' + self.GetType().GetDynPropTable() + ' D ON C.' + \
            self.GetType().Get_FKToDynPropTable() + '= D.ID '
        curQuery += ' where C.' + self.GetType().GetFK_DynPropContextTable() + \
            ' = ' + str(self.GetType().ID)
        curQuery += ' AND C.LinkedTable is not null'
        Values = self.session.execute(curQuery).fetchall()

        return [dict(row) for row in Values]

    def linkedFieldDate(self):
        return datetime.utcnow()

    def updateLinkedField(self, data, useDate=None, previousState=None):
        if useDate is None:
            useDate = self.linkedFieldDate()

        linkedFields = self.getLinkedField()
        entitiesToUpdate = {}

        for linkProp in linkedFields:
            curPropName = linkProp['Name']
            linkedEntity = LinkedTables[linkProp['LinkedTable']]
            linkedPropName = linkProp['LinkedField'].replace('@Dyn:', '')
            linkedSource = self.getProperty(
                linkProp['LinkSourceID'].replace('@Dyn:', ''))

            # remove linked field if target object is different of previous

            if previousState and str(linkedSource) != str(previousState.get(linkProp['LinkSourceID'])):
                self.deleteLinkedField(previousState=previousState)

            try:
                linkedObj = self.session.query(linkedEntity).filter(
                    getattr(linkedEntity, linkProp['LinkedID']) == linkedSource).one()
            except NoResultFound:
                continue

            if linkedObj in entitiesToUpdate:
                entitiesToUpdate[linkedObj][linkedPropName] = self.getProperty(
                    curPropName)
            else:
                entitiesToUpdate[linkedObj] = {
                    linkedPropName: self.getProperty(curPropName)}

        for entity in entitiesToUpdate:
            data = entitiesToUpdate[entity]
            entity.init_on_load()
            entity.updateFromJSON(data, startDate=useDate)

    def deleteLinkedField(self, useDate=None, previousState=None):
        # request = threadlocal.get_current_request()
        # session = request.registry.dbmaker()
        session = dbConfig['dbSession']

        if useDate is None:
            useDate = self.linkedFieldDate()
        try:
            for linkProp in self.getLinkedField():
                obj = LinkedTables[linkProp['LinkedTable']]

                linkedField = linkProp['LinkedField'].replace('@Dyn:', '')
                if previousState:
                    linkedSource = previousState.get(
                        linkProp['LinkSourceID'].replace('@Dyn:', ''))
                else:
                    linkedSource = self.getProperty(
                        linkProp['LinkSourceID'].replace('@Dyn:', ''))
                try:
                    linkedObj = session.query(obj).filter(
                        getattr(obj, linkProp['LinkedID']) == linkedSource).one()
                except NoResultFound:
                    continue

                if hasattr(linkedObj, linkedField):
                    linkedObj.setProperty(linkedField, None)
                else:
                    dynPropValueToDel = linkedObj.getDynPropWithDate(
                        linkedField, useDate)
                    if dynPropValueToDel is not None:
                        session.delete(dynPropValueToDel)

        except Exception as e:
            raise e
        finally:
            session.commit()
            session.close()
