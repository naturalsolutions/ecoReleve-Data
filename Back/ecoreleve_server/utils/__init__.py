from .thesaurusLoad import (
    loadThesaurusTrad,

)
from .callback import add_cors_headers_response_callback
from pyramid.events import NewRequest
__all__ = [
    "loadThesaurusTrad",
]


def includeme(config):
    config.add_subscriber(
        add_cors_headers_response_callback,
        NewRequest
        )
    loadThesaurusTrad(config)
