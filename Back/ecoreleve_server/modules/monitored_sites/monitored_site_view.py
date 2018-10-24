from pyramid.view import view_config, view_defaults

from ecoreleve_server.core.base_view import CRUDCommonView
from .monitored_site_resource import MonitoredSiteResource, MonitoredSitesResource


@view_defaults(context=MonitoredSiteResource)
class MonitoredSiteView(CRUDCommonView):

    @view_config(name='equipment', request_method='GET', renderer='json', permission='read')
    def getEquipment(self):
        return self.context.getEquipment()

    @view_config(name='stations', request_method='GET', renderer='json', permission='read')
    def getStations(self):
        return self.context.getStations()


