from pyramid.view import view_config, view_defaults

from ecoreleve_server.core.base_view import IRestItemView, IRestCollectionView
from .individual_resource import IndividualResource, IndividualsResource, IndividualLocationsResource


@view_defaults(context=IndividualResource)
class IndividualView:

    @view_config(name='equipment', request_method='GET', renderer='json')
    def getEquipment(self):
        return self.context.getEquipment()


@view_defaults(context=IndividualLocationsResource)
class IndividualLocationsView:

    @view_config(name='getFields', request_method='GET', renderer='json')
    def getFieldsLoc(self):
        return self.context.getFieldsLoc()
