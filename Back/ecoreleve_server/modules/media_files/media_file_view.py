from pyramid.view import view_defaults, view_config

from ecoreleve_server.core.base_view import CRUDCommonView
from .media_file_resource import MediaFilesResource


@view_defaults(context=MediaFilesResource)
class MediaFilesView(CRUDCommonView):
    
    @view_config(name='upload', request_method='POST', permission='create', renderer='json')
    def upload(self):
        return self.context.upload()
    #     # self.actions = {
    #     #                 'upload': self.upload
    #     #                 }