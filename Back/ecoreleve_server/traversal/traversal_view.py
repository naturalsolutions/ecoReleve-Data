from pyramid.view import view_config, view_defaults


@view_defaults(route_name='myTraversal')
class TraversalRESTView(object):
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
        return self.context.patch()

    @view_config(request_method='PUT', renderer='json', permission='update')
    def put(self):
        return self.context.update()
