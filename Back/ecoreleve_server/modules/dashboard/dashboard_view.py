from pyramid.view import view_config, view_defaults

from ecoreleve_server.core.base_view import CRUDCommonView
from .dashboard_resource import DashboardResource


@view_defaults(context=DashboardResource)
class DashboardView(CRUDCommonView):

    @view_config(name='availableSpace', renderer='json', permission='read')
    def getAvailableSpace(self):
        return self.context.getAvailableSpace()
