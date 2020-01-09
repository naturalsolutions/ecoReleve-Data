from pyramid.view import view_config, view_defaults

from ecoreleve_server.core.base_view import CRUDCommonView, RestCollectionView
from .station_resource import StationResource, StationsResource


@view_defaults(context=StationsResource)
class StationsView(RestCollectionView):

    @view_config(
        name='updateSiteLocation',
        request_method='GET',
        renderer='json',
        permissions='admin'
    )
    def updateMonitoredSite(self):
        return self.context.updateMonitoredSite()

    @view_config(
        name='importGPX',
        request_method='GET',
        renderer='json',
        permissions='read'
    )
    def getFormImportGPX(self):
        return self.context.getFormImportGPX()

    @view_config(
        name='fieldActivity',
        request_method='GET',
        renderer='json',
        permissions='read'
    )
    def getFieldActivityList(self):
        return self.context.getFieldActivityList()

    @view_config(
        name='deleteMany',
        request_method='POST',
        renderer='json',
        permissions='delete'
    )
    def deleteMany(self):
        return self.context.deleteMany()

    @view_config(
        name='deleteStationWithCamTrap',
        request_method='POST',
        renderer='json',
        permissions='delete'
    )
    def deleteStationWithCamTrap(self):
        return self.context.deleteStationWithCamTrap()

    @view_config(
        name='deleteManyWithCamTrap',
        request_method='POST',
        renderer='json',
        permissions='delete'
    )
    def deleteManyWithCamtrap(self):
        return self.context.deleteManyWithCamTrap()

    @view_config(
        name='insertWithCamTrap',
        request_method='POST',
        renderer='json',
        permissions='create'
    )
    def insertWithCamTrap(self):
        return self.context.insertWithCamTrap()

    @view_config(
        name='insertAllWithCamTrap',
        request_method='POST',
        renderer='json',
        permissions='create'
    )
    def insertAllWithCamTrap(self):
        return self.context.insertAllWithCamTrap()

    @view_config(
        name='insertAll',
        request_method='POST',
        renderer='json',
        permission="create"
    )
    def insertAll(self):
        return self.context.insertAll()
