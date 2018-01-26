from ..Models import (
    dbConfig
)

from . import CustomView, context_permissions
import os,sys
from ..controllers.security import RootCore
import shutil
import subprocess


class DashboardView(CustomView):

    def __init__(self, ref, parent):
        CustomView.__init__(self, ref, parent)
        self.actions = {
                        'availableSpace': self.getAvailableSpace
                        }
        self.__acl__ = context_permissions[ref]

    def getAvailableSpace(self):
        data = {}
        ( total , used, free) = shutil.disk_usage(dbConfig['camTrap']['path'])
        data['total'] = str(total)
        data['used'] = str(used)
        data['free'] = str(free)
        return data

RootCore.listChildren.append(('dashboard', DashboardView))

