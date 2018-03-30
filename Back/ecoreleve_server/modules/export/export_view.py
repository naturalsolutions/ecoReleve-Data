from pyramid.view import view_config, view_defaults

from ecoreleve_server.core.base_view import RestCollectionView
from .export_resource import ExportQueryResource

@view_defaults(context=ExportQueryResource)
class ExportQueryView(RestCollectionView):
    
    @view_config(name='getFilters', renderer='json', request_method='GET', permission='read')
    def getFilters(self):
        return self.context.getFilters()

    @view_config(name='getFields', renderer='json', request_method='GET', permission='read')
    def getFields(self):
        return self.context.getFields()

    # @view_config(name='csv', request_method='GET', permission='read')
    # def export_csv(self):
    #     return self.context.export_csv()

    # @view_config(name='pdf', request_method='GET', permission='read')
    # def export_pdf(self):
    #     return self.context.export_pdf()

    # @view_config(name='gpx', request_method='GET', permission='read')
    # def export_gpx(self):
    #     return self.context.export_gpx()

    # @view_config(name='excel', request_method='GET', permission='read')
    # def export_excel(self):
    #     return self.context.export_excel()

    @view_config(name='getFile', renderer='json', request_method='GET', permission='read')
    def getFile(self):
        return self.context.getFile()

        # self.actions = {'getFields': self.getFields,
        #                 'getFilters': self.getFilters,
        #                 'count': self.count_,
        #                 'csv': self.export_csv,
        #                 'pdf': self.export_pdf,
        #                 'gpx': self.export_gpx,
        #                 'excel': self.export_excel,
        #                 'getFile': self.getFile
        #                 }