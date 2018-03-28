from ecoreleve_server.core.base_resource import *
from ecoreleve_server.modules.permissions import context_permissions
from ..sensor_model import Sensor

SensorDynPropValue = Sensor.DynamicValuesClass


class SensorValueResource(DynamicValueResource):
    model = SensorDynPropValue
    item = None

    def retrieve(self):
        pass


class SensorValuesResource(DynamicValuesResource):
    model = SensorDynPropValue
    item = SensorValueResource