# # from ..Models import DynPropNames
# from sqlalchemy import or_
# from .FrontModules import ModuleForms
# from pyramid import threadlocal

# # DynPropType = {'string':'Text','float':'Text','date':'Date','integer':'Text','int':'Text'}


# class ObjectTypeWithDynProp:
#     ''' Class to extend for mapped object type with dynamic props'''

#     def __init__(self, session=None):
#         self.session = threadlocal.get_current_request().dbsession
#         self.DynPropNames = self.GetDynPropNames()

#     def GetDynPropContextTable(self):
#         if self.__tablename__ in DynPropNames and 'DynPropContextTable' in DynPropNames[self.__tablename__]:
#             return DynPropNames[self.__tablename__]['DynPropContextTable']
#         else:
#             return self.__tablename__ + '_' + self.__tablename__.replace('Type', '') + 'DynProp'

#     def GetFK_DynPropContextTable(self):
#         if self.__tablename__ in DynPropNames and 'FK_DynPropContextTable' in DynPropNames[self.__tablename__]:
#             return DynPropNames[self.__tablename__]['FK_DynPropContextTable']
#         else:
#             return 'FK_' + self.__tablename__

#     def GetDynPropTable(self):
#         if self.__tablename__ in DynPropNames and 'DynPropTable' in DynPropNames[self.__tablename__]:
#             return DynPropNames[self.__tablename__]['DynPropTable']
#         else:
#             return self.__tablename__.replace('Type', '') + 'DynProp'

#     def Get_FKToDynPropTable(self):
#         if self.__tablename__ in DynPropNames and 'FKToDynPropTable' in DynPropNames[self.__tablename__]:
#             return DynPropNames[self.__tablename__]['FKToDynPropTable']
#         else:
#             return 'FK_' + self.__tablename__.replace('Type', '') + 'DynProp'

#     def AddDynamicPropInSchemaDTO(self, SchemaDTO, FrontModules, DisplayMode):
#         ''' return schema of dynamic props according to object type
#         and configuration in table : FrontModules > ModuleForms '''
#         Editable = (DisplayMode.lower() == 'edit')
#         Fields = self.session.query(ModuleForms
#                                        ).filter(
#             ModuleForms.Module_ID == FrontModules.ID
#         ).filter(
#             or_(ModuleForms.TypeObj == self.ID, ModuleForms.TypeObj == None)
#         ).filter(ModuleForms.FormRender > 0).filter(
#             ModuleForms.InputType != 'GridRanged').all()

#         for CurModuleForms in Fields:
#             SchemaDTO[CurModuleForms.Name] = CurModuleForms.GetDTOFromConf(
#                 DisplayMode.lower())

#     def GetDynPropNames(self):
#         curQuery = 'select D.Name from ' + self.GetDynPropContextTable() + ' C  JOIN ' + \
#             self.GetDynPropTable() + ' D ON C.' + self.Get_FKToDynPropTable() + '= D.ID '
#         curQuery += ' where C.' + self.GetFK_DynPropContextTable() + ' = ' + \
#             str(self.ID)
#         Values = self.session.execute(curQuery).fetchall()
#         resultat = []
#         for curValue in Values:
#             resultat.append(curValue['Name'].lower())
#         return resultat

#     def GetDynProps(self):
#         curQuery = 'select D.ID, D.Name , D.TypeProp from ' + self.GetDynPropContextTable() + \
#             ' C  JOIN ' + self.GetDynPropTable() + ' D ON C.' + \
#             self.Get_FKToDynPropTable() + '= D.ID '
#         curQuery += ' where C.' + self.GetFK_DynPropContextTable() + ' = ' + \
#             str(self.ID)
#         Values = self.session.execute(curQuery).fetchall()
#         return Values
