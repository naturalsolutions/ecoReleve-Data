from ..Models import Base,DynPropNames,DBSession
from sqlalchemy import Column, DateTime, Float, ForeignKey, Index, Integer, Numeric, String, Text, Unicode, text,Sequence,or_
from sqlalchemy.dialects.mssql.base import BIT
from sqlalchemy.orm import relationship
from collections import OrderedDict
from datetime import datetime
from .FrontModules import FrontModules,ModuleForms

DynPropType = {'string':'Text','float':'Text','date':'Date','integer':'Text','int':'Text'}

class ObjectTypeWithDynProp:
    ''' Class to extend for mapped object type with dynamic props'''

    def __init__(self,ObjContext):
        self.ObjContext = DBSession
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
        curQuery = 'select * from ' + self.GetDynPropContextTable() + ' C  JOIN ' + self.GetDynPropTable() + ' D ON C.' + self.Get_FKToDynPropTable() + '= D.ID '
        if self.ID :
            curQuery += ' where C.' + self.GetFK_DynPropContextTable() + ' = ' + str(self.ID )

        Values = self.ObjContext.execute(curQuery).fetchall()
        Editable = (DisplayMode.lower()  == 'edit')
        Fields = self.ObjContext.query(ModuleForms
            ).filter(ModuleForms.Module_ID == FrontModules.ID
            ).filter(or_(ModuleForms.TypeObj == self.ID, ModuleForms.TypeObj == None)).all()

        for CurModuleForms in Fields : 
            curEditable = Editable
            #CurModuleForms = list(filter(lambda x : x.Name == curValue['Name'], Fields))
            #if (len(CurModuleForms)> 0 ):
                # Conf définie dans FrontModules
            #CurModuleForms = CurModuleForms[0]

                # TODO : Gestion champ read ONly
            curSize = CurModuleForms.FieldSizeDisplay
            if curEditable:
                curSize = CurModuleForms.FieldSizeEdit
            if (CurModuleForms.FormRender & 2) == 0:
                curEditable = False
            SchemaDTO[CurModuleForms.Name] = CurModuleForms.GetDTOFromConf(curEditable,ModuleForms.GetClassFromSize(curSize))


    def GetDynPropNames(self):
        curQuery = 'select D.Name from ' + self.GetDynPropContextTable() + ' C  JOIN ' + self.GetDynPropTable() + ' D ON C.' + self.Get_FKToDynPropTable() + '= D.ID '
        #curQuery += 'not exists (select * from ' + self.GetDynPropValuesTable() + ' V2 '
        curQuery += ' where C.' + self.GetFK_DynPropContextTable() + ' = ' + str(self.ID )
        Values = self.ObjContext.execute(curQuery).fetchall()
        resultat = {}
        for curValue in Values : 
           resultat[curValue['Name']] = curValue
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
   
        Legends = sorted ([(obj.Legend,obj.FormOrder,obj.Name)for obj in Fields if obj.FormOrder is not None ], key = lambda x : x[1])
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
        return resultat


