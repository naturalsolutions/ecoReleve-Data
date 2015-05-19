from ecoreleve_server.Models import Base
from sqlalchemy import Column, DateTime, Float, ForeignKey, Index, Integer, Numeric, String, Text, Unicode, text,Sequence
from sqlalchemy.dialects.mssql.base import BIT
from sqlalchemy.orm import relationship
from collections import OrderedDict
from datetime import datetime
from .FrontModules import FrontModule,ModuleField
import transaction

Cle = {'String':'ValueString','Float':'ValueFloat','Date':'ValueDate','Integer':'ValueInt'}

class ObjectWithDynProp:


    def __init__(self,ObjContext):
        self.ObjContext = ObjContext
        self.PropDynValuesOfNow = {}
        #if self.ID != None :
        #   self.LoadNowValues()

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
        
    def GetSelfFKName(self):
        return 'FK_' + self.__tablename__ + 'DynProp'

    def GetSelfFKNameInValueTable(self):
        return 'FK_' + self.__tablename__
        
    def GetpkValue(self) :
        return self.ID
    
    def GetProperty(self,nameProp) :
        if hasattr(self,nameProp):
            return getattr(self,nameProp) 
        else:
            return self.PropDynValuesOfNow[nameProp]

    def SetProperty(self,nameProp,valeur) :
        if hasattr(self,nameProp):
            print(nameProp+'\n')
            setattr(self,nameProp,valeur)
            print(getattr(self,nameProp))
        else:
            if (nameProp in self.GetType().DynPropNames):
                if (nameProp not in self.PropDynValuesOfNow) or (str(self.PropDynValuesOfNow[nameProp]) != str(valeur)):
                    # on affecte si il y a une valeur et si elle est différente de la valeur existante
                    print('valeur modifiée pour ' + nameProp)
                    NouvelleValeur = self.GetNewValue(nameProp)
                    NouvelleValeur.StartDate = datetime.today()
                    setattr(NouvelleValeur,Cle[self.GetDynProps(nameProp).TypeProp],valeur)

                    self.PropDynValuesOfNow[nameProp] = valeur
                    self.GetDynPropValues().append(NouvelleValeur)

                else:
                    print('valeur non modifiée pour ' + nameProp)
                    return
            else :
                print('propriété inconnue ' + nameProp)
                # si la propriété dynamique existe déjà et que la valeur à affectée est identique à la valeur existente
                # => alors on insére pas d'historique car pas de chanegement

    def GetNewValue(self):      
        raise Exception("GetNewValue not implemented in children")
        
    def LoadNowValues(self):
        curQuery = 'select V.*, P.Name,P.TypeProp from ' + self.GetDynPropValuesTable() + ' V JOIN ' + self.GetDynPropTable() + ' P ON P.' + self.GetDynPropValuesTableID() + '= V.' + self.GetDynPropFKName() + ' where '
        curQuery += 'not exists (select * from ' + self.GetDynPropValuesTable() + ' V2 '
        curQuery += 'where V2.' + self.GetDynPropFKName() + ' = ' + self.GetDynPropFKName() + ' and V2.' + self.GetSelfFKName() + ' = V.' + self.GetSelfFKName() + ' '
        curQuery += 'AND V2.startdate > V.startdate)'
        curQuery +=  'and v.' + self.GetSelfFKNameInValueTable() + ' =  ' + str(self.GetpkValue() )
        Values = self.ObjContext.execute(curQuery).fetchall()

        for curValue in Values : 
            row = OrderedDict(curValue)
            self.PropDynValuesOfNow[row['Name']] = self.GetRealValue(row)
        print(self.PropDynValuesOfNow)

        
    def GetRealValue(self,row):
        return row[Cle[row['TypeProp']]]

    def UpdateFromJson(self,DTOObject):
        print('UpdateFromJson')
        print(DTOObject)
        for curProp in DTOObject:
            #print('Affectation propriété ' + curProp)
            if (curProp.lower() != 'id'):
                self.SetProperty(curProp,DTOObject[curProp])

    def GetFlatObject(self):
        resultat = {}
        # Get static Properties        
        for curStatProp in self.__table__.columns:

            resultat[curStatProp.key] = self.GetProperty(curStatProp.key)
        # Get static Properties            
        for curDynProp in self.PropDynValuesOfNow:
            resultat[curDynProp] = self.GetProperty(curDynProp)

        # Add TypeName in JSON
        resultat['TypeName'] = self.GetType().Name

        # TODO: manage foreign key
        #for curFK in self.__table__.foreign_keys:
        #   print(dir(curFK))
        return resultat

    def GetSchemaFromStaticProps(self,FrontModule,DisplayMode):
        Editable = (DisplayMode.lower()  == 'edit')
        resultat = {}
        for curStatProp in self.__table__.columns:
            curEditable = Editable
            print ('\n***************GetSchemaFromStaticProps***************************\n\n')

            type_ = self.GetType().ID
            CurModuleField = list(filter(lambda x : x.Name == curStatProp.key and x.TypeObj== str(type_) ,FrontModule.ModuleFields ))
            if (len(CurModuleField)> 0 ):
                # Conf définie dans FrontModule
                CurModuleField = CurModuleField[0]
                if (CurModuleField.FormRender & 2) == 0:
                    curEditable = False
                resultat[CurModuleField.Name] = CurModuleField.GetDTOFromConf(curEditable,str(ModuleField.GetClassFromSize(2)))
            else:
                    
                resultat[curStatProp.key] = {
                'Name': curStatProp.key,
                'type': 'Text',
                'title' : curStatProp.key,
                'editable' : curEditable,
                'editorClass' : 'form-control' ,
                'fieldClass' : ModuleField.GetClassFromSize(2)
                }

            
        return resultat
        
    def GetDTOWithSchema(self,FrontModule,DisplayMode):
        
        schema = self.GetSchemaFromStaticProps(FrontModule,DisplayMode)
        self.GetType().AddDynamicPropInSchemaDTO(schema,FrontModule,DisplayMode)
        if (DisplayMode.lower() != 'edit'):
            for curName in schema:
                schema[curName]['editorAttrs'] = { 'disabled' : True }
        resultat = {
            'schema':schema,
            'fieldsets' : self.GetType().GetFieldSets(FrontModule,schema)
        }

        if self.ID :
            data =   self.GetFlatObject()
            resultat['data'] = data
            resultat['data']['id'] = self.ID
        else :
            resultat['data'] = {'id':0}
        return resultat
