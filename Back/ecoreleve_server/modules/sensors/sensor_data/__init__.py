from .sensor_data_resource import (
    SensorDatasBySessionItem,
    DATASubDatasBySession,
    SensorDatasBySession,
    SensorDatasByType,
    SensorDatas
)
from ecoreleve_server.core import RootCore

__all__ = [
    "SensorDatasBySessionItem",
    "DATASubDatasBySession",
    "SensorDatasBySession",
    "SensorDatasByType",
    "SensorDatas"
]


def includeme(config):
    RootCore.children.append(('sensorDatas', SensorDatas))
    config.scan(".sensor_data_view")
