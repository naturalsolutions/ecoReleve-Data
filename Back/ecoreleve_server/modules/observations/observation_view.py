from pyramid.view import view_config, view_defaults

from ecoreleve_server.core.base_view import CRUDCommonView, RestCollectionView
from .observation_resource import ObservationsResource


@view_defaults(context=ObservationsResource)
class ObservationsView(RestCollectionView):

    @view_config(name='batch', request_method='POST', renderer='json', permission='update')
    def batch(self):
        return self.context.batch()