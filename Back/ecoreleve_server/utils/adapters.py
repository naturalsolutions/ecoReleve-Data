from shapely import wkt, wkb
from geojson import Feature, FeatureCollection, dumps


def datetime_adapter(obj, request):
    """Json adapter for datetime objects."""
    try:
        return obj.strftime('%d/%m/%Y %H:%M:%S')
    except:
        return obj.strftime('%d/%m/%Y')


def date_adapter(obj, request):
    """Json adapter for datetime objects."""
    try:
        return obj.strftime('%d/%m/%Y')
    except:
        return obj


def time_adapter(obj, request):
    """Json adapter for datetime objects."""
    try:
        return obj.strftime('%H:%M')
    except:
        return obj.strftime('%H:%M:%S')


def decimal_adapter(obj, request):
    """Json adapter for Decimal objects."""
    return float(obj)


def wkb_adapter(obj, request):
    """Json adapter for Decimal objects."""
    print(obj)
    print(str(obj))
    print(str(obj).encode())
    # obj = str(obj).encode()
    # print(obj.__dict__)
    # return {}
    return Feature(
        geometry=wkb.loads(bytes(obj.data)),
    )


def wkt_adapter(obj, request):
    """Json adapter for Decimal objects."""
    return Feature(
        geometry=wkt.loads(obj.data),
    )
