import time
from scipy import misc,ndimage
import numpy as np
import matplotlib.pyplot as plt


def imgProcess(imgFile):
    # print(self.request)
    start_time = time.time()
    result = 0
    if imgFile:

        imgTest = misc.imread(imgFile,flatten=True,mode='L')
        # imgBlurred = ndimage.gaussian_filter(imgTest,8)

        # sx = ndimage.sobel(imgBlurred,axis=0, mode='constant')
        # sy = ndimage.sobel(imgBlurred,axis=1, mode='constant')
        # sob = np.hypot(sx,sy)
        nbPixel = imgTest.size
        limitDarkness = 200
        nbPixDark = 0
        limitBrightness = 50
        nbPixBright = 0
        n, bins = np.histogram(imgTest, 255)
        for i in range(0,limitBrightness):
            nbPixBright += n[i]
        for i in range(limitDarkness,255):
            nbPixDark += n[i]
        print("--- %s seconds ---" % (time.time() - start_time))
        if nbPixDark > (nbPixel/2) or nbPixDark > (nbPixel/2) :
            result = -1
        else : 
            result = 1
    return result

# def imgProcess(self):
#     # print(self.request)
#     start_time = time.time()
#     if 'img' in self.request.POST:

#         imgTest = misc.imread(self.request.POST['img'].file,flatten=True,mode='L')
#         imgBlurred = ndimage.gaussian_filter(imgTest,8)

#         sx = ndimage.sobel(imgBlurred,axis=0, mode='constant')
#         sy = ndimage.sobel(imgBlurred,axis=1, mode='constant')
#         sob = np.hypot(sx,sy)
#         nbPixel = imgTest.size
#         limitDarkness = 200
#         nbPixDark = 0
#         limitBrightness = 50
#         nbPixBright = 0
#         n, bins = np.histogram(imgTest, 255)
#         for i in range(0,limitBrightness):
#             nbPixBright += n[i]
#         for i in range(limitDarkness,255):
#             nbPixDark += n[i]
#         print("--- %s seconds ---" % (time.time() - start_time))
#         if nbPixDark > (nbPixel/2) :
#             print("image too dark")
#         else : 
#             print("image ok")
#         if nbPixDark > (nbPixel/2):
#             print("image too bright")
#         else :
#             print("image ok") 
#         plt.imshow(imgTest)
#         print(n)
#         print(bins)
#     return 'ok'