from pyramid.view import view_config, view_defaults

from ecoreleve_server.core.base_view import CRUDCommonView, RestCollectionView
from .station_resource import StationResource, StationsResource


@view_defaults(context=StationsResource)
class StationsView(RestCollectionView):

    @view_config(name='updateSiteLocation', request_method='GET', renderer='json')
    def updateMonitoredSite(self):
        return self.context.updateMonitoredSite()

    @view_config(name='importGPX', request_method='GET', renderer='json')
    def getFormImportGPX(self):
        return self.context.getFormImportGPX()

    @view_config(name='fieldActivity', request_method='GET', renderer='json')
    def getFieldActivityList(self):
        return self.context.getFieldActivityList()