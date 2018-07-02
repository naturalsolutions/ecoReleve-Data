from pyramid.view import view_config, view_defaults

from ecoreleve_server.core.base_view import CRUDCommonView, RestCollectionView
from .region_resource import RegionsResource, RegionResource


@view_defaults(context=RegionsResource)
class RegionsView(RestCollectionView):

    @view_config(name='getGeomFromType', request_method='GET', renderer='json')
    def getGeomFromType(self):
        return self.context.getGeomFromType()

    @view_config(name='getTypes', request_method='GET', renderer='json')
    def getRegionTypes(self):
        return self.context.getRegionTypes()

    @view_config(name='autocomplete', request_method='GET', renderer='json')
    def autocomplete(self):
        return self.context.autocomplete()


@view_defaults(context=RegionResource)
class RegionView(CRUDCommonView):

    @view_config(name='geoJSON', request_method='GET', renderer='json')
    def getGeoJson(self):
        return self.context.getGeoJson()
