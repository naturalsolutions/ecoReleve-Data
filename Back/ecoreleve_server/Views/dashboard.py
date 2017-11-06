from ..Models import (
    dbConfig
)

from . import CustomView, context_permissions

from ..controllers.security import RootCore
import shutil

class DashboardView(CustomView):

    def __init__(self, ref, parent):
        CustomView.__init__(self, ref, parent)
        self.actions = {'availableSpace': self.getAvailableSpace,
                        }
        self.__acl__ = context_permissions[ref]

    def getAvailableSpace(self):
        data = {}
        ( total , used, free) = shutil.disk_usage(dbConfig['camTrap']['path'])
        data['total'] = str(total)
        data['used'] = str(used)
        data['free'] = str(free)
        return data

    def retrieve(self):
        return "toto"
    # if not self.item:
    #     self.request.response.status_code = 404
    #     return self.request.response
    # else:
    #     return self.item.__json__()


RootCore.listChildren.append(('dashboard', DashboardView))

