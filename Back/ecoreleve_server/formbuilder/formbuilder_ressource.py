from ecoreleve_server.modules.permissions import context_permissions
from ecoreleve_server.modules.field_activities.field_activity_model import (
    fieldActivity,
    ProtocoleType,
    FieldActivity_ProtocoleType
)
from sqlalchemy import asc
from pyramid.httpexceptions import (
    HTTPClientError,
    HTTPOk
)
import collections


class MetaRootRessource (dict):
    __acl__ = context_permissions['formbuilder']
    __name__ = ''
    __parent__ = None

    def __init__(self, name, ref, request):
        self.__name__ = name
        self.__parent__ = ref
        self.__request__ = request

    def __getitem__(self, name):
        if name:
            return MetaCollectionRessource(name, self)
        else:
            raise KeyError

    def retrieve(self):
        return 'retrieve from Ressource:' + str(self.__name__)

    def create(self):
        return 'create from :' + str(self.__name__)

    def delete(self):
        return 'delete from :' + str(self.__name__)

    def patch(self):
        return 'patch from :' + str(self.__name__)

    def update(self):
        return 'update from :' + str(self.__name__)


class MetaCollectionRessource (MetaRootRessource):
    __acl__ = context_permissions['formbuilder']
    __name__ = ''
    __parent__ = None

    def __init__(self, name, ref):
        self.__name__ = name
        self.__parent__ = ref
        self.__request__ = ref.__request__

    def __getitem__(self, name):
        if name:
            return MetaItemRessource(name, self)
        else:
            raise KeyError


class MetaItemRessource(MetaCollectionRessource):
    __acl__ = context_permissions['formbuilder']
    __name__ = ''
    __parent__ = None

    def __init__(self, name, ref):
        self.__name__ = name
        self.__parent__ = ref
        self.__request__ = ref.__request__

    def __getitem__(self, name):
        if name:
            return MetaCollectionRessource(name, self)
        else:
            raise KeyError


class FormBuilderRessource (MetaRootRessource):

    __acl__ = context_permissions['formbuilder']
    __name__ = ''
    __parent__ = None

    def __init__(self, name, ref, request):
        self.__name__ = name
        self.__parent__ = ref
        self.__request__ = request

    def __getitem__(self, name):
        if name == 'FieldActivity':
            return FieldActivityCollection(name, self)
        elif name == 'FieldActivity_ProtocoleType':
            return FieldActivityProtocoleTypeCollection(name, self)
        elif name == 'ProtocoleType':
            return ProtocoleTypeCollection(name, self)
        else:
            raise KeyError

    def retrieve(self):
        return 'Formbuilder Ressource(root node)'


class FieldActivityCollection (MetaCollectionRessource):

    __acl__ = context_permissions['formbuilder']
    params = {
        'protocoleType': {
            'ID': None,
            'Name': None
        }
    }

    def __init__(self, name, ref):
        self.__name__ = name
        self.__parent__ = ref
        self.__request__ = ref.__request__
        # self.dbModel = FieldActivity

    def __getitem__(self, name):
        print("getitem de fieldActivityCollection")
        try:
            val = int(name)
            print("name is an int we gonna return a ressource", name, val)
            return FieldActivityRessource(val, self)
        except ValueError:
            print("WE GONNA RAISE ERROR")
            raise KeyError

    def parseQueryString(self):
        multiDictParams = self.request.GET

        if 'protocoleType.ID' in multiDictParams:
            # should raise warning if len > 2
            self.params['protcoleType']['ID'] = multiDictParams['protocoleType.ID'][0]
        if 'protocoleType.Name' in multiDictParams:
            self.params['protocoleType']['Name'] = multiDictParams['protocoleType.Name'][0]

    def retrieve(self):

        colToRet = [
            fieldActivity.ID,
            fieldActivity.Name,
            ProtocoleType.ID.label("Protocoles.ID"),
            ProtocoleType.Name.label("Protocoles.Name"),
            FieldActivity_ProtocoleType.Order.label("Protocoles.Order")
        ]

        query = self.__request__.dbsession.query(fieldActivity)
        query = query.join(
            FieldActivity_ProtocoleType,
            fieldActivity.ID
            ==
            FieldActivity_ProtocoleType.FK_fieldActivity
            )
        query = query.join(
            ProtocoleType,
            ProtocoleType.ID
            ==
            FieldActivity_ProtocoleType.FK_ProtocoleType
            )
        query = query.with_entities(*colToRet)
        query = query.order_by(
            asc(fieldActivity.ID),
            asc(FieldActivity_ProtocoleType.Order)
            )
        res = query

        dictOfFieldActivity = collections.OrderedDict()

        toRet = []
        for item in res:
            idFieldActivityToFind = getattr(item, 'ID')

            if idFieldActivityToFind not in dictOfFieldActivity:
                dictOfFieldActivity[idFieldActivityToFind] = dict(
                    ID=getattr(item, 'ID'),
                    Name=getattr(item, 'Name'),
                    Protocoles=[]
                    )

            curFieldActivity = dictOfFieldActivity.get(idFieldActivityToFind)

            curProtocleType = dict(
                    ID=getattr(item, 'Protocoles.ID'),
                    Name=getattr(item, 'Protocoles.Name'),
                    Order=getattr(item, 'Protocoles.Order')
                    )
            curFieldActivity['Protocoles'].append(curProtocleType)

        for key, value in dictOfFieldActivity.items():
            toRet.append(value)

        return toRet

    def patch(self):
        try:
            bodyJson = self.__request__.json
        except Exception:
            return HTTPClientError()

        session = self.__request__.dbsession

        for item in bodyJson:
            op = item.get('op', None)
            path = item.get('path', None)
            value = item.get('value', None)
            if op == 'add':
                lPath = path.split('/')
                try:
                    idFieldactivity = int(lPath[1])
                    idProtocole = value.get('ID', None)
                    orderProtocole = value.get('Order', None)
                except IndexError:
                    idFieldactivity = None
                    pass

                if (
                    idFieldactivity is None
                    or
                    idProtocole is None
                    or
                    orderProtocole is None
                ):
                    raise HTTPClientError(
                            f"Cannot process {item} "
                            f"'path' should be like /id/Procotoles and/or "
                            f"'value' should be like "
                            f"{{'ID': valueID , 'Order': valueOrder }}"
                        )

                query = session.query(FieldActivity_ProtocoleType)
                query = query.filter(
                    FieldActivity_ProtocoleType.FK_fieldActivity
                    ==
                    idFieldactivity,
                    FieldActivity_ProtocoleType.FK_ProtocoleType
                    ==
                    idProtocole
                    )
                existingInstance = query.first()

                if not existingInstance:
                    newInstance = FieldActivity_ProtocoleType(
                        FK_fieldActivity=idFieldactivity,
                        FK_ProtocoleType=idProtocole,
                        Order=orderProtocole
                    )
                    session.add(newInstance)
                else:
                    raise HTTPClientError(
                        f"Cannot process {item} "
                        f"Protocole {idProtocole} already exist "
                        f"for Fieldactivity {idFieldactivity}"
                        )
            if op == 'replace':
                lPath = path.split('/')
                try:
                    idFieldactivity = int(lPath[1])
                    idProtocole = int(lPath[3])
                    orderProtocole = int(value)
                except IndexError:
                    idFieldactivity = None
                    idProtocole = None
                    orderProtocole = None
                except ValueError:
                    idFieldactivity = None
                    idProtocole = None
                    orderProtocole = None
                if (
                    idFieldactivity is None
                    or
                    idProtocole is None
                    or
                    orderProtocole is None
                ):
                    raise HTTPClientError(
                            f"Cannot process {item} "
                            f"'path' should be like /id/Procotoles/id/Order and/or "
                            f"'value' should be an int "
                        )
                query = session.query(FieldActivity_ProtocoleType)
                query = query.filter(
                    FieldActivity_ProtocoleType.FK_fieldActivity
                    ==
                    idFieldactivity,
                    FieldActivity_ProtocoleType.FK_ProtocoleType
                    ==
                    idProtocole
                    )
                existingInstance = query.first()
                if not existingInstance:
                    raise HTTPClientError(
                        f"Cannot process {item} "
                        f"No row in db to update "
                    )
                else:
                    existingInstance.Order = orderProtocole
            if op == 'remove':
                lPath = path.split('/')
                try:
                    idFieldactivity = int(lPath[1])
                    idProtocole = int(lPath[3])
                except IndexError:
                    idFieldactivity = None
                    idProtocole = None
                except ValueError:
                    idFieldactivity = None
                    idProtocole = None
                if (
                    idFieldactivity is None
                    or
                    idProtocole is None
                ):
                    raise HTTPClientError(
                            f"Cannot process {item} "
                            f"'path' should be like /id/Procotoles/id"
                        )
                query = session.query(FieldActivity_ProtocoleType)
                query = query.filter(
                    FieldActivity_ProtocoleType.FK_fieldActivity
                    ==
                    idFieldactivity,
                    FieldActivity_ProtocoleType.FK_ProtocoleType
                    ==
                    idProtocole
                )
                existingInstance = query.first()
                if not existingInstance:
                    raise HTTPClientError(
                        f"Cannot process {item} "
                        f"No row in db to update "
                    )
                else:
                    session.delete(existingInstance)

        return HTTPOk()


class ProtocoleTypeCollection (MetaCollectionRessource):

    def __getitem__(self, name):
        try:
            val = int(name)
            return ProtocoleTypeRessource(val, self)
        except ValueError:
            print("WE GONNA RAISE ERROR")
            raise KeyError

    def retrieve(self):

        colToRet = [
            ProtocoleType.ID,
            ProtocoleType.Name,
            fieldActivity.ID.label("FieldActivities.ID"),
            fieldActivity.Name.label("FieldActivities.Name"),
            FieldActivity_ProtocoleType.Order.label("FieldActivities.Order")
        ]

        query = self.__request__.dbsession.query(ProtocoleType)
        query = query.outerjoin(
            FieldActivity_ProtocoleType,
            ProtocoleType.ID
            ==
            FieldActivity_ProtocoleType.FK_ProtocoleType
            )
        query = query.outerjoin(
            fieldActivity,
            fieldActivity.ID
            ==
            FieldActivity_ProtocoleType.FK_fieldActivity
            )
        query = query.filter(
            ProtocoleType.Status.in_([4, 10])
            )
        query = query.with_entities(*colToRet)
        query = query.order_by(
            asc(ProtocoleType.ID),
            asc(fieldActivity.ID)
            )
        res = query

        dictOfProtocoleType = collections.OrderedDict()

        toRet = []
        for item in res:
            idProtocoleTypeToFind = getattr(item, 'ID')

            if idProtocoleTypeToFind not in dictOfProtocoleType:
                dictOfProtocoleType[idProtocoleTypeToFind] = dict(
                    ID=getattr(item, 'ID'),
                    Name=getattr(item, 'Name'),
                    FieldActivities=[]
                    )

            curProtocleType = dictOfProtocoleType.get(idProtocoleTypeToFind)

            curFieldActivity = dict(
                    ID=getattr(item, 'FieldActivities.ID'),
                    Name=getattr(item, 'FieldActivities.Name'),
                    Order=getattr(item, 'FieldActivities.Order')
                    )
            if curFieldActivity.get('ID')  is not None:
                curProtocleType['FieldActivities'].append(curFieldActivity)

        for key, value in dictOfProtocoleType.items():
            toRet.append(value)

        return toRet


class ProtocoleTypeRessource(MetaItemRessource):

    def retrieve(self):

        colToRet = [
            ProtocoleType.ID,
            ProtocoleType.Name,
            fieldActivity.ID.label("FieldActivities.ID"),
            fieldActivity.Name.label("FieldActivities.Name"),
            FieldActivity_ProtocoleType.Order.label("FieldActivities.Order")
        ]

        query = self.__request__.dbsession.query(ProtocoleType)
        query = query.join(
            FieldActivity_ProtocoleType,
            ProtocoleType.ID
            ==
            FieldActivity_ProtocoleType.FK_ProtocoleType
            )
        query = query.join(
            fieldActivity,
            fieldActivity.ID
            ==
            FieldActivity_ProtocoleType.FK_fieldActivity
            )
        query = query.with_entities(*colToRet)
        query = query.filter(ProtocoleType.ID == self.__name__)
        query = query.order_by(
            asc(ProtocoleType.ID),
            asc(fieldActivity.ID)
            )
        res = query

        dictOfProtocoleType = collections.OrderedDict()

        toRet = []
        for item in res:
            idProtocoleTypeToFind = getattr(item, 'ID')

            if idProtocoleTypeToFind not in dictOfProtocoleType:
                dictOfProtocoleType[idProtocoleTypeToFind] = dict(
                    ID=getattr(item, 'ID'),
                    Name=getattr(item, 'Name'),
                    FieldActivities=[]
                    )

            curProtocleType = dictOfProtocoleType.get(idProtocoleTypeToFind)

            curFieldActivity = dict(
                    ID=getattr(item, 'FieldActivities.ID'),
                    Name=getattr(item, 'FieldActivities.Name'),
                    Order=getattr(item, 'FieldActivities.Order')
                    )
            curProtocleType['FieldActivities'].append(curFieldActivity)

        for key, value in dictOfProtocoleType.items():
            toRet.append(value)

        return toRet


class FieldActivityRessource(MetaItemRessource):

    __acl__ = context_permissions['formbuilder']

    def __init__(self, name, ref):
        self.__name__ = name
        self.__parent__ = ref
        self.__request__ = ref.__request__

    def __getitem__(self, name):
        if name == 'FieldActivity_ProtocoleType':
            return FieldActivityProtocoleTypeCollection(name, self)
        else:
            raise KeyError

    def retrieve(self):
        item = self.__request__.dbsession.query(fieldActivity).get(self.__name__)

        return {
                'ID' : getattr(item, 'ID'),
                'Name': getattr(item, 'Name')
                }
