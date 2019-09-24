from ecoreleve_server.formbuilder.formbuilder_ressource import FormBuilderRessource,MetaRootRessource


def root_factory_formbuilder(request):

    return MetaRootRessource('',None,request)
