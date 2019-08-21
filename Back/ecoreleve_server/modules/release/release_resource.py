# from ..Models import (
#     Individual,
#     Station,
#     Observation,
#     # ProtocoleType,
#     invertedThesaurusDict,
#     thesaurusDictTraduction
# )
import json
from datetime import datetime
import pandas as pd
from sqlalchemy import select, text, and_
import operator
from traceback import print_exc
from collections import Counter


from ecoreleve_server.core.base_resource import CustomResource
from ecoreleve_server.utils.parseValue import isNumeric, formatThesaurus
from ecoreleve_server.core import RootCore
from ..permissions import context_permissions
from ..observations import Observation
from ..individuals import Individual
from ..stations import Station
from ..observations.equipment_model import checkEquip, set_equipment
from ..individuals.individual_resource import IndividualsResource

from ecoreleve_server.core.configuration_model.frontmodules import ModuleGrids,FrontModules,ModuleForms

ProtocoleType = Observation.TypeClass


class ReleaseIndividualsResource(IndividualsResource):

    moduleGridName = 'IndivReleaseGrid' # will be used for fetching conf
    __acl__ = context_permissions['release']
    listProtosNameToInstanciate = [
                'Vertebrate_group',
                'Vertebrate_individual',
                'Bird_Biometry',
                'Release_Group',
                'Release_Individual',
                'Individual_equipment'
                ]
    objProtoToInstanciate = {}

    def getFilter(self, type_=None, moduleName=None):
        return []

    def handleCriteria(self, params):
        criteria = [{
            'Column': 'LastImported',
            'Operator': '=',
            'Value': True
        }]
        params['criteria'].extend(criteria)
        return params

    def handleResult(self, data):
        for row in data[1]:
            if 'Date_Sortie' in row and row['Date_Sortie'] is not None:
                row['Date_Sortie'] = row['Date_Sortie'].strftime(
                    '%Y-%m-%d %H:%M:%S')
        return data

    def retrieve(self):
        return self.search(paging=False)

    def createObjProtoToInstanciate(self,listProtosName):
        self.objProtoToInstanciate = {} # reset the object
        for item in listProtosName:
            self.objProtoToInstanciate[item] = {
                'id' : None,
                'propsList' : []
            }

    def getConfForProtocole(self):

        
        self.createObjProtoToInstanciate(self.listProtosNameToInstanciate)
  
        rows = self.session.query(
                                ProtocoleType.ID.label("idProto"),
                                ProtocoleType.Name.label("nameProto"),
                                ModuleForms.Name.label("nameDynProp")
                                ).join(
                                        ProtocoleType,
                                        ProtocoleType.ID == ModuleForms.TypeObj
                                ).join(
                                        FrontModules,
                                        FrontModules.ID == ModuleForms.Module_ID
                                ).filter(
                                        ProtocoleType.Name.in_(self.listProtosNameToInstanciate)
                                ).order_by(
                                        ProtocoleType.ID,
                                        ModuleForms.Name
                                ).all()
        for item in rows:
            if self.objProtoToInstanciate[item.nameProto]['id'] is None and item.idProto is not None:
                self.objProtoToInstanciate[item.nameProto]['id'] = item.idProto
            if item.nameDynProp not in self.objProtoToInstanciate[item.nameProto]['propsList']:
                self.objProtoToInstanciate[item.nameProto]['propsList'].append(item.nameDynProp)



    def getConfForValidate(self):

        self.confInDB = self.session.query(ModuleGrids).join(FrontModules).filter( and_( ModuleGrids.Module_ID == FrontModules.ID, FrontModules.Name == self.moduleGridName ) ).all()

        if len(self.confInDB) <= 0:
            print("someting goes wrong")

        self.keysUpdatable = []
        self.defaultKeys = ['ID']

        self.keysUpdatable.extend(self.defaultKeys)

        for item in self.confInDB:
            if item.GridRender > 2 :
                self.keysUpdatable.append(item.Name)

        # self.keysUpdatable = list( filter( lambda x['Name'] : ( x.GridRender > 2 ), self.confInDB ) )

        if len(self.keysUpdatable) <= 0 :
            print("nothing to update")

    def updateAllStartDate(self, indiv, date, properties):
        for prop in properties:
            existingDynPropValues = list(filter(lambda p: p.fk_property == prop['ID'],
                                                indiv._dynamicValues))
            if existingDynPropValues:
                curValueProperty = max(
                    existingDynPropValues, key=operator.attrgetter('StartDate'))
                curValueProperty.StartDate = date
                

    def create(self):
        session = self.session
        request = self.request
        data = request.params.mixed()

        if 'StationID' not in data and 'IndividualList' not in data:
            if data == {}:
                data = request.json_body
            if 'FK_Sensor' in data and data['FK_Sensor'] not in (None, ''):
                return isavailableSensor(request, data)
            return

        self.getConfForValidate()

        sta_id = int(data['StationID'])
        indivListFromData = json.loads(data['IndividualList'])
        releaseMethod = data['releaseMethod']
        curStation = session.query(Station).get(sta_id)
        taxon = False

        userLang = request.authenticated_userid['userlanguage']
        indivList = []
        for row in indivListFromData:
            rowTmp = {}

            for key,value in row.items():
                if key in self.keysUpdatable:
                    rowTmp[key] = value

            indivList.append(rowTmp)

        def getnewObs(typeID):
            newObs = Observation()
            newObs.type_id = typeID
            newObs.FK_Station = sta_id
            return newObs

        
        
        self.getConfForProtocole()

        vertebrateIndList = []
        biometryList = []
        releaseIndList = []
        equipmentIndList = []

        binaryDict = {
            9: 'nb_adult_indeterminate',
            10: 'nb_adult_male',
            12: 'nb_adult_female',
            17: 'nb_juvenile_indeterminate',
            18: 'nb_juvenile_male',
            20: 'nb_juvenile_female',
            33: 'nb_indeterminate',
            36: 'nb_indeterminate',
            34: 'nb_indeterminate'
        }

        """ Return sex, age repartition of released individuals

            binary ponderation female : 4, male :2 , indeterminateSex : 1,
            adult:8, juvenile : 16, indeterminateAge : 32
        """
        def MoF_AoJ(obj):
            curSex = None
            curAge = None
            binP = 0
            if obj['Sex'] is not None and obj['Sex'].lower() == 'male':
                curSex = 'male'
                binP += 2
            elif obj['Sex'] is not None and obj['Sex'].lower() == 'female':
                curSex = 'female'
                binP += 4
            else:
                curSex == 'Indeterminate'
                binP += 1

            if obj['Age'] is not None and obj['Age'].lower() == 'Adult':
                curAge = 'Adult'
                binP += 8
            elif obj['Age'] is not None and obj['Age'].lower() == 'juvenile':
                curAge = 'Juvenile'
                binP += 16
            else:
                curAge == 'Indeterminate'
                binP += 32
            return binaryDict[binP]

        try:
            errorEquipment = None
            binList = []
            for indiv in indivList:
                tmpIndiv = indiv
                curIndiv = session.query(Individual).get(indiv['ID'])
                if not taxon:
                    taxon = curIndiv.Species
                try:
                    tmpIndiv['taxon'] = curIndiv.Species
                    if 'species' in tmpIndiv:
                        del tmpIndiv['species']
                except:
                    tmpIndiv['taxon'] = curIndiv.Species
                    if 'species' in tmpIndiv:
                        del tmpIndiv['Species']
                    pass

                tmpIndiv['__useDate__'] = curStation.StationDate
                curIndiv.values = tmpIndiv
                self.updateAllStartDate(
                    curIndiv, curStation.StationDate, curIndiv.properties)
                

                curIndiv.enable_business_ruler = False
                binList.append(MoF_AoJ(curIndiv.values))  

                curIndiv.values['FK_Individual'] = curIndiv.ID
                curIndiv.values['FK_Station'] = sta_id
                try:
                    curIndiv.values['weight'] = curIndiv.values['poids']
                except:
                    curIndiv.values['weight'] = curIndiv.values['Poids']
                    pass
                try:
                    curIndiv.values['Comments'] = curIndiv.values['Release_Comments']
                except:
                    print_exc()
                    pass

                listPropsCurIndiv = [x for x in list(curIndiv.values) ]
                curIndivDict = curIndiv.values

                curProtoID = self.objProtoToInstanciate['Vertebrate_individual']['id']
                listPropsCurProto = self.objProtoToInstanciate['Vertebrate_individual']['propsList']

                curVertebrateInd = getnewObs(curProtoID)
                curValues = {}
                for propsProto in listPropsCurProto:
                    for propsIndiv in listPropsCurIndiv:
                      if propsProto.lower() == propsIndiv.lower():
                        curValues[propsProto] = curIndivDict[propsIndiv]
                    
                curVertebrateInd.values = curValues
                curVertebrateInd.Comments = None
                vertebrateIndList.append(curVertebrateInd)


                curProtoID = self.objProtoToInstanciate['Bird_Biometry']['id']
                listPropsCurProto = self.objProtoToInstanciate['Bird_Biometry']['propsList']
                curBiometry = getnewObs(curProtoID)

                curValues = {}
                for propsProto in listPropsCurProto:
                    for propsIndiv in listPropsCurIndiv:
                      if propsProto.lower() == propsIndiv.lower():
                        curValues[propsProto] = curIndivDict[propsIndiv]
                    
                curBiometry.values = curValues
                curBiometry.Comments = None
                biometryList.append(curBiometry)


                curProtoID = self.objProtoToInstanciate['Release_Individual']['id']
                listPropsCurProto = self.objProtoToInstanciate['Release_Individual']['propsList']
                curReleaseInd = getnewObs(curProtoID)

                curValues = {}
                for propsProto in listPropsCurProto:
                    for propsIndiv in listPropsCurIndiv:
                      if propsProto.lower() == propsIndiv.lower():
                        curValues[propsProto] = curIndivDict[propsIndiv]

                curReleaseInd.values = curValues
                releaseIndList.append(curReleaseInd)

                sensor_id = curIndiv.values.get(
                    'FK_Sensor', None) or  curIndiv.values.get('fk_sensor', None)

                if sensor_id:
                    try:
                        curEquipmentInd = getnewObs(equipmentIndID)
                        equipInfo = {
                            'FK_Individual': curIndiv.values['FK_Individual'],
                            'FK_Sensor': sensor_id,
                            'Survey_type': 'post-relâcher',
                            'Monitoring_Status': 'suivi',
                            'Sensor_Status': 'sortie de stock>mise en service',
                            'FK_Station': curStation.ID,
                            '__useDate__': curStation.StationDate
                        }
                        curEquipmentInd.values = equipInfo
                        set_equipment(curEquipmentInd, curStation)
                        equipmentIndList.append(curEquipmentInd)
                    except Exception as e:
                        if e.__class__.__name__ == 'ErrorAvailable':
                            sensor_available = 'is' if e.value[
                                'sensor_available'] else 'is not'
                            tpl = 'SensorID {0} {1} available for equipment'.format(
                                equipInfo['FK_Sensor'], sensor_available)
                            if errorEquipment is None:
                                errorEquipment = tpl
                            else:
                                errorEquipment += ',   ' + tpl
                        else:
                            print_exc()
                            errorEquipment = e.__class__.__name__

            dictVertGrp = dict(Counter(binList))
            dictVertGrp['nb_total'] = len(releaseIndList)
            dictVertGrp['taxon'] = taxon

            obsVertGrpFilteredId = list(filter(
                lambda o: o.type_id == self.objProtoToInstanciate['Vertebrate_group']['id'], curStation.Observations))
            obsReleaseGrpFilteredId = list(
                filter(lambda o: o.type_id == self.objProtoToInstanciate['Release_Group']['id'], curStation.Observations))

            if len(obsVertGrpFilteredId) > 0:
                for obsId in obsVertGrpFilteredId:
                    curObs = session.query(Observation).get(obsId.ID)
                    if curObs.values.get('taxon') == taxon:
                        vertebrateGrp = curObs
                        break
                    else:
                        vertebrateGrp = None
            else:
                vertebrateGrp = None

            if len(obsReleaseGrpFilteredId) > 0:
                for obsId in obsReleaseGrpFilteredId:
                    curObs = session.query(Observation).get(obsId.ID)
                    if curObs.values.get('taxon') == taxon and curObs.values.get('release_method') == releaseMethod:
                        releaseGrp = curObs
                        break
                    else:
                        releaseGrp = None
            else:
                releaseGrp = None

            if vertebrateGrp:
                for prop, val in dictVertGrp.items():
                    if isNumeric(val):
                        vertebrateGrp.setValue(
                            prop, int(val) + int(vertebrateGrp.values.get(prop, 0)))
            else:
                vertebrateGrp = Observation()
                vertebrateGrp.session = session
                dictVertGrp.update({'FK_Station':sta_id, 'type_id': self.objProtoToInstanciate['Vertebrate_group']['id']})
                vertebrateGrp.values = dictVertGrp

            if releaseGrp:
                releaseGrp.setValue('nb_individuals', int(
                    curObs.values.get('nb_individuals')) + len(releaseIndList))
            else:
                releaseGrp = Observation()
                releaseGrp.session = session
                releaseGrp.values = {'type_id':self.objProtoToInstanciate['Release_Group']['id'],
                                    'FK_Station':sta_id,
                                    'taxon': taxon,
                                    'release_method': releaseMethod,
                                    'nb_individuals': len(releaseIndList)}

            releaseGrp.Observation_children.extend(releaseIndList)
            vertebrateGrp.Observation_children.extend(vertebrateIndList)

            if errorEquipment is not None:
                session.rollback()
                request.response.status_code = 510
                message = errorEquipment

            else:
                session.add(vertebrateGrp)
                session.add(releaseGrp)
                session.add_all(biometryList)
                session.add_all(equipmentIndList)
                message = {'release': len(releaseIndList)}

        except Exception as e:
            print_exc()
            self.request.response.status_code = 500
            session.rollback()
            message = str(type(e))
        finally:
            Individual.enable_business_ruler = True
            
        return message


class ReleaseResource(CustomResource):

    model = None
    __acl__ = context_permissions['release']
    children = [('individuals',ReleaseIndividualsResource)]

    def getReleaseMethod(self):
        userLng = self.request.authenticated_userid['userlanguage'].lower()
        if not userLng:
            userLng = 'fr'
        query = text("""SELECT TTop_FullPath as val, TTop_Name as label"""
                     + """ FROM THESAURUS.dbo.TTopic th
            JOIN [ModuleForms] f on th.TTop_ParentID = f.Options
            where Name = 'release_method' """)
        result = self.session.execute(query).fetchall()
        result = [dict(row) for row in result]
        if userLng != 'fr':
            for row in result:
                row['label'] = formatThesaurus(row['val'])['displayValue']
        return result


RootCore.children.append(('release', ReleaseResource))


def isavailableSensor(request, data):
    availability = checkEquip(data['FK_Sensor'], datetime.strptime(
        data['sta_date'], '%d/%m/%Y %H:%M:%S'))
    if availability is True:
        return
    else:
        request.response.status_code = 510
        return 'sensor not available'


def getFullpath(item, lng):
    name, val = item
    try:
        newVal = invertedThesaurusDict[lng][val]
    except:
        newVal = val
    return (name, newVal)
