from ecoreleve_server.Models import Base,DynPropNames,DBSession
from sqlalchemy import Column, DateTime, Float, ForeignKey, Index, Integer, Numeric, String, Text, Unicode, text,Sequence
from sqlalchemy.dialects.mssql.base import BIT
from sqlalchemy.orm import relationship
from collections import OrderedDict
from datetime import datetime
from .FrontModules import FrontModule,ModuleForm


DynPropType = {'string':'Text','float':'Text','date':'Date','integer':'Text','int':'Text'}

class ObjectTypeWithDynProp:


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

    def AddDynamicPropInSchemaDTO(self,SchemaDTO,FrontModule,DisplayMode):
        curQuery = 'select * from ' + self.GetDynPropContextTable() + ' C  JOIN ' + self.GetDynPropTable() + ' D ON C.' + self.Get_FKToDynPropTable() + '= D.ID '
        if self.ID :
            curQuery += ' where C.' + self.GetFK_DynPropContextTable() + ' = ' + str(self.ID )

        Values = self.ObjContext.execute(curQuery).fetchall()
        Editable = (DisplayMode.lower()  == 'edit')
        Fields = self.ObjContext.query(ModuleForm).filter(ModuleForm.FK_FrontModule == FrontModule.ID).all()
        
        for curValue in Values : 
            curEditable = Editable
            CurModuleForm = list(filter(lambda x : x.Name == curValue['Name'], Fields))
            if (len(CurModuleForm)> 0 ):
                # Conf définie dans FrontModule                
                CurModuleForm = CurModuleForm[0]
                # TODO : Gestion champ read ONly
                if (CurModuleForm.FormRender & 2) == 0:
                    curEditable = False
                
                SchemaDTO[curValue['Name']] = CurModuleForm.GetDTOFromConf(curEditable,ModuleForm.GetClassFromSize(CurModuleForm.FieldSizeEdit))
            else:
                SchemaDTO[curValue['Name']] = {
                'Name': curValue['Name'],
                'type':DynPropType[str(curValue['TypeProp']).lower()],
                'title' : curValue['Name'],
                'editable' : curEditable,
                'editorClass' : 'form-control' ,
                'fieldClass' : ModuleForm.GetClassFromSize(2),

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

    def GetDynProps(self):
        curQuery = 'select D.Name , D.TypeProp from ' + self.GetDynPropContextTable() + ' C  JOIN ' + self.GetDynPropTable() + ' D ON C.' + self.Get_FKToDynPropTable() + '= D.ID '
        #curQuery += 'not exists (select * from ' + self.GetDynPropValuesTable() + ' V2 '
        curQuery += ' where C.' + self.GetFK_DynPropContextTable() + ' = ' + str(self.ID )
        Values = self.ObjContext.execute(curQuery).fetchall()

        return Values

    def GetFieldSets(self,FrontModule,Schema) :
       
        fields = []
        other = []
        Fields = self.ObjContext.query(ModuleForm).filter(ModuleForm.FK_FrontModule == FrontModule.ID).all()
        Legends = sorted ([(obj.Legend,obj.FormOrder)for obj in Fields if obj.FormOrder is not None ], key = lambda x : x[1])

        Legends1= [obj[0] for obj in Legends] 
        Legends = sorted(set(Legends1), key = Legends1.index)
        

        resultat = list(Legends)
        Legends.append('Other')
        for curProp in Schema:
            CurModuleForm = list(filter(lambda x : x.Name == curProp,Fields))
            if (len(CurModuleForm)> 0 ):
                CurModuleForm = CurModuleForm[0]
                curIndex = Legends.index(CurModuleForm.Legend)
                try :
                    resultat[curIndex]['fields'].insert(CurModuleForm.FormOrder,CurModuleForm.Name)
                except :
                    resultat[curIndex] = {'fields' : [CurModuleForm.Name] , 'legend' : Legends[curIndex] }
            else:
                other.append(curProp)

        resultat.append({'fields':[],'legend':'Other'})
        for i in other :
            curIndex = Legends.index('Other')
            resultat[curIndex]['fields'].append(i)
        return resultat


