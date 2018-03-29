from pyramid.view import view_config, view_defaults

from ecoreleve_server.core.base_view import RestCollectionView, CRUDCommonView
from .sensor_resource import SensorsResource, SensorResource


@view_defaults(context=SensorsResource)
class SensorsView(RestCollectionView):

    @view_config(name='getUnicIdentifier', request_method='GET', renderer='json')
    def getUnicIdentifier(self):
        return self.context.getUnicIdentifier()


@view_defaults(context=SensorResource)
class SensorView(CRUDCommonView):

    @view_config(name='equipment', request_method='GET', renderer='json')
    def getEquipment(self):
        return self.context.getEquipment()
