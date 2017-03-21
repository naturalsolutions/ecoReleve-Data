from ..Models import Base, dbConfig
from sqlalchemy import (
    select, and_, or_, asc)
from collections import OrderedDict
from datetime import datetime
from .FrontModules import FrontModules, ModuleForms, ModuleGrids
from .DataBaseObjects import ConfiguredDbObjectMapped
from pyramid import threadlocal
from ..utils.datetime import parse
from ..utils.parseValue import find, isEqual, formatValue
from sqlalchemy_utils import get_hybrid_properties

Cle = {'String': 'ValueString',
       'Float': 'ValueFloat',
       'Date': 'ValueDate',
       'Integer': 'ValueInt',
       'float': 'ValueFloat',
       'Time': 'ValueDate',
       'Date Only': 'ValueDate'}

LinkedTables = {}


class ObjectWithDynProp(ConfiguredDbObjectMapped):
    ''' Class to extend for mapped object with dynamic properties '''
    PropDynValuesOfNow = {}
    allProp = None

    def __init__(self, session=None):
        self.session = threadlocal.get_current_request().dbsession
        self.PropDynValuesOfNow = {}
        self.GetAllProp()
    #     self._constraintsFunctionLists = []

    # @property
    # def constraintsFunctionLists(self):
    #     return self._constraintsFunctionLists

    # @constraintsFunctionLists.setter
    # def constraintsFunctionLists(self, list):
    #     self._constraintsFunctionLists.extend(list)

    # def checkConstraintsOnData(self, data):
    #     error = 0
    #     for func in self._constraintsFunctionLists:
    #         if not func(data):
    #             error += 1
    #             raise CheckingConstraintsException(func.__name__)
    #     return error < 1

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

    def GetPropWithName(self, nameProp):
        if self.allProp is None:
            self.GetAllProp()
        return find(lambda x: x['name'].lower() == nameProp.lower(), self.allProp)

    def getTypeObjectName(self):
        return self.__tablename__ + 'Type'

    def getTypeObjectFKName(self):
        return 'FK_' + self.__tablename__ + 'Type'

    def GetType(self):
        raise Exception("GetType not implemented in children")

    def GetDynPropValuesTable(self):
        return self.__tablename__ + 'DynPropValue'

    def GetDynPropValuesTableID(self):
        return 'ID'

    def GetMyIDName(self):
        return 'ID'

    def GetDynPropTable(self):
        return self.__tablename__ + 'DynProp'

    def GetDynPropFKName(self):
        return 'FK_' + self.__tablename__ + 'DynProp'

    def GetDynPropValueObj(self):
        raise('GetDynPropValueObj not implemented in children')

    def GetSelfFKNameInValueTable(self):
        return 'FK_' + self.__tablename__

    def GetpkValue(self):
        return self.ID

    def GetProperty(self, nameProp):
        try:
            return getattr(self, nameProp)
        except:
            return self.PropDynValuesOfNow[nameProp]

    def SetProperty(self, nameProp, valeur, useDate=None):
        ''' Set object properties (static and dynamic) '''
        if hasattr(self, nameProp):
            try:
                if nameProp in self.__table__.c:
                    curTypeAttr = str(
                        self.__table__.c[nameProp].type).split('(')[0]
                    if 'date' in curTypeAttr.lower():
                        try:
                            valeur = parse(valeur.replace(' ', ''))
                        except:
                            pass
                setattr(self, nameProp, valeur)
                self.PropDynValuesOfNow[nameProp] = valeur
            except:
                pass
        else:
            if (nameProp.lower() in self.GetType().DynPropNames):
                if ((nameProp not in self.PropDynValuesOfNow
                     ) or (isEqual(self.PropDynValuesOfNow[nameProp], valeur) is False)):
                    # IF no value or different existing value, new value is
                    # affected
                    if 'date' in self.GetPropWithName(nameProp)['type'].lower():
                        try:
                            valeur = parse(valeur.replace(' ', ''))
                        except:
                            pass
                    oldvalue = None
                    if useDate is not None:
                        oldvalue = self.GetDynPropWithDate(
                            nameProp, StartDate=useDate)
                        if oldvalue is not None:
                            setattr(oldvalue, Cle[self.GetPropWithName(
                                nameProp)['type']], valeur)

                    if oldvalue is None:
                        NouvelleValeur = self.GetNewValue(nameProp)
                        NouvelleValeur.StartDate = datetime.today() if useDate is None else useDate
                        setattr(NouvelleValeur, Cle[
                                self.GetPropWithName(nameProp)['type']], valeur)
                        self.GetDynPropValues().append(NouvelleValeur)

                    self.PropDynValuesOfNow[nameProp] = valeur
                else:
                    return

            else:
                return
                # si la propriété dynamique existe déjà et que la valeur à affectée est identique à la valeur existente
                # => alors on insére pas d'historique car pas de chanegement

    def GetDynPropWithDate(self, dynPropName, StartDate=None):
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

    def GetNewValue(self):
        raise Exception("GetNewValue not implemented in children")

    def GetStartDate(self):
        raise Exception("GetStartDate not implemented in children")

    def LoadNowValues(self):
        curQuery = 'select V.*, P.Name,P.TypeProp from ' + self.GetDynPropValuesTable() + \
            ' V JOIN ' + self.GetDynPropTable() + \
            ' P ON P.' + self.GetDynPropValuesTableID() + '= V.' + \
            self.GetDynPropFKName() + ' where '
        curQuery += 'not exists (select * from ' + \
            self.GetDynPropValuesTable() + ' V2 '
        curQuery += 'where V2.' + self.GetDynPropFKName() + ' = V.' +  self.GetDynPropFKName() + ' and V2.' + \
            self.GetSelfFKNameInValueTable() + ' = V.' + self.GetSelfFKNameInValueTable() + ' '
        curQuery += 'AND V2.startdate > V.startdate)'
        curQuery += 'and v.' + self.GetSelfFKNameInValueTable() + ' =  ' + \
            str(self.GetpkValue())

        Values = self.session.execute(curQuery).fetchall()
        for curValue in Values:
            row = OrderedDict(curValue)
            self.PropDynValuesOfNow[row['Name']] = self.GetRealValue(row)

    def GetRealValue(self, row):
        return row[Cle[row['TypeProp']]]

    def UpdateFromJson(self, DTOObject, startDate=None):
        ''' Function to call : update properties of new
        or existing object with JSON/dict of value'''

        if self.checkConstraintsOnData(DTOObject):
            for curProp in DTOObject:
                if (curProp.lower() != 'id' and DTOObject[curProp] != '-1'):
                    if (isinstance(DTOObject[curProp], str)
                            and len(DTOObject[curProp].split()) == 0):
                        DTOObject[curProp] = None
                    self.SetProperty(curProp, DTOObject[curProp], startDate)

    def GetFlatObject(self, schema=None):
        ''' return flat object with static properties and last existing value of dyn props '''

        resultat = {}
        hybrid_properties = list(get_hybrid_properties(self.__class__).keys())
        if self.ID is not None:
            max_iter = max(len(self.__table__.columns), len(
                self.PropDynValuesOfNow), len(hybrid_properties))
            for i in range(max_iter):
                # Get static Properties
                try:
                    curStatProp = list(self.__table__.columns)[i]
                    resultat[curStatProp.key] = self.GetProperty(
                        curStatProp.key)
                except:
                    pass
                # Get dynamic Properties
                try:
                    curDynPropName = list(self.PropDynValuesOfNow)[i]
                    resultat[curDynPropName] = self.GetProperty(curDynPropName)
                except Exception as e:
                    pass
                try:
                    PropName = hybrid_properties[i]
                    resultat[PropName] = self.GetProperty(PropName)
                except Exception as e:
                    pass

        else:
            max_iter = len(self.__table__.columns)
            for i in range(max_iter):
                # Get static Properties
                try:
                    curStatProp = list(self.__table__.columns)[i]
                    curVal = self.GetProperty(curStatProp.key)
                    if curVal is not None:
                        resultat[curStatProp.key] = self.GetProperty(
                            curStatProp.key)
                except:
                    pass
        if not schema:
            schema = self.getForm()['schema']
        resultat = formatValue(resultat, schema)
        return resultat

    def getForm(self, displayMode='edit', type_=None, moduleName=None):
        ObjType = self.GetType()
        form = ConfiguredDbObjectMapped.getForm(self, displayMode, ObjType.ID, moduleName)
        if (ObjType.Status == 10):
            form['grid'] = True
        return form

    def GetDTOWithSchema(self, displayMode='edit'):
        ''' Function to call: return full schema
        according to configuration (table :ModuleForms) '''
        print('GetDTOWithSchema', displayMode)

        resultat = self.getForm(displayMode=displayMode)

        '''IF ID is send from front --> get data of this object in order to
        display value into form which will be sent'''
        data = self.GetFlatObject(resultat['schema'])
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

    def linkedFieldDate(self):
        return datetime.now()

    def updateLinkedField(self, DTOObject, useDate=None):
        if useDate is None:
            useDate = self.linkedFieldDate()

        linkedFields = self.getLinkedField()
        entitiesToUpdate = {}
        for linkProp in linkedFields:
            curPropName = linkProp['Name']
            linkedEntity = LinkedTables[linkProp['LinkedTable']]
            linkedPropName = linkProp['LinkedField'].replace('@Dyn:', '')
            linkedSource = self.GetProperty(
                linkProp['LinkSourceID'].replace('@Dyn:', ''))
            linkedObj = self.ObjContext.query(linkedEntity).filter(
                getattr(linkedEntity, linkProp['LinkedID']) == linkedSource).one()

            if linkedObj in entitiesToUpdate:
                entitiesToUpdate[linkedObj][linkedPropName] = self.GetProperty(curPropName)
            else:
                entitiesToUpdate[linkedObj] = {linkedPropName: self.GetProperty(curPropName)}

        for entity in entitiesToUpdate:
            data = entitiesToUpdate[entity]
            entity.init_on_load()
            entity.UpdateFromJson(data, startDate=useDate)

    def deleteLinkedField(self, useDate=None):
        session = dbConfig['dbSession']()
        if useDate is None:
            useDate = self.linkedFieldDate()
        for linkProp in self.getLinkedField():
            obj = LinkedTables[linkProp['LinkedTable']]

            try:
                linkedField = linkProp['LinkedField'].replace('@Dyn:', '')
                linkedSource = self.GetProperty(
                    linkProp['LinkSourceID'].replace('@Dyn:', ''))
                linkedObj = session.query(obj).filter(
                    getattr(obj, linkProp['LinkedID']) == linkedSource).one()

                if hasattr(linkedObj, linkedField):
                    linkedObj.SetProperty(linkedField, None)
                else:
                    dynPropValueToDel = linkedObj.GetDynPropWithDate(
                        linkedField, useDate)
                    if dynPropValueToDel is not None:
                        session.delete(dynPropValueToDel)

                session.commit()
                session.close()
            except:
                pass

    def splitFullPath(self, value):
        splitValue = value.split('>')[-1]
        return splitValue

    def getDefaultValue(self, resultat):
        defaultValues = {}
        recursive_level = resultat['recursive_level']
        for key, value in resultat['schema'].items():
            if 'defaultValue' in value and value['defaultValue'] is not None:
                defaultValues[key] = value['defaultValue']
            if 'subschema' in value:
                temp = {'schema': value['subschema'], 'defaultValues': {
                }, 'recursive_level': recursive_level + 1}
                subData = self.getDefaultValue(temp)
                resultat['schema'][key]['subschema']['defaultValues'] = subData

        if recursive_level < 1:
            resultat['schema']['defaultValues'] = defaultValues
        else:
            resultat = defaultValues
        return resultat
