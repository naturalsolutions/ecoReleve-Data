from pyramid.httpexceptions import HTTPNotFound
from pyramid.view import view_config, view_defaults
from pyramid.security import NO_PERMISSION_REQUIRED
from zope.interface import Interface


class IRestCommonView(Interface):
    pass

class IRestCollectionView(IRestCommonView):
    pass

class IRestItemView(IRestCommonView):
    pass


@view_defaults(context=IRestCommonView)
class CRUDCommonView(object):
    def __init__(self, context, request):
        self.request = request
        self.context = context

    @view_config(request_method='GET', renderer='json', permission='read')
    def get(self):
        return self.context.retrieve()

    @view_config(request_method='POST', renderer='json', permission='create')
    def post(self):
        return self.context.create()

    @view_config(request_method='DELETE', renderer='json', permission='delete')
    def delete(self):
        return self.context.delete()

    @view_config(request_method='PATCH', renderer='json', permission='update')
    def patch(self):
        return self.context.update()

    @view_config(request_method='PUT', renderer='json', permission='update')
    def put(self):
        return self.context.update()


@view_defaults(context=IRestCollectionView)
class RestCollectionView(object):
    def __init__(self, context, request):
        self.request = request
        self.context = context

    @view_config(name='0', request_method='GET', renderer='json', permission='read')    
    @view_config(name='forms', request_method='GET', renderer='json', permission='read')
    def getForm(self):
        return self.context.getForm()

    @view_config(name='getFields', request_method='GET', renderer='json', permission='read')
    def getGrid(self):
        return self.context.getGrid()

    @view_config(name='getFilters', request_method='GET', renderer='json', permission='read')
    def getFilter(self):
        return self.context.getFilter()

    @view_config(name='getType', request_method='GET', renderer='json', permission='read')
    def getType(self):
        return self.context.getType()

    @view_config(name='export', request_method='GET', renderer='json', permission='read')
    def export(self):
        return self.context.export()

    @view_config(name='count', request_method='GET', renderer='json', permission='read')
    def count_(self):
        return self.context.count_()
