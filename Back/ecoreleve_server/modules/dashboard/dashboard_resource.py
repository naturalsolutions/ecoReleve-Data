import shutil
import time
from scipy import misc
import numpy as np
import matplotlib.pyplot as plt
from ecoreleve_server.dependencies import dbConfig
from ecoreleve_server.core.base_resource import CustomResource
from ecoreleve_server.modules.permissions import context_permissions


class DashboardResource(CustomResource):

    __acl__ = context_permissions['dashboard']

    def getAvailableSpace(self):
        data = {}
        (total, used, free) = shutil.disk_usage(dbConfig['camTrap']['path'])
        data['total'] = str(total)
        data['used'] = str(used)
        data['free'] = str(free)
        return data

    def imgProcess(self):
        # print(self.request)
        start_time = time.time()
        if 'img' in self.request.POST:

            imgTest = misc.imread(
                self.request.POST['img'].file,
                flatten=True,
                mode='L'
                )

            nbPixel = imgTest.size
            limitDarkness = 200
            nbPixDark = 0
            limitBrightness = 50
            nbPixBright = 0
            n, bins = np.histogram(imgTest, 255)
            for i in range(0, limitBrightness):
                nbPixBright += n[i]
            for i in range(limitDarkness, 255):
                nbPixDark += n[i]
            print("--- %s seconds ---" % (time.time() - start_time))
            if nbPixDark > (nbPixel/2):
                print("image too dark")
            else:
                print("image ok")
            if nbPixDark > (nbPixel/2):
                print("image too bright")
            else:
                print("image ok")
            plt.imshow(imgTest)
            print(n)
            print(bins)
        return 'ok'
