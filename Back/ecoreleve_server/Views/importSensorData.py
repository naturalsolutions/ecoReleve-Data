# # HEAD
# #=======

# from array import array
# from ..Models import Base, dbConfig
# # a142b3fa06ae6cdf29bc2e3c25aea176e56c7b7d
# from pyramid.view import view_config
# from .argosImport import uploadFileArgos
# from .GSMimport import uploadFilesGSM
# from .RFIDimport import uploadFileRFID
# from .CamTrapimport import uploadFileCamTrapResumable, concatChunk
# import os
# import sys
# from pyramid.response import Response
# from ..controllers.security import routes_permission


# route_prefix = 'sensors/'

# # HEAD


# # @view_config(route_name=route_prefix + 'datas',
# #              renderer='json',
# #              request_method='POST',
# #              match_param='type=rfid',
# #              permission=routes_permission['rfid']['POST'])
# # @view_config(route_name=route_prefix + 'datas',
# #              renderer='json',
# #              request_method='POST',
# #              match_param='type=gsm',
# #              permission=routes_permission['gsm']['POST'])
# # @view_config(route_name=route_prefix + 'datas',
# #              renderer='json',
# #              request_method='POST',
# #              match_param='type=argos',
# #              permission=routes_permission['argos']['POST'])
# # @view_config(route_name=route_prefix + 'datas',
# #              renderer='json',
# #              request_method='POST',
# #              match_param='type=concat',
# #              permission=routes_permission['rfid']['POST'])
# # @view_config(route_name=route_prefix + 'datas',
# #              renderer='json',
# #              request_method='POST',
# #              match_param='type=resumable',
# #              permission=routes_permission['rfid']['POST'])
# def uploadFile(request):
#     type_ = request.matchdict['type']
#     dictFuncImport = {
#         'argos': uploadFileArgos,
#         'gsm': uploadFilesGSM,
#         'rfid': uploadFileRFID,
#         'resumable': uploadFileCamTrapResumable,
#         'concat': concatChunk,
#         '1': checkStatut
#     }
#     return dictFuncImport[type_](request)


# # @view_config(route_name=route_prefix + 'datas', renderer='json', request_method='GET')
# def checkChunk(request):
#     pathPrefix = dbConfig['camTrap']['path']
#     fileName = str(request.params['resumableIdentifier']) + \
#         "_" + str(request.params['resumableChunkNumber'])

#     if not os.path.isfile(pathPrefix + '\\' + request.params['path'] + '\\' + str(fileName)):
#         return Response(status=204)
#     else:
#         # possible pb prog para ne pas uploader le meme fichier depuis 2 pc different
#         # vefif la taille du fichier et on supprime le chunk si elle différe
#         sizeOnServer = int(os.path.getsize(
#             pathPrefix + '\\' + request.params['path'] + '\\' + str(fileName)))
#         sizeExpected = int(request.params['resumableCurrentChunkSize'])
#         if sizeOnServer != sizeExpected:
#             os.remove(pathPrefix + '\\' +
#                       request.params['path'] + '\\' + str(fileName))
#             return Response(status=204)
#         else:
#             return Response(status=200)



