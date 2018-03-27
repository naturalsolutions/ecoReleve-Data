import cv2
from matplotlib import pyplot as plt
import numpy as np
import pytesseract
from PIL import Image
import re
import pandas as pd

IMG_File = 'C:/Users/jean-vitus/Desktop/PP163_09N02P/13N016D.JPG'
pytesseract.pytesseract.tesseract_cmd = 'C:/Program Files (x86)/Tesseract-OCR/tesseract'
tessdata_dir_config = ''


def getHsito(img):
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    rows, cols, band = img.shape
    total_pixels = rows*cols
    unique, counts = np.unique(img, return_counts=True)
    df = pd.DataFrame(data={'pix':unique, 'count':counts})
    # print(df)
    max_reprenseted_value = df.loc[df['count'].idxmax()]
    # print('max val   ', max_reprenseted_value)
    # TODO FIX: is not the max value counted but the max value of pixel 
    # max_reprenseted_value = np.amax(np.asarray((unique, counts)), axis=1)

    # print('max value pixel is ', max_reprenseted_value)
    
    if max_reprenseted_value['count'] > total_pixels/3:
        # print('max value pixel is ', max_reprenseted_value[0])
        return max_reprenseted_value['pix']
    else:
        return None
    # hist = cv2.calcHist([img],[0],None,[256],[0,256])
    # print(hist)
    # plt.hist(img.ravel(),256,[0,256])
    # plt.show()

def cropImg(filename):
    image = cv2.imread(filename)
    # cv2.imshow('original', cv2.resize(image, (800, 600)) )
    # gray = cv2.cvtColor(image,cv2.COLOR_BGR2GRAY) # grayscale
    rows, cols, band = image.shape

    h_band = int(rows * 0.07)

    top_cropped = image[0:h_band, ].copy()
    bottom_cropped = image[rows - h_band:rows, ].copy()
    # cv2.imshow( filename, cv2.resize(image, (800, 600)))
 
    return bottom_cropped, top_cropped


def apply_ocr(img, **kwargs):
    # image = cv2.imread(filename)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    # gray = cv2.GaussianBlur(gray, (3, 3), 0)
    kernel = cv2.getStructuringElement(cv2.MORPH_CROSS, (3, 3))    
    gray = cv2.erode(gray, kernel, iterations=2)
    # cv2.imshow('gray ', gray)
    
    im = Image.fromarray(gray)
    text = pytesseract.image_to_string(
        im, lang='eng', config=tessdata_dir_config)
    return text


def canny(image, filename, max_value):
    # image = cv2.imread(filename)

    try:
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        otsu_thresh_val, otsu = cv2.threshold(
            gray, 0.0, max_value, cv2.THRESH_BINARY_INV | cv2.THRESH_OTSU)

        high_thresh_val = otsu_thresh_val
        lower_thresh_val = otsu_thresh_val * 0.5

        edges = cv2.Canny(otsu, lower_thresh_val, high_thresh_val)

        kernel = cv2.getStructuringElement(cv2.MORPH_CROSS, (5, 5))
        dilated = cv2.dilate(edges, kernel, iterations=3)
        # erode = cv2.erode(dilated, kernel, iterations=3)

        morphKernel = cv2.getStructuringElement(cv2.MORPH_RECT, (5, 1))
        connected = cv2.morphologyEx(dilated, cv2.MORPH_CLOSE, morphKernel)

        mask = np.zeros(image.shape[:2], dtype="uint8")
        _, contours, hierarchy = cv2.findContours(
            connected, cv2.RETR_EXTERNAL | cv2.RETR_CCOMP, cv2.CHAIN_APPROX_NONE)

        idx = 0
        while idx >= 0:
            x, y, w, h = cv2.boundingRect(contours[idx])
            # fill the contour
            cv2.drawContours(mask, contours, idx, (255, 255, 255), cv2.FILLED)
            # ratio of non-zero pixels in the filled region
            r = cv2.contourArea(contours[idx])
            cv2.rectangle(image, (x, y), (x + w, y + h), (255, 0, 0), 2)
            
            idx = hierarchy[0][idx][0]
            # print(x, x+h,y, w+y )
            # temp = image[y:w+y, x:x+h].copy()
            # cv2.imshow('canny OP temp  '+str(idx) + filename, image)
            # print('\ncanny OP temp '+str(idx) + filename+' OCR VALUE     ',apply_ocr(temp))

        r, c, z = image.shape
        
        # cv2.imshow('canny OP ' + filename, cv2.resize(image,(int(c/2),int(r/2))))
    except:
        from traceback import  print_exc
        print_exc()
        gray = image
        pass


def parserHygro(text):
    ''' param @text : string from OCR result
     retrieve only temperature and hygrometry '''
    hygroRegexp = '[0-9]{1,3}\.?[0-9]{2}(in|ian)'
    match = re.search(hygroRegexp, text)
    matchHygro = None
    if match:
        try:
            matchHygro = float(match.group(0).replace('in','').replace('ian',''))
        except Exception as e:
            matchHygro = None
    return matchHygro

def parserTemp(text):
    ''' param @text : string from OCR result
     retrieve only temperature and hygrometry '''
    tempRegexp = '[0-9]{1,3}°?[C-c-F-f]'
    textt= text.replace(' ', '')
    match = re.search(tempRegexp, textt)
    matchTemp = None
    if match:
        try:
            matchTemp = match.group(0)
            matchTemp = matchTemp.replace('C','').replace('c','').replace('°','')
            if 'f' in matchTemp.lower():
                matchTemp = matchTemp.replace('F','')
                matchTemp = (int(matchTemp)- 32)/1.8 
            else:
                matchTemp = float(matchTemp)
        except Exception as e:
            matchTemp = None
    return matchTemp

def OCR_parser(filename):
    dictResult = {}

    # print('\n\n ***********************************')
    # print(filename)
    
    bottom_cropped, top_cropped = cropImg(filename)
    bot_value = getHsito(bottom_cropped)
    top_value = getHsito(top_cropped)
    dictResult = {'temp': None , 'hygro': None}
    if top_value:
        # cv2.imshow('top', top_cropped)
        
        # canny(top_cropped, 'top_cropped '+filename, top_value)
        text_top = apply_ocr(top_cropped)
        temp_top = parserTemp(text_top)
        hygro_top = parserHygro(text_top)
        
        # dictResult = {'top': text_top.replace('\n','')}
        if temp_top is not None:
            dictResult['temp'] = temp_top
        if hygro_top is not None:
            dictResult['hygro'] = hygro_top

    if bot_value:
        # canny(bottom_cropped, 'bottom_cropped '+filename, bot_value)
        # cv2.imshow('bot', bottom_cropped)
        text = apply_ocr(bottom_cropped)
        temp = parserTemp(text)
        hygro = parserHygro(text)
        # if not dictResult.get('filename', None):
            # dictResult = {'text':''}
        # dictResult['bot'] ='\n'+text.replace('\n','')

        if temp is not None:
            dictResult['temp'] = temp
        if hygro is not None:
            dictResult['hygro'] = hygro
    return dictResult

def simple_OCR(image_file):
    image = cv2.imread(image_file)
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    
    im = Image.fromarray(gray)
    text = pytesseract.image_to_string(
        im, config=tessdata_dir_config)
    # print(text)
    temp = parserTemp(text)
    hygro = parserHygro(text)

    return {'temp':temp, 'hygro':hygro}
    
# ocr_test = OCR_parser(IMG_File)
# print(ocr_test)
# ocr_tests = simple_OCR(IMG_File)
# print(ocr_tests)
# cv2.waitKey(0)