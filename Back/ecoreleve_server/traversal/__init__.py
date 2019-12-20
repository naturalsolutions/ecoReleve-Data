from ecoreleve_server.traversal.traversal_ressource import TraversalRessource
from .traversal_view import TraversalRESTView


def root_factory_traversal(request):

    return TraversalRessource(name='', parent=None, request=request)


def includeme(config):
    config.add_route(
        'myTraversal',
        'ecoReleve-Core/traversal*traverse',
        factory='ecoreleve_server.traversal.root_factory_traversal'
    )
    config.add_view(TraversalRESTView, route_name='myTraversal')