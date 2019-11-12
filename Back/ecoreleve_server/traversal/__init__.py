from ecoreleve_server.traversal.traversal_ressource import TraversalRessource
from .traversal_view import TraversalRESTView

def root_factory_traversal(request):

    return TraversalRessource(name='', parent=None, request=request)