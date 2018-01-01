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
        self.actions = {'availableSpace': self.getAvailableSpace,
                        'xmp' : self.handleAllMetadatas

                        }
        self.__acl__ = context_permissions[ref]

    def getAvailableSpace(self):
        data = {}
        ( total , used, free) = shutil.disk_usage(dbConfig['camTrap']['path'])
        data['total'] = str(total)
        data['used'] = str(used)
        data['free'] = str(free)
        return data

    def handleAllMetadatas(self):
        '''
        exiv is versionned and pâth is relative to this file like ../../exiv2 
        when we get the path of this file we can construct absolute path to find exiv2.exe 
        '''
        absolutePathFile = os.path.dirname( __file__ )

        '''
        need better way and secure 
        if os change '\\' to '/' 
        if path change that's will break etcetc
        '''
        #pathCmd = absolutePathFile.replace('\\ecoreleve_server\\Views','\\exiv2\\bin\\exiv2')
        optionsForCmd = ' -h '
        pathFiles = 'C:\\Users\\jean-vitus\\Desktop\\PP163_09N02P\\'
        listFiles = ['13N002F.JPG','13N021D.JPG','13N038B.JPG','13N054M.JPG','13N087F (2).JPG','13N09M28sdfdsf.JPG','13N13M28.JPG','13N004A.JPG','13N023D.JPG','13N038F.JPG','13N057A.JPG','13N087F (3).JPG','13N09M32 (2).JPG','13N146A.JPG','13N004F.JPG','13N023I.JPG','13N03M23.JPG','13N05M23.JPG','13N087F (4).JPG','13N09M32.JPG','13N148A.JPG','13N005A.JPG','13N029D (2).JPG','13N03M25.JPG','13N05M28.JPG','13N087F (5).JPG','13N102A.JPG','13N153A.JPG','13N008M.JPG','13N029D.JPG','13N03M28.JPG','13N063F.JPG','13N087F (6).JPG','13N103A.JPG','13N156A (2).JPG','13N010I.JPG','13N02M01.JPG','13N040F.JPG','13N064A.JPG','13N087F (7).JPG','13N104F.JPG','13N156A.JPG','13N012D.JPG','13N02M14(2).JPG','13N041F.JPG','13N064F.JPG','13N087F.JPG','13N104M.JPG','13N158A.JPG','13N012F.JPG','13N02M14(3).JPG','13N043D.JPG','13N066B (2).JPG','13N088D.JPG','13N105M.JPG','13N39M32 (2).JPG','13N013D (2).JPG','13N02M14.JPG','13N043I.JPG','13N066B.JPG','13N08M32 (2).JPG','13N106B.JPG','13N39M32.JPG','13N013D.JPG','13N02M23 (2).JPG','13N04M14.JPG','13N066D.JPG','13N08M32.JPG','13N108B.JPG','IMAG2425.JPG','13N016D.JPG','13N02M23.JPG','13N04M22.JPG','13N06M15.JPG','13N092F.JPG','13N108M.JPG','N113A.JPG','13N01M06.JPG','13N034F.JPG','13N04M23(2).JPG','13N074F (2).JPG','13N093A.JPG','13N110B.JPG','13N01M14(1).JPG','13N035I (2).JPG','13N04M23.JPG','13N074F (3).JPG','13N094B (3).JPG','13N111B (2).JPG','13N01M14(2).JPG','13N035I (3).JPG','13N04M26 (2).JPG','13N074F.JPG','13N094B(2).JPG','13N111B.JPG','13N01M15.JPG','13N035I.JPG','13N04M26.JPG','13N07M23.JPG','13N094B.JPG','13N117M.JPG','13N01M18.JPG','13N036A.JPG','13N050D.JPG','13N07M28 (2).JPG','13N096A.JPG','13N123B.JPG','13N01M25.JPG','13N036D.JPG','13N050F.JPG','13N07M28.JPG','13N099B.JPG','13N12M28 (2).JPG','13N01M28.JPG','13N037B.JPG','13N051A.JPG','13N082F.JPG','13N09M28 (2).JPG','13N12M28.JPG','13N020D.JPG','13N037D.JPG','13N054D.JPG','13N084F.JPG','13N09M28 (3).JPG','13N133A.JPG']
        pathCmd = absolutePathFile.replace('\\ecoreleve_server\\Views','\\exiftool')
        # listFiles = ['13N01M06.JPG']

        for idx in range(len(listFiles)):
            listFiles[idx] = pathFiles+listFiles[idx]

        generatedCmd = []

        #XMP-DC START
        generatedCmd.append(optionsForCmd+'-XMP-dc:Identifier=super identifier') #XmpText
        generatedCmd.append(optionsForCmd+'-XMP-dc:Title-x-default=le super titile default bla bla bla Camera trap ID=FK_Sensor_50408-Picture name=pic13d4d5f058.jpg') #XmpText
        generatedCmd.append(optionsForCmd+'-XMP-dc:Creator=et ouais MR.X') #XmpSeq
        #dcterms creator
        generatedCmd.append(optionsForCmd+'-XMP-dc:Contributor=Mr.X') #XmpBag 
        #dcterms contributor
        generatedCmd.append(optionsForCmd+'-XMP-dc:Description=Log of all ecoReleve data about the picture in EN and FR') #LangAlt
        generatedCmd.append(optionsForCmd+'-XMP-dc:Subject=oeuf houbara predateur') #XmpBag
        generatedCmd.append(optionsForCmd+'-XMP-dc:Rights-x-default=&copy; International Fund for Houbara Conservation') #LangAlt
        #XMP-DC END

        #XMP-PRISM START 
        generatedCmd.append(optionsForCmd+'-XMP-PRISM:creationDate=12/12/2015') #LangAlt
        generatedCmd.append(optionsForCmd+'-XMP-PRISM:modificationDate=12/12/2015')
        #XMP-PRISM END

        #XMP-PMI START
        generatedCmd.append(optionsForCmd+'-XMP-pmi:sequenceName=Monitored site toto from 16/12/2017  to  27/12/2017') #XmpText
        generatedCmd.append(optionsForCmd+'-XMP-pmi:shootID=54') #XmpText
        generatedCmd.append(optionsForCmd+'-XMP-pmi:contactInfo=RENECO contact information') #XmpText
        generatedCmd.append(optionsForCmd+'-XMP-pmi:objectType=TProtocol_Vertebrate_group.Taxon') #XmpText
        generatedCmd.append(optionsForCmd+'-XMP-pmi:objectSubtype=TProtocol_Vertebrate_individual.Sex') #XmpText
        generatedCmd.append(optionsForCmd+'-XMP-pmi:objectDescription=TProtocol_Vertebrate_individual.Age') #XmpText
        generatedCmd.append(optionsForCmd+'-XMP-pmi:displayName=Individual ID, if there is one individual whose ID has been determined: TProtocol_Vertebrate_individual.FK_Individual') #XmpText
        generatedCmd.append(optionsForCmd+'-XMP-pmi:location=Region and Place of the monitored site') #XmpText
        #XMP-PMI END

        #EXIF-GPS START
        generatedCmd.append(optionsForCmd+'-GPS:GPSLatitudeRef=N') 
        generatedCmd.append(optionsForCmd+'-GPS:GPSLatitude=12 34 98')
        generatedCmd.append(optionsForCmd+'-GPS:GPSLongitudeRef=E') 
        generatedCmd.append(optionsForCmd+'-GPS:GPSLongitude=12 5 56') 
        generatedCmd.append(optionsForCmd+'-GPS:GPSAltitudeRef=+0') 
        generatedCmd.append(optionsForCmd+'-GPS:GPSDOP=1') #XmpText
        generatedCmd.append(optionsForCmd+'-GPS:GPSAltitude=12 45 890') #XmpText
        #EXIF-GPS END
        
        #XMP-IPTC START
        generatedCmd.append(optionsForCmd+'-XMP-iptcCore:Location=Region and Place of the monitored site') #XmpText
        #XMP-IPTC END

        #XMP-PHOTOSHOP START
        generatedCmd.append(optionsForCmd+'-XMP-Photoshop:DateCreated=21/12/2017') #XmpText
        generatedCmd.append(optionsForCmd+'-XMP-Photoshop:Instructions=Original picture') #XmpText
        generatedCmd.append(optionsForCmd+'-XMP-Photoshop:Headline=Picture of MonitoredSite.Category  MonitoredSite.Name , Lon: Lon , Lat: Lat , on picture creation date showing  tag list.') #XmpText
        generatedCmd.append(optionsForCmd+'-XMP-Photoshop:Source=RENECO') #XmpText
        #XMP-PHOTOSHOP END

        #XMP-XMP START
        generatedCmd.append(optionsForCmd+'-XMP-XMP:CreateDate=21/12/2017') #XmpText
        generatedCmd.append(optionsForCmd+'-XMP-XMP:MetadataDate=22/12/2017') #XmpText
        generatedCmd.append(optionsForCmd+'-XMP-XMP:Rating=4') #XmpText
        generatedCmd.append(optionsForCmd+'-XMP-XMP:ModifyDate=22/12/2017') #XmpText
        generatedCmd.append(optionsForCmd+'-XMP-XMPRights:UsageTerms-x-default=Non commercial use only') #LangAlt
        #XMP-XMP END
        # res = subprocess.run( [ pathCmd, generatedCmd] + listFiles )

        try:
            FNULL = open(os.devnull, 'w')
            res = subprocess.run( [ pathCmd, optionsForCmd] +generatedCmd + listFiles)# , stdout=FNULL, stderr=subprocess.STDOUT )
        except Exception as e :
            FNULL.close()
            print("exiftool has failed for the following reason" + e )
            self.request.response.status_code = 520
            return str(e)

        FNULL.close()
  
        return "ok"

    def retrieve(self):
        return "toto"
    # if not self.item:
    #     self.request.response.status_code = 404
    #     return self.request.response
    # else:
    #     return self.item.__json__()


RootCore.listChildren.append(('dashboard', DashboardView))

