from ..Models import dbConfig
from PIL import Image, ImageFile
import datetime
import time
import os
import sys
import uuid
import shutil
from ..Models import CamTrap
import zipfile
import exifread
from pyramid import threadlocal
# handle error on some photo
# image file truncated
ImageFile.LOAD_TRUNCATED_IMAGES = True


def resizePhoto(imgPathSrc):
    basewidth = 200
    try:
        img = Image.open(imgPathSrc)
        # Fully load the image now to catch any problems with the image
        # contents.
        img.load()
    except Exception:
        # handle error on img file
        return
    wpercent = (basewidth / float(img.size[0]))  # keep ratio
    hsize = int((float(img.size[1]) * float(wpercent)))
    img.thumbnail((basewidth, hsize), Image.ANTIALIAS)

    imgPathDestTab = imgPathSrc.split('\\')  # parse path into a tab
    # insert ""new directory"" in the path lenght - 1
    imgPathDestTab.insert(len(imgPathDestTab) - 1, "thumbnails")
    imgPathDest = "\\".join(imgPathDestTab)  # concat the new path

    img.save(imgPathDest)  # save the thumbnail on the hdd


def dateFromExif(imagePath):
    theDate = ""
    image = open(imagePath, 'rb')
    tagsExif = exifread.process_file(image)
    for tag in tagsExif:
        if tag in ('Image DateTime'):
            theDate = str(tagsExif[tag]).encode(
                'utf8').decode(sys.stdout.encoding)
            theDate += ".000"
            theDate = theDate.replace(":", "-", 2)
            theDate = datetime.datetime.strptime(
                theDate, "%Y-%m-%d %H:%M:%S.%f")
    if(theDate == ""):
        theDate = None
    return theDate


def checkDate(exifDate, startDate, endDate):
    newStartDate = time.strptime(startDate, "%Y-%m-%d %H:%M:%S")
    if(endDate == "0000-00-00 00:00:00"):
        newEndDate = time.strptime(str(datetime.datetime.now().strftime(
            '%Y-%m-%d %H:%M:%S')), "%Y-%m-%d %H:%M:%S")
    else:
        newEndDate = time.strptime(endDate, "%Y-%m-%d %H:%M:%S")
    if(exifDate == None):
        timePhoto = time.strptime("1985-01-01 00:00:00", "%Y-%m-%d %H:%M:%S")
    else:
        timePhoto = time.strptime(str(exifDate), "%Y-%m-%d %H:%M:%S")
    if(timePhoto >= newStartDate and timePhoto <= newEndDate):
        return True
    else:
        return False


def unzip(zipFilePath, destFolder, fk_sensor, startDate, endDate):
    zfile = zipfile.ZipFile(zipFilePath)
    messageErrorFiles = ""
    nbFilesTotal = 0
    nbFilesInserted = 0

    for name in zfile.namelist():
        nbFilesTotal += 1
        extType = name.split('.')
        if(extType[len(extType) - 1] in ['jpg', 'JPG', 'jpeg', 'JPEG']):
            if not os.path.isfile(destFolder + str(name)):
                with open(os.path.join(destFolder, str(name)), 'wb') as fd:
                    fd.write(zfile.read(name))
                fd.close()
                # ici on peut test
                datePhoto = dateFromExif(destFolder + str(name))
                if(checkDate(datePhoto, startDate, endDate)):
                    AddPhotoOnSQL(fk_sensor, destFolder, name, str(
                        extType[len(extType) - 1]), datePhoto)
                    resizePhoto(str(destFolder) + str(name))
                    nbFilesInserted += 1
                else:
                    os.remove(destFolder + str(name))
                    messageErrorFiles += str(name) + \
                        'Date not valid (' + str(datePhoto) + ') <BR>'
            else:
                messageErrorFiles += "File : " + \
                    str(name) + " is already on the server <BR>"
            # fd.close()
        else:
            messageErrorFiles += str(name) + " not a good file <BR>"
    zfile.close()
    # rename zip file
    # zipFileTab = zipFilePath.split('.')
    os.remove(zipFilePath)
    print(" Nb files in zip " + str(nbFilesTotal))
    print(" Nb files inserted " + str(nbFilesInserted))
    return messageErrorFiles, nbFilesTotal, nbFilesInserted


def AddPhotoOnSQL(fk_sensor, path, name, extension, date_creation):
    session = threadlocal.get_current_request().dbsession
    if(not path.endswith('\\')):
        path += '\\'
    currentPhoto = CamTrap(fk_sensor=fk_sensor, path=str(path), name=str(
        name), extension='.jpg', date_creation=date_creation, note=5)
    session.add(currentPhoto)
    session.flush()
    return currentPhoto.pk_id


def GenName():
    return uuid.uuid4()


def createNamePath(paramsPOST):
    nouveauPath = [1, 2, 3, 4]
    cheminParse = ""
    for key, value in paramsPOST.items():
        if(key == 'UnicIdentifier'):
            nouveauPath[0] = value
        elif(key == 'StartDate'):
            nouveauPath[1] = value
        elif(key == 'EndDate'):
            nouveauPath[2] = value
        elif (key == 'Name'):
            nouveauPath[3] = value

    for tmp in nouveauPath:
        if (cheminParse == ""):
            cheminParse += tmp
        else:
            cheminParse += "_" + str(tmp)

    return cheminParse
