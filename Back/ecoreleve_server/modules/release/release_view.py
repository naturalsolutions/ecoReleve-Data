from pyramid.view import view_config, view_defaults

from ecoreleve_server.core.base_view import CRUDCommonView, RestCollectionView
from .release_resource import ReleaseIndividualsResource, ReleaseResource


@view_defaults(context=ReleaseResource)
class ReleaseView(RestCollectionView):

    @view_config(name='getReleaseMethod', request_method='GET', renderer='json')
    def getReleaseMethod(self):
        return self.context.getReleaseMethod()

# @view_defaults(context=ReleaseIndividualsResource)
# class ReleaseIndividualsView(RestCollectionView):
#     pass
