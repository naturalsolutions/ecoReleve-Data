from pyramid.view import view_config, view_defaults

from ecoreleve_server.core.base_view import RestCollectionView
from . import MonitoredSiteHistoryResource


@view_defaults(context=MonitoredSiteHistoryResource)
class MonitoredSiteHistoryView(RestCollectionView):

    @view_config(name='getFields', request_method='GET', renderer='json', permission='read')
    def getGrid(self):
        return self.context.getGrid()