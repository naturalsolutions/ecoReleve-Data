
# from .OrmFactory import OrmFactory
# ModelFactory = OrmFactory()


# ****************** TEST ****************************
###### create Orm Mapped class from json config

# import json
# import os
# with open(os.path.dirname(__file__) + '/../db_config.json') as data_file:
#     storageConf = json.load(data_file)

# StationType = ModelFactory.StationType
# print(StationType)

# from functools import wraps


# def patch(myClass, methodType=None):
#     methodTypeDict = {'classmethod': classmethod,
#                       'staticmethod': staticmethod}
#     wrappingMethod = methodTypeDict.get(methodType, None)

#     def real_decorator(function):
#         if not wrappingMethod:
#             setattr(myClass, function.__name__,
#                     types.MethodType(function, myClass))
#         else:
#             setattr(myClass, function.__name__, wrappingMethod(function))
#     return real_decorator


# Alleluhia = ModelFactory.Alleluhia
# # print(Alleluhia)


# @patch(Alleluhia)
# def toto(self, hop):
#     print('toto', self.__dict__, hop)
#     return hop + ' __ ajouter !!!! '
# # print(r)
