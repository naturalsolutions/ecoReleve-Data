from pyramid.view import view_config, view_defaults

from ecoreleve_server.core.base_view import CRUDCommonView
from .monitored_site_resource import MonitoredSiteResource, MonitoredSitesResource


@view_defaults(context=MonitoredSiteResource)
class MonitoredSiteView(CRUDCommonView):

    @view_config(name='equipment', request_method='GET', renderer='json', permission='read')
    def getEquipment(self):
        return self.context.getEquipment()
    
    # @view_config(name='history', request_method='GET', renderer='json', permission='read')
    # def history(self):
    #     return self.context.history()

    @view_config(name='stations', request_method='GET', renderer='json', permission='read')
    def getStations(self):
        return self.context.getStations()

    # @view_config(name='history/getFields', request_method='GET', renderer='json', permission='read')
    # def getGrid(self):
    #     return self.context.getGrid()


    # def __init__(self, ref, parent):
    #     DynamicObjectView.__init__(self, ref, parent)
        # self.actions = {'history': self.history,
        #                 'equipment': self.getEquipment,
        #                 'stations': self.getStations,
        #                 'getFields': self.getGrid,
        #                 'history': self.history}

    # def __getitem__(self, ref):
    #     if ref in self.actions:
    #         self.retrieve = self.actions.get(ref)
    #         return self
    #     return self

