from .sensor_data import (
    SensorDatasBySessionItem,
    DATASubDatasBySession,
    SensorDatasBySession,
    SensorDatasByType,
    SensorDatas
)
from .sensor_history import (
    SensorValueResource,
    SensorValuesResource
)
from .sensor_collection import (
    SensorCollection
)
from .sensor_resource import (
    SensorsResource,
    SensorResource
)
from ecoreleve_server.core import RootCore

__all__ = [
    "SensorCollection",
    "SensorResource",
    "SensorsResource",
    "SensorDatas",
    "SensorDatasBySessionItem",
    "SensorDatasByType",
    "SensorDatasBySession",
    "DATASubDatasBySession",
    "SensorValuesResource"
    "SensorValueResource",
]


def includeme(config):
    RootCore.children.append(('sensors', SensorsResource))
    config.include(".sensor_data")
    config.scan(".sensor_view")
