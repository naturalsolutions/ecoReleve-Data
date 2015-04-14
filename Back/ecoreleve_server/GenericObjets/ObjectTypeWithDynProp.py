from ecoreleve_server.Models import Base
from sqlalchemy import Column, DateTime, Float, ForeignKey, Index, Integer, Numeric, String, Text, Unicode, text,Sequence
from sqlalchemy.dialects.mssql.base import BIT
from sqlalchemy.orm import relationship
from collections import OrderedDict
from datetime import datetime

class ObjectTypeWithDynProp:


    def __init__(self,ObjContext):
        self.ObjContext = ObjContext        

    def GetDynPropContextTable(self):
        return self.__tablename__ + '_' + self.__tablename__.replace('Type','') + 'DynProp'

    def GetFK_DynPropContextTable(self):
        return 'FK_' + self.__tablename__

    def GetDynPropTable(self):
        return self.__tablename__.replace('Type','') + 'DynProp'

    def Get_FKToDynPropTable(self):
        return 'FK_' + self.__tablename__.replace('Type','') + 'DynProp'        

    def AddDynamicPropInSchemaDTO(self,SchemaDTO):
        curQuery = 'select * from ' + self.GetDynPropContextTable() + ' C  JOIN ' + self.GetDynPropTable() + ' D ON C.' + self.Get_FKToDynPropTable() + '= D.ID '
        #curQuery += 'not exists (select * from ' + self.GetDynPropValuesTable() + ' V2 '
        curQuery += ' where C.' + self.GetFK_DynPropContextTable() + ' = ' + str(self.ID )
        print (curQuery)
        Values = self.ObjContext.execute(curQuery).fetchall()

        for curValue in Values : 
           print(curValue)
           SchemaDTO[curValue['Name']] = {
                'Name': curValue['Name'],
                'type':'String',
                'title' : curValue['Name'],
                'editable' : True
            }
           
        
        

