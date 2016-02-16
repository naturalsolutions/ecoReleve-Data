from ..Models import Base,DBSession,Observation,Individual,Sensor
from sqlalchemy import (
    Column,
     DateTime,
     Float,
     ForeignKey,
     Index,
     Integer,
     Numeric,
     String,
     Text,
     Unicode,
     text,
     Sequence,
     Boolean,
    orm,
    and_,
    func,
    event,
    select,
    exists,
    or_)
from sqlalchemy.dialects.mssql.base import BIT
from sqlalchemy.orm import relationship,aliased
from datetime import datetime
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.orm import relationship, backref
import pyramid.httpexceptions as exc
import transaction
from pyramid import threadlocal
from traceback import print_exc


class Equipment(Base):
    __tablename__ = 'Equipment'

    ID = Column(Integer,Sequence('Equipment__id_seq'), primary_key=True)
    FK_Sensor = Column(Integer, ForeignKey('Sensor.ID'))
    FK_Individual = Column(Integer, ForeignKey('Individual.ID'))
    FK_MonitoredSite = Column(Integer, ForeignKey('MonitoredSite.ID'))
    FK_Observation = Column(Integer, ForeignKey('Observation.ID'))
    StartDate = Column(DateTime,default = func.now())
    Deploy = Column(Boolean)

    def linkProperty(self,StartDate,**kwargs):
        session = threadlocal.get_current_request().dbsession
        curIndiv = session.query(Individual).get(self.FK_Individual)
        curSensor = session.query(Sensor).get(self.FK_Sensor)
        curIndiv.init_on_load()
        curSensor.init_on_load()
        curSensor.UpdateFromJson(kwargs,StartDate)
        curIndiv.UpdateFromJson(kwargs,StartDate)


def checkSensor(fk_sensor,equipDate,fk_indiv=None,fk_site=None):
    session = threadlocal.get_current_registry().dbmaker()
    # session = threadlocal.get_current_request().dbsession
    # if fk_indiv is not None :
    #     table = Base.metadata.tables['IndividualEquipment']
    #     fk = 'FK_Individual'
    # else :
    #     table = Base.metadata.tables['MonitoredSiteEquipment']
    #     fk = 'MonitoredSite'

    # subQuery = select(table.c
    #     ).where(table.c['FK_Sensor'] == fk_sensor
    #     ).where(table.c['StartDate'] < equipDate
    #     ).where(or_(table.c['EndDate'] == None,table.c['EndDate'] > equipDate ))

    # fullQuery = select([True]).where(~exists(subQuery))
    # sensorEquip = session.execute(fullQuery).scalar()
    # return sensorEquip

    e1 = aliased(Equipment)
    subQuery = select([e1]).where(and_(e1.FK_Sensor == Equipment.FK_Sensor
        ,and_(e1.StartDate>Equipment.StartDate,e1.StartDate<=equipDate)))

    query = select([Equipment]).where(and_(~exists(subQuery)
        ,and_(Equipment.StartDate<=equipDate
            ,and_(Equipment.Deploy == 0,Equipment.FK_Sensor == fk_sensor))))

    fullQuery = select([True]).where(or_(exists(query),~exists(select([Equipment]).where(Equipment.FK_Sensor==fk_sensor) ) ) ) 
    sensorEquip = session.execute(fullQuery).scalar()
    # session.close()
    return sensorEquip

def checkEquip(fk_sensor,equipDate,fk_indiv=None,fk_site=None):
    availableToEquip = True
    availableSensor = checkSensor(fk_sensor,equipDate)

    if availableToEquip is True and availableSensor is True:
        return True
    else :
        availability = {'Sensor_ID':fk_sensor, 'Individual_ID':fk_indiv, 'MonitoredSite_ID':fk_site}
        if availableToEquip is None :
            availability['indiv'] = False
            if availableSensor is None:
                availability['sensor_available'] = False
            else :
                availability['sensor_available'] = True
        else:
            if fk_indiv is not None:
                availability['indiv_available'] = True
            availability['sensor_available'] = False
        return availability

def existingEquipment (fk_sensor,equipDate,fk_indiv=None):
    session = threadlocal.get_current_registry().dbmaker()
    # session = threadlocal.get_current_request().dbsession
    e1 = aliased(Equipment)
    subQuery = select([e1]).where(and_(e1.FK_Sensor == Equipment.FK_Sensor,and_(e1.FK_Individual == Equipment.FK_Individual,and_(e1.StartDate>Equipment.StartDate,e1.StartDate<=equipDate))))
    query = select([Equipment]).where(and_(~exists(subQuery),and_(Equipment.StartDate<=equipDate,and_(Equipment.Deploy == 1,and_(Equipment.FK_Sensor == fk_sensor,Equipment.FK_Individual == fk_indiv)))))
    fullQuery = select([True]).where(exists(query))

    result = session.execute(fullQuery).scalar()
    # session.close()
    return result

def alreadyUnequip (fk_sensor,equipDate,fk_indiv=None,fk_site=None):
    session = threadlocal.get_current_request().dbsession
    objToUnequip = None

    if fk_indiv is None:
        table = Base.metadata.tables['MonitoredSiteEquipment']
        objToUnequip = 'FK_MonitoredSite'
        val = fk_site
    else:
        table = Base.metadata.tables['IndividualEquipment']
        objToUnequip = 'FK_Individual'
        val = fk_indiv


    # e1 = aliased(Equipment)
    # e2 = aliased(Equipment)
    # subQueryExists = select([e1]).where(and_(e1.FK_Sensor == Equipment.FK_Sensor
    #     ,and_(e1.__table__.c[objToUnequip] == Equipment.__table__.c[objToUnequip]
    #         ,and_(e1.StartDate>Equipment.StartDate,e1.StartDate<=equipDate))))

    # query = select([Equipment]).where(and_(~exists(subQueryExists)
    #     ,and_(Equipment.StartDate<=equipDate,and_(Equipment.Deploy == 1
    #         ,and_(Equipment.FK_Sensor == fk_sensor,Equipment.__table__.c[objToUnequip] == fk_indiv)))))

    # subQueryUnequip = select([e2]).where(and_(e2.__table__.c[objToUnequip] == Equipment.__table__.c[objToUnequip]
    #     ,and_(e2.StartDate>Equipment.StartDate
    #         ,and_(e2.FK_Sensor == Equipment.FK_Sensor,and_(e2.Deploy == 0,e2.StartDate<=equipDate)))))

    # query = query.where(~exists(subQueryUnequip))
    query = select(table.c
        ).where(table.c['FK_Sensor'] == fk_sensor
        ).where(table.c[objToUnequip] == val
        ).where(table.c['EndDate'] == None)
    fullQuery = select([True]).where(~exists(query))

    result = session.execute(fullQuery).scalar()
    # session.close()
    return result

def checkUnequip(fk_sensor,equipDate,fk_indiv=None,fk_site=None):
    existing = existingEquipment(fk_sensor,equipDate,fk_indiv=fk_indiv)
    unequip = alreadyUnequip (fk_sensor,equipDate,fk_indiv=fk_indiv,fk_site=fk_site)

    if existing and unequip is None:
        availability = True
    else :
        availability = {'Sensor_ID':fk_sensor, 'Individual_ID':fk_indiv, 'MonitoredSite_ID':fk_site}
        if existing is None:
            availability['existing_equipment'] = False
            if existing:
                availability['already_unequip'] = True
            else : 
                availability['already_unequip'] = False
        else :
            availability['existing_equipment'] = True
            availability['already_unequip'] = True

    return availability


@event.listens_for(Observation.Station, 'set')
def set_equipment(target, value=None, oldvalue=None, initiator=None):
    typeName = target.GetType().Name
    curSta = value
    if 'unequip' in typeName.lower():
        deploy = 0
    else :
        deploy  = 1

        try : Survey_type = target.GetProperty('Survey_type') 
        except : Survey_type = None
        try : Monitoring_Status = target.GetProperty('Monitoring_Status') 
        except : Monitoring_Status = None
        try : Status = target.GetProperty('Sensor_Status') 
        except : Status = None

    if 'equipment' in typeName.lower() and typeName.lower() != 'station equipment':
        try : 
            equipDate = target.Station.StationDate
        except :
            equipDate = curSta.StationDate
            
        fk_sensor = target.GetProperty('FK_Sensor') 
        if 'individual' in typeName.lower():
            fk_indiv = target.GetProperty('FK_Individual')
            fk_site = None
        elif 'site' in typeName.lower():
            fk_site = target.Station.GetProperty('FK_MonitoredSite')
            fk_indiv = None

        if deploy == 1 :
            availability = checkEquip(fk_sensor=fk_sensor
                ,equipDate=equipDate,fk_indiv=fk_indiv,fk_site=fk_site)
        else:
            availability = checkUnequip(fk_sensor=fk_sensor
                ,equipDate=equipDate,fk_indiv=fk_indiv,fk_site=fk_site)

        if availability is True:
            curEquip = Equipment(FK_Sensor = fk_sensor
            , StartDate = equipDate,FK_Individual = fk_indiv, FK_MonitoredSite = fk_site
            , Deploy = deploy)
            target.Equipment = curEquip
            if deploy == 1 and fk_indiv is not None :
                curEquip.linkProperty(equipDate,Survey_type = Survey_type ,Monitoring_Status = Monitoring_Status,Status = Status)
        elif isinstance(target.Equipment,Equipment) and target.Equipment.FK_Sensor == fk_sensor and deploy == 1 and fk_indiv is not None:
            target.Equipment.FK_Individual = fk_indiv
            target.Equipment.linkProperty(equipDate,Survey_type = Survey_type ,Monitoring_Status = Monitoring_Status,Status = Status)
        else:
            raise(ErrorAvailable(availability))

@event.listens_for(Equipment, 'after_delete')
def unlinkEquipement(mapper, connection, target):
    session = threadlocal.get_current_request().dbsession
    # session = threadlocal.get_current_registry().dbmaker()

    curIndiv = session.query(Individual).get(target.FK_Individual)
    curSensor = session.query(Sensor).get(target.FK_Sensor)

    dynPropToDel = curIndiv.GetDynPropWithDate(['Survey_type','Monitoring_Status'],target.StartDate)
    dynPropToDel.append(curSensor.GetDynPropWithDate('Status',target.StartDate))

    for dynprop in dynPropToDel:
        session.delete(dynprop)

class ErrorAvailable(Exception):
     def __init__(self, value):
         self.value = value
         print("PTT Not available")
     def __str__(self):
        return repr(self.value)
