from ecoreleve_server.core.base_resource import *
from ..individual_model import Individual
from ecoreleve_server.modules.permissions import context_permissions

IndividualDynPropValue = Individual.DynamicValuesClass


class IndividualValueResource(DynamicValueResource):
    model = IndividualDynPropValue

    def retrieve(self):
        pass

class IndividualValuesResource(DynamicValuesResource):
    model = IndividualDynPropValue
    children = [('{int}', IndividualValueResource)]