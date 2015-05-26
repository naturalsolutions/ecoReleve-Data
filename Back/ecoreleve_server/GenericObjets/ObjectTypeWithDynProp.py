from ecoreleve_server.Models import Base,DynPropNames
from sqlalchemy import Column, DateTime, Float, ForeignKey, Index, Integer, Numeric, String, Text, Unicode, text,Sequence
from sqlalchemy.dialects.mssql.base import BIT
from sqlalchemy.orm import relationship
from collections import OrderedDict
from datetime import datetime
from .FrontModules import FrontModule,ModuleField


DynPropType = {'string':'Text','float':'Text','date':'Date','integer':'Text','int':'Text'}

class ObjectTypeWithDynProp:


    def __init__(self,ObjContext):
        print('Init ObjTyoe')
        self.ObjContext = ObjContext
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

    def AddDynamicPropInSchemaDTO(self,SchemaDTO,FrontModule,DisplayMode):
        curQuery = 'select * from ' + self.GetDynPropContextTable() + ' C  JOIN ' + self.GetDynPropTable() + ' D ON C.' + self.Get_FKToDynPropTable() + '= D.ID '
        if self.ID :
            curQuery += ' where C.' + self.GetFK_DynPropContextTable() + ' = ' + str(self.ID )

        Values = self.ObjContext.execute(curQuery).fetchall()
        Editable = (DisplayMode.lower()  == 'edit')
        Fields = self.ObjContext.query(ModuleField).filter(ModuleField.FK_FrontModule == FrontModule.ID).all()
        
        for curValue in Values : 
            curEditable = Editable
            CurModuleField = list(filter(lambda x : x.Name == curValue['Name'], Fields))
            if (len(CurModuleField)> 0 ):
                # Conf définie dans FrontModule                
                CurModuleField = CurModuleField[0]
                # TODO : Gestion champ read ONly
                if (CurModuleField.FormRender & 2) == 0:
                    curEditable = False
                
                SchemaDTO[curValue['Name']] = CurModuleField.GetDTOFromConf(curEditable,ModuleField.GetClassFromSize(CurModuleField.FieldSize))
            else:
                SchemaDTO[curValue['Name']] = {
                'Name': curValue['Name'],
                'type':DynPropType[str(curValue['TypeProp']).lower()],
                'title' : curValue['Name'],
                'editable' : curEditable,
                'editorClass' : 'form-control' ,
                'fieldClass' : ModuleField.GetClassFromSize(2)
                }
           
    def GetDynPropNames(self):
        curQuery = 'select D.Name from ' + self.GetDynPropContextTable() + ' C  JOIN ' + self.GetDynPropTable() + ' D ON C.' + self.Get_FKToDynPropTable() + '= D.ID '
        #curQuery += 'not exists (select * from ' + self.GetDynPropValuesTable() + ' V2 '
        curQuery += ' where C.' + self.GetFK_DynPropContextTable() + ' = ' + str(self.ID )
        Values = self.ObjContext.execute(curQuery).fetchall()

        resultat = {}
        for curValue in Values : 
           resultat[curValue['Name']] = curValue
        return resultat

    def GetFieldSets(self,FrontModule,Schema) :
        Legends = FrontModule.Legends.split(';')
        fields = []
        resultat = []
        for i in range(len(Legends)):
            resultat.append({'fields':[],'legend':Legends[i]})

        Fields = self.ObjContext.query(ModuleField).filter(ModuleField.FK_FrontModule == FrontModule.ID).all()
        for curProp in Schema:
            CurModuleField = list(filter(lambda x : x.Name == curProp,Fields))
            if (len(CurModuleField)> 0 ):
                CurModuleField = CurModuleField[0]
                curIndex = Legends.index(CurModuleField.Legend)
                resultat[curIndex]['fields'].insert(CurModuleField.FormOrder,CurModuleField.Name)
            else:
                resultat[0]['fields'].append(curProp)


        return resultat


