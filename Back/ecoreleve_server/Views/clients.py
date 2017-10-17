from ..Models import (
    Client,
    MonitoredSite,
    Base,
    ClientList
)
from sqlalchemy import select, desc, join, outerjoin
from collections import OrderedDict
from sqlalchemy.exc import IntegrityError
from ..controllers.security import context_permissions
from ..GenericObjets.ObjectView import DynamicObjectView, DynamicObjectCollectionView
from ..controllers.ApiController import RootCore


class ClientView(DynamicObjectView):

    model = Client


class ClientsView(DynamicObjectCollectionView):

    Collection = ClientList
    item = ClientView
    moduleFormName = 'ClientForm'
    moduleGridName = 'ClientGrid'

    def __init__(self, ref, parent):
        DynamicObjectCollectionView.__init__(self, ref, parent)
        self.__acl__ = context_permissions[ref]


RootCore.listChildren.append(('clients', ClientsView))
