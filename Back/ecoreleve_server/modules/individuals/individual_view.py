from pyramid.view import view_config, view_defaults

from ecoreleve_server.core.base_view import CRUDCommonView
from .individual_resource import IndividualResource, IndividualsResource, IndividualLocationsResource


@view_defaults(context=IndividualResource)
class IndividualView(CRUDCommonView):

    @view_config(name='equipment', request_method='GET', renderer='json', permission='read')
    def getEquipment(self):
        return self.context.getEquipment()

