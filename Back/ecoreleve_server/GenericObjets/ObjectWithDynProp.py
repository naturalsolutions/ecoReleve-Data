from ecoreleve_server.Models import Base
from sqlalchemy import Column, DateTime, Float, ForeignKey, Index, Integer, Numeric, String, Text, Unicode, text,Sequence
from sqlalchemy.dialects.mssql.base import BIT
from sqlalchemy.orm import relationship
from collections import OrderedDict
from datetime import datetime

class ObjectWithDynProp:


    def __init__(self,ObjContext):
        self.Cle = {'String':'ValueString','Float':'ValueFloat','Date':'ValueDate','Integer':'ValueInt'}        
        self.ObjContext = ObjContext
        self.PropDynValuesOfNow = {}
        self.LoadNowValues()
    
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
    
    def LoadNowValues(self):
        self.PropDynValuesOfNow = None
        raise Exception("LoadNowValues not implemented in children")
        
    def GetProperty(self,nameProp) :
        if hasattr(self,nameProp):
            return getattr(self,nameProp) 
        else:
            return self.PropDynValuesOfNow[nameProp]

    def SetProperty(self,nameProp,valeur) :
        if hasattr(self,nameProp):
            setattr(self,nameProp,valeur)
        else:
            if (nameProp not in self.PropDynValuesOfNow) or (self.PropDynValuesOfNow[nameProp] != valeur) :
                # on affecte si il y a une valeur et si elle est différente de la valeur existante
                print('valeur modifiée pour ' + nameProp)
                NouvelleValeur = self.GetNewValue(nameProp)
                NouvelleValeur.StartDate = datetime.today()
                setattr(NouvelleValeur,self.Cle[self.GetDynProps(nameProp).TypeProp],valeur)

                self.PropDynValuesOfNow[nameProp] = valeur
                self.GetDynPropValues().append(NouvelleValeur)
            else:
                print('valeur non modifiée pour ' + nameProp)
                return
                # si la propriété dynamique existe déjà et que la valeur à affectée est identique à la valeur existente
                # => alors on insére pas d'historique car pas de chanegement

    def GetNewValue(self):      
        raise Exception("GetNewValue not implemented in children")
        
    def LoadNowValues(self):
        curQuery = 'select * from ' + self.GetDynPropValuesTable() + ' V JOIN ' + self.GetDynPropTable() + ' P ON P.' + self.GetDynPropValuesTableID() + '= V.' + self.GetDynPropFKName() + ' where '
        curQuery += 'not exists (select * from ' + self.GetDynPropValuesTable() + ' V2 '
        curQuery += 'where V2.' + self.GetDynPropFKName() + ' = ' + self.GetDynPropFKName() + ' and V2.' + self.GetSelfFKName() + ' = V.' + self.GetSelfFKName() + ' '
        curQuery += 'AND V2.startdate > V.startdate)'
        curQuery +=  'and v.' + self.GetSelfFKNameInValueTable() + ' =  ' + str(self.GetpkValue() )
        print (curQuery)
        Values = self.ObjContext.execute(curQuery).fetchall()

        for curValue in Values : 
            print(curValue)
            row = OrderedDict(curValue)
            self.PropDynValuesOfNow[row['Name']] = self.GetRealValue(row)
        print(self.PropDynValuesOfNow)
    def GetRealValue(self,row):
        return row[self.Cle[row['TypeProp']]]
    def UpdateFromJson(self,DTOObject):
        for curProp in DTOObject:
            print('Affectation propriété ' + curProp)
            print(DTOObject[curProp])
            self.SetProperty(curProp,DTOObject[curProp])
    def GetFlatObject(self):
        resultat = {}
        # Get static Properties        
        for curStatProp in self.__table__.columns:
            print(curStatProp.key)
            resultat[curStatProp.key] = self.GetProperty(curStatProp.key)
        # Get static Properties            
        for curDynProp in self.PropDynValuesOfNow:
            print(curDynProp)
            resultat[curDynProp] = self.GetProperty(curDynProp)

        # Add TypeName in JSON
        resultat['TypeName'] = self.GetType().Name

        # TODO: manage foreign key
        #for curFK in self.__table__.foreign_keys:
        #   print(dir(curFK))


        return resultat

    def GetSchemaFromStaticProps(self):
        resultat = {}
        for curStatProp in self.__table__.columns:
            print(curStatProp.key)
            resultat[curStatProp.key] = {
                'Name': curStatProp.key,
                'type':'String',
                'title' : curStatProp.key,
                'editable' : True
            }
            return resultat
        
    def GetDTOWithSchema(self):
        schema = self.GetSchemaFromStaticProps()
        self.GetType().AddDynamicPropInSchemaDTO(schema)
        resultat = {
            'schema':schema,
            'data' : self.GetFlatObject()
        }
        return resultat