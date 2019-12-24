from ecoreleve_server.modules.permissions import context_permissions
from pyramid.httpexceptions import HTTPBadRequest
from ecoreleve_server.traversal.core import (
    MetaCollectionRessource,
    MetaItemRessource,
    MetaEmptyNodeRessource
)
from ecoreleve_server.database.sensor_db import (
    Gsm,
    ArgosGps
)
from ecoreleve_server.database.main_db import (
    Sensor,
    Equipment
)
from sqlalchemy import asc, and_, exists
from sqlalchemy.orm import aliased
from webargs.pyramidparser import parser
from ecoreleve_server.utils.decorator import timing


class Validate(MetaEmptyNodeRessource):
    '''
    it's dirty but need to deliver fast and i don't really know
    how to handle this in RESTFUll way

    Validate is a special feature

    That's mix Equipment, Sensor and Individual
    Why?
    Because we collect datas by Sensor Unicidentifier
    and put every datas in locations Table (TargosGps or Tgsm) in SENSOR Database

    In ERD we just want location attached to a session and an individual
    and imported them in Individual_Locations

    '''
    __acl__ = context_permissions['formbuilder']

    def __getitem__(self,name):
        if name == 'argos':
            return ARGOSValidate(name=name, parent=self, request=self.request)
        if name == 'gsm':
            return GSMValidate(name=name, parent=self, request=self.request)
        else:
            raise KeyError




class ARGOSValidate(MetaCollectionRessource):
    __acl__ = context_permissions['formbuilder']
    dbModel = ArgosGps

    # this is the default query for retrieve ARGOSvalidate data
    defaultParams = {
        'checked': 0,
        'Status' : 'ok'
    }

    # parser is a decorator from webargs library
    # pls read the doc :)
    @timing
    @parser.use_args(dbModel.queryStringAllowedParams)
    def retrieve(self,args):
        args.update(self.defaultParams)# will add or reset value in args with value in default

        def applyFilters(query,args):
            for item in args:
                attrInModel = getattr(self.dbModel, item,None)
                value       = args.get(item)
                if attrInModel is not None:
                    #TODO TYPE, and OPERATOR
                    if isinstance(value,list):
                        query = query.filter(attrInModel.in_(value))
                    if isinstance(value, (int,float)):
                        query = query.filter(attrInModel == value)
                    if isinstance(value,(str)):
                        query = query.filter(attrInModel == value)
                else:
                    continue

            return query


        listCols = []
        for item in self.dbModel.__table__.columns:
            print("allo")
            # if item.key in ['FK_ptt',]
            listCols.append(item)

        e  = aliased(Equipment)
        e1 = aliased(Equipment)
        ee = aliased(Equipment)

        subQ = self.request.dbsession.query(
            ee.ID,
            ee.FK_Sensor,
            ee.FK_Individual,
            ee.FK_Sensor,
            ee.StartDate,
            ee.Deploy,
            ee.FK_MonitoredSite
            )
        subQ = subQ.filter(
            and_(
                ee.FK_Sensor == e1.FK_Sensor,
                ee.FK_Individual == e1.FK_Individual,
                ee.StartDate < e1.StartDate,
                e.StartDate < ee.StartDate
                )
            )

        individualEquipentmViewQuery = self.request.dbsession.query(
            e.ID,
            e.FK_Sensor,
            e.FK_Individual,
            e.StartDate.label('StartDate'),
            e1.StartDate.label('EndDate')
            )
        individualEquipentmViewQuery = individualEquipentmViewQuery.outerjoin(
            e1,
            and_(
                e.FK_Individual == e1.FK_Individual,
                e.FK_Sensor==e1.FK_Sensor,
                e.ID != e1.ID,
                e.StartDate < e1.StartDate,
                e1.Deploy == 0,
                ~subQ.exists()
                )
            )
        individualEquipentmViewQuery = individualEquipentmViewQuery.filter(
            and_(
                e.Deploy==1,
                e.FK_Individual != None
                )
            )


        # t = aliased(individualEquipentmViewQuery)
        VArgosData_With_EquipIndiv = self.request.dbsession.query(
            self.dbModel
            )

        query   = self.request.dbsession.query(self.dbModel).with_entities(*listCols)
        query   = applyFilters(query,args)
        query   = query.order_by(asc(ArgosGps.pk_id))
        # query   = query.group_by(ArgosGps.ptt)
        query   = query.limit(args.get('limit'))
        query   = query.offset(args.get('offset'))

        qStr    = query.statement.compile(compile_kwargs={"literal_binds": True })

        print(f"{str(qStr)}")
        res     = query.all()

        toRet = []
        for item in res:
            toRet.append(item._asdict())

        return toRet
        return ' alors on veut retrieve les données a argos a valider ????'


class GSMValidate(MetaCollectionRessource):
    __acl__ = context_permissions['formbuilder']

    dbModel = Gsm

    def retrieve(self):
        return ' alors on veut retrieve les données GSM a valider ????'





