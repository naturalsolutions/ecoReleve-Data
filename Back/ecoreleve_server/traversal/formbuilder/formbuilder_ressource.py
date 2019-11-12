from ecoreleve_server.modules.permissions import context_permissions
from ecoreleve_server.traversal.core import MetaRootRessource, MetaCollectionRessource, MetaItemRessource
from ecoreleve_server.modules.field_activities.field_activity_model import fieldActivity, FieldActivity_ProtocoleType, ProtocoleType
from sqlalchemy import asc

from pyramid.httpexceptions import HTTPClientError


# class FormBuilderRessource (MetaRootRessource):
    
#     __acl__ = context_permissions['formbuilder']
#     __name__ = ''
#     __parent__ = None

#     def __init__(self, name, ref, request):
#         self.__name__ = name
#         self.__parent__ = ref
#         self.__request__ = request

#     def __getitem__(self, name):
#         if name == 'FieldActivity':
#             return FieldActivityCollection(name, self)
#         elif name == 'FieldActivity_ProtocoleType':
#             return FieldActivityProtocoleTypeCollection(name, self)
#         elif name == 'ProtocoleType':
#             return ProtocoleTypeCollection(name, self)
#         else:
#             raise KeyError

#     def retrieve(self):
#         return 'Formbuilder Ressource(root node)'


class FieldActivityCollection (MetaCollectionRessource):

    __acl__ = context_permissions['formbuilder']
    params = {
        'protocoleType' : {
            'ID' : None,
            'Name' : None
        }
    }

    def __getitem__ (self,name):
        print("getitem de fieldActivityCollection")
        try:
            val = int(name)
            print("name is an int we gonna return a ressource", name, val)
            return FieldActivityRessource(name=name, parent=self, request=self.__request__)
        except ValueError:
            print("WE GONNA RAISE ERROR")
            raise KeyError


    def parseQueryString(self):
        multiDictParams = self.__request__.GET

        if 'protocoleType.ID' in multiDictParams:
            #should raise warning if len > 2
            self.params['protcoleType']['ID'] = multiDictParams['protocoleType.ID'][0]
        if 'protocoleType.Name' in multiDictParams:
            self.params['protocoleType']['Name'] = multiDictParams['protocoleType.Name'][0]
            
    def retrieve (self):
        # res = self.__request__.dbsession.\
        #     query(fieldActivity.ID,fieldActivity.Name).\
        #     join(FieldActivity_ProtocoleType, fieldActivity.ID == FieldActivity_ProtocoleType.FK_fieldActivity).\
        #     join(ProtocoleType, FieldActivity_ProtocoleType.FK_ProtocoleType == ProtocoleType.ID).\
        #     order_by(asc(fieldActivity.ID)).\
        #     all()
        res = self.__request__.dbsession.\
            query(fieldActivity.ID,fieldActivity.Name).\
            order_by(asc(fieldActivity.ID)).\
            all()    

        toRet = []
        for item in res: 
            toRet.append(item._asdict())

        return toRet


class ProtocoleTypeCollection (MetaCollectionRessource):
    def __getitem__ (self,name):
        try:
            val = int(name)
            return ProtocoleTypeRessource(name=name, parent=self, request=self.__request__)
        except ValueError:
            print("WE GONNA RAISE ERROR")
            raise KeyError
    
    def retrieve (self):
        res = self.__request__.dbsession.\
            query(ProtocoleType.ID,ProtocoleType.Name).\
            order_by(asc(ProtocoleType.ID)).\
            all()    

        toRet = []
        for item in res: 
            toRet.append(item._asdict())

        return toRet

        
class ProtocoleTypeRessource (MetaItemRessource):

    def retrieve (self):
        item = self.__request__.dbsession.query(ProtocoleType.ID,ProtocoleType.Name).filter(ProtocoleType.ID == self.__name__).first()

        return item._asdict()


class FieldActivityRessource (MetaItemRessource):

    __acl__ = context_permissions['formbuilder']
   
    def __getitem__(self, name):
        if name == 'FieldActivity_ProtocoleType':
            return FieldActivityProtocoleTypeCollection(name=name, parent=self, request=self.__request__)
        else:
            raise KeyError


    def retrieve (self):
        item = self.__request__.dbsession.query(fieldActivity).get(self.__name__)

        return {
                'ID' : getattr(item, 'ID'),
                'Name': getattr(item, 'Name')
                }


class unflatListOfDict(dict):
    ### could be more generic but headache ....
    def unflatListOfDict(self, listOfDict ):
        toRet = []
        for a in listOfDict:
            idft_pt = getattr( a, 'FieldActivity_ProtocoleType.ID')
            idFieldactivity = getattr( a, 'fieldActivity.ID' )
            nameFieldactivity = getattr( a, 'fieldActivity.Name' )
            idProto = getattr(a, 'ProtocoleType.ID' )
            nameProto = getattr(a, 'ProtocoleType.Name' )

            fieldActivityIsPresent = False
            for i in range(len(toRet)):
                if toRet[i]['FieldActivity']['ID'] == idFieldactivity and toRet[i]['FieldActivity']['Name'] == nameFieldactivity:
                    fieldActivityIsPresent = True
                    protocoleIsPresent = False

                    for j in range(len(toRet[i]['Protocols'])):
                        if toRet[i]['Protocols'][j]['ID'] == idProto and toRet[i]['Protocols'][j]['Name'] == nameProto:
                            protocoleIsPresent = True
                            break
                        
                    if not protocoleIsPresent :
                        toRet[i]['Protocols'].append({       
                                                        'ID': idProto,
                                                        'Name' : nameProto,
                                                        'FieldActivity_ProtocoleType': {
                                                            'ID' : idft_pt
                                                        }
                                                    })

            if not fieldActivityIsPresent:
                toRet.append({
                    'FieldActivity' : { 
                                        'ID': idFieldactivity,
                                        'Name': nameFieldactivity
                                    },
                    'Protocols' : [{       
                                        'ID': idProto,
                                        'Name' : nameProto,
                                        'FieldActivity_ProtocoleType': {
                                            'ID' : idft_pt
                                        }
                                    }] }
                    )
        return toRet


class FieldActivityProtocoleTypeCollection (MetaCollectionRessource, unflatListOfDict):

    def __getitem__ (self, name):
        if name:
            return FieldActivityProtocoleTypeRessource(name=name, parent=self, request=self.__request__)
        else:
            raise KeyError
  
   

    # CRUD IS OK but endpoint for front is not this ressource, need some params for grouped by fieldactivity or protocole
    def retrieve (self):
        # if self.__parent__.dbModel == 

        res = self.__request__.dbsession.\
            query(FieldActivity_ProtocoleType.ID.label('FieldActivity_ProtocoleType.ID'),fieldActivity.ID.label('fieldActivity.ID'), fieldActivity.Name.label('fieldActivity.Name'), ProtocoleType.ID.label('ProtocoleType.ID'), ProtocoleType.Name.label('ProtocoleType.Name') ).\
            join(FieldActivity_ProtocoleType, fieldActivity.ID == FieldActivity_ProtocoleType.FK_fieldActivity).\
            join(ProtocoleType, FieldActivity_ProtocoleType.FK_ProtocoleType == ProtocoleType.ID).\
            order_by(asc(FieldActivity_ProtocoleType.ID),asc(fieldActivity.ID)).\
            all()

        '''
          [{
             ID: idFa,
             Name : nameFA
             protocols : [
                 { id : idProto ,name : nameProto }
             ]
         }]
        '''

        ###becarefull you must order by id the res in your query or the next will fail

        return self.unflatListOfDict(res)
    
    def create (self):

        fieldActivity_ProtocoleTypeSend = self.__request__.json_body
        protocoleListSend = fieldActivity_ProtocoleTypeSend['Protocols']
        session = self.__request__.dbsession

        fK_fieldActivity = fieldActivity_ProtocoleTypeSend['ID']
        
        for proto in protocoleListSend:
            fK_ProtocoleType = proto['ID']
            newFieldActivity_ProtocoleType = FieldActivity_ProtocoleType()
            newFieldActivity_ProtocoleType.FK_fieldActivity = fK_fieldActivity
            newFieldActivity_ProtocoleType.FK_ProtocoleType = fK_ProtocoleType

            session.add(newFieldActivity_ProtocoleType)

        session.commit()
        
        print(self.__request__)
        return 'ok'

    def delete (self):
        paramsParsed = self.__request__.GET
        listIdToDelete = []

        for param in paramsParsed:
            if param.lower() == 'id':
                listIdToDelete = paramsParsed[param].split(',')

        res = self.__request__.dbsession.\
            query(FieldActivity_ProtocoleType).filter(FieldActivity_ProtocoleType.ID.in_(listIdToDelete) ).\
            delete()
        
        
        print("on va delete")
        return 'ok on delete'

        ##need to clarify if we delete a large number or id maybe we should give some int in the front and call a patch
    
    def patch(self):
        try:
            bodyJson = self.__request__.json
        except :
            return HTTPClientError()
        session = self.__request__.dbsession
        idToDelete = []

        for item in bodyJson:
            if item.get('op') == 'add':
                value = item.get('value')
                if value is not None:
                    newFieldActivity_ProtocoleType = FieldActivity_ProtocoleType()
                    newFieldActivity_ProtocoleType.FK_fieldActivity = value.get('FK_fieldActivity')
                    newFieldActivity_ProtocoleType.FK_ProtocoleType = value.get('FK_ProtocoleType')
                    session.add(newFieldActivity_ProtocoleType)
            if item.get('op') == 'remove':
                pathCur = item.get('path')
                if pathCur is not None:
                    pathCur = pathCur.replace('/','')
                    try:
                        newId = int(pathCur)
                        session.query(FieldActivity_ProtocoleType).filter(FieldActivity_ProtocoleType.ID==newId).delete(synchronize_session=False)       
                    except ValueError:
                        pass

        # if len(idToDelete):
        #     session.query(FieldActivity_ProtocoleType).filter(FieldActivity_ProtocoleType.ID.in_(idToDelete)).delete()

        
        session.commit()

        return "ok on  a patch"


class FieldActivityProtocoleTypeRessource (MetaItemRessource, unflatListOfDict):
    
    def retrieve (self):
        res = self.__request__.dbsession.\
            query(fieldActivity.ID.label('fieldActivity.ID'), fieldActivity.Name.label('fieldActivity.Name'), ProtocoleType.ID.label('ProtocoleType.ID'), ProtocoleType.Name.label('ProtocoleType.Name')).\
            join(FieldActivity_ProtocoleType, fieldActivity.ID == FieldActivity_ProtocoleType.FK_fieldActivity).\
            join(ProtocoleType, FieldActivity_ProtocoleType.FK_ProtocoleType == ProtocoleType.ID).\
            filter( fieldActivity.ID == int(self.__name__)).\
            order_by(asc(fieldActivity.ID)).\
            all()

        return self.unflatListOfDict(res)


