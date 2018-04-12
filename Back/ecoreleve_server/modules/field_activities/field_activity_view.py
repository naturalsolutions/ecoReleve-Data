from pyramid.view import view_config, view_defaults

from ecoreleve_server.core.base_view import CRUDCommonView
from .field_activity_resource import FieldActivityResource


@view_defaults(context=FieldActivityResource)
class FieldActivityView(CRUDCommonView):

    @view_config(name='protocoleTypes', request_method='GET', renderer='json', permission='read')
    def getEquipment(self):
        return self.context.getProtocoleTypes()


        # self.actions = {'protocoleTypes': self.getProtocoleTypes,
        #                 }