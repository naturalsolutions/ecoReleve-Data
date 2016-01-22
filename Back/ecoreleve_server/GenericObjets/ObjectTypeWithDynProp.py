from ..Models import Base,DynPropNames,DBSession
from sqlalchemy import Column, DateTime, Float, ForeignKey, Index, Integer, Numeric, String, Text, Unicode, text,Sequence,or_
from sqlalchemy.dialects.mssql.base import BIT
from sqlalchemy.orm import relationship
from collections import OrderedDict
from datetime import datetime
from .FrontModules import FrontModules,ModuleForms
from pyramid import threadlocal

# DynPropType = {'string':'Text','float':'Text','date':'Date','integer':'Text','int':'Text'}

class ObjectTypeWithDynProp:
    ''' Class to extend for mapped object type with dynamic props'''

    def __init__(self,ObjContext=None):
        self.ObjContext = threadlocal.get_current_request().dbsession
        self.DynPropNames = self.GetDynPropNames()

    def GetDynPropContextTable(self):
        if self.__tablename__ in DynPropNames and 'DynPropContextTable' in DynPropNames[self.__tablename__] :
            return DynPropNames[self.__tablename__]['DynPropContextTable']
        else :
            return self.__tablename__ + '_' + self.__tablename__.replace('Type','') + 'DynProp'

    def GetFK_DynPropContextTable(self):
        if self.__tablename__ in DynPropNames and 'FK_DynPropContextTable' in DynPropNames[self.__tablename__] :
            return DynPropNames[self.__tablename__]['FK_DynPropContextTable']
        else :
            return 'FK_' + self.__tablename__

    def GetDynPropTable(self):
        if self.__tablename__ in DynPropNames and 'DynPropTable' in DynPropNames[self.__tablename__] :
            return DynPropNames[self.__tablename__]['DynPropTable']
        else :
            return self.__tablename__.replace('Type','') + 'DynProp'

    def Get_FKToDynPropTable(self):
        if self.__tablename__ in DynPropNames and 'FKToDynPropTable' in DynPropNames[self.__tablename__] :
            return DynPropNames[self.__tablename__]['FKToDynPropTable']
        else :
            return 'FK_' + self.__tablename__.replace('Type','') + 'DynProp'        

    def AddDynamicPropInSchemaDTO(self,SchemaDTO,FrontModules,DisplayMode):
        ''' return schema of dynamic props according to object type and configuration in table : FrontModules > ModuleForms '''
        Editable = (DisplayMode.lower()  == 'edit')
        Fields = self.ObjContext.query(ModuleForms
            ).filter(ModuleForms.Module_ID == FrontModules.ID
            ).filter(or_(ModuleForms.TypeObj == self.ID, ModuleForms.TypeObj == None)
            ).filter(ModuleForms.FormRender > 0).all()

        for CurModuleForms in Fields :
            SchemaDTO[CurModuleForms.Name] = CurModuleForms.GetDTOFromConf(Editable)

    def GetDynPropNames(self):
        curQuery = 'select D.Name from ' + self.GetDynPropContextTable() + ' C  JOIN ' + self.GetDynPropTable() + ' D ON C.' + self.Get_FKToDynPropTable() + '= D.ID '
        #curQuery += 'not exists (select * from ' + self.GetDynPropValuesTable() + ' V2 '
        curQuery += ' where C.' + self.GetFK_DynPropContextTable() + ' = ' + str(self.ID )
        Values = self.ObjContext.execute(curQuery).fetchall()
        resultat = []
        for curValue in Values : 
           resultat.append(curValue['Name'].lower())
        return resultat

    def GetDynProps(self):
        curQuery = 'select D.Name , D.TypeProp from ' + self.GetDynPropContextTable() + ' C  JOIN ' + self.GetDynPropTable() + ' D ON C.' + self.Get_FKToDynPropTable() + '= D.ID '
        #curQuery += 'not exists (select * from ' + self.GetDynPropValuesTable() + ' V2 '
        curQuery += ' where C.' + self.GetFK_DynPropContextTable() + ' = ' + str(self.ID )
        Values = self.ObjContext.execute(curQuery).fetchall()
        return Values

    def GetFieldSets(self,FrontModules,Schema) :
        ''' return ordered FiledSet according to configuration '''
        fields = []
        resultat = []
        Fields = self.ObjContext.query(ModuleForms
            ).filter(ModuleForms.Module_ID == FrontModules.ID
            ).filter(or_(ModuleForms.TypeObj == self.ID, ModuleForms.TypeObj == None)).all()
   
        Legends = sorted ([(obj.Legend,obj.FormOrder,obj.Name)for obj in Fields if obj.FormOrder is not None], key = lambda x : x[1])
        # Legend2s = sorted ([(obj.Legend)for obj in Fields if obj.FormOrder is not None ], key = lambda x : x[1])

        Unique_Legends = list()
        # Get distinct Fieldset in correct order
        for x in Legends:
            if x[0] not in Unique_Legends:
                Unique_Legends.append(x[0])
        
        for curLegend in Unique_Legends:
            curFieldSet = {'fields' :[],'legend' : curLegend}
            resultat.append(curFieldSet)

        for curProp in Legends:
            curIndex = Unique_Legends.index(curProp[0])
            resultat[curIndex]['fields'].append(curProp[2])

        # list_of_subschema = list(filter(lambda x : 'subschema' in Schema[x] ,Schema))
        # if len(list_of_subschema) >0 :
        #     for subName in list_of_subschema :
        #         print(subName)
        #         Schema[subName]['fieldsets'] = self.GetFieldSets(FrontModules,Schema[subName]['subschema'])

        return resultat


