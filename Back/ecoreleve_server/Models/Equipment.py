from ..Models import Base, Observation, Individual, Sensor
from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Integer,
    Sequence,
    Boolean,
    and_,
    func,
    event,
    select,
    exists)
from sqlalchemy.orm import aliased
from pyramid import threadlocal
from datetime import timedelta


class Equipment(Base):
    __tablename__ = 'Equipment'

    ID = Column(Integer, Sequence('Equipment__id_seq'), primary_key=True)
    FK_Sensor = Column(Integer, ForeignKey('Sensor.ID'))
    FK_Individual = Column(Integer, ForeignKey('Individual.ID'))
    FK_MonitoredSite = Column(Integer, ForeignKey('MonitoredSite.ID'))
    FK_Observation = Column(Integer, ForeignKey('Observation.ID'))
    StartDate = Column(DateTime, default=func.now())
    Deploy = Column(Boolean)

    def linkProperty(self, StartDate, **kwargs):
        session = threadlocal.get_current_request().dbsession
        curIndiv = session.query(Individual).get(self.FK_Individual)
        curSensor = session.query(Sensor).get(self.FK_Sensor)
        curIndiv.init_on_load()
        curSensor.init_on_load()
        curSensor.UpdateFromJson(kwargs, StartDate)
        curIndiv.UpdateFromJson(kwargs, StartDate)


def checkSensor(fk_sensor, equipDate, fk_indiv=None, fk_site=None):
    session = threadlocal.get_current_registry().dbmaker()
    e2 = aliased(Equipment)

    subQuery = select([e2]).where(
        and_(e2.FK_Sensor == Equipment.FK_Sensor,
             and_(e2.StartDate > Equipment.StartDate, e2.StartDate < equipDate)
             )
    )

    query = select([Equipment]).where(
        and_(~exists(subQuery),
             and_(Equipment.StartDate < equipDate,
                  and_(Equipment.Deploy == 1, Equipment.FK_Sensor == Sensor.ID))
             )
    )

    fullQuery = select([Sensor.ID]
                       ).where(
        and_(~exists(query), Sensor.ID == fk_sensor)
    )

    Nb = len(session.execute(fullQuery).fetchall())
    if Nb > 0:
        return True
    else:
        return None


def checkEquip(fk_sensor, equipDate, fk_indiv=None, fk_site=None):
    availableToEquip = True
    availableSensor = checkSensor(fk_sensor, equipDate)

    if availableToEquip is True and availableSensor is True:
        return True
    else:
        availability = {'Sensor_ID': fk_sensor,
                        'Individual_ID': fk_indiv, 'MonitoredSite_ID': fk_site}
        if availableToEquip is None:
            availability['indiv'] = False
            if availableSensor is None:
                availability['sensor_available'] = False
            else:
                availability['sensor_available'] = True
        else:
            if fk_indiv is not None:
                availability['indiv_available'] = True
            availability['sensor_available'] = False
        return availability


def existingEquipment(fk_sensor, equipDate, fk_indiv=None):
    session = threadlocal.get_current_registry().dbmaker()
    e1 = aliased(Equipment)

    subQuery = select([e1]).where(and_(e1.FK_Sensor == Equipment.FK_Sensor,
                                       and_(e1.FK_Individual == Equipment.FK_Individual,
                                            and_(e1.StartDate > Equipment.StartDate,
                                                 e1.StartDate <= equipDate))))

    query = select([Equipment]).where(and_(~exists(subQuery),
                                           and_(Equipment.StartDate <= equipDate,
                                                and_(Equipment.Deploy == 1,
                                                     and_(Equipment.FK_Sensor == fk_sensor,
                                                          Equipment.FK_Individual == fk_indiv)))))
    fullQuery = select([True]).where(exists(query))

    result = session.execute(fullQuery).scalar()
    return result


def alreadyUnequip(fk_sensor, equipDate, fk_indiv=None, fk_site=None):
    session = threadlocal.get_current_request().dbsession
    e1 = aliased(Equipment)

    subQuery = select([e1]
                      ).where(
        and_(e1.FK_Sensor == Equipment.FK_Sensor,
             and_(e1.StartDate > Equipment.StartDate, e1.StartDate <= equipDate)
             )
    )

    query = select([func.count(Equipment.ID)]).where(
        and_(~exists(subQuery),
             and_(Equipment.StartDate <= equipDate,
                  and_(Equipment.Deploy == 1,
                       and_(Equipment.FK_Sensor == fk_sensor,
                            and_(Equipment.FK_Individual == fk_indiv,
                                 Equipment.FK_MonitoredSite == fk_site)
                            )
                       )
                  )
             )
    )

    fullQuery = query
    result = session.execute(fullQuery).scalar()
    if result > 0:
        return None
    else:
        return True


def checkUnequip(fk_sensor, equipDate, fk_indiv=None, fk_site=None):
    existing = existingEquipment(fk_sensor, equipDate, fk_indiv=fk_indiv)
    unequip = alreadyUnequip(fk_sensor, equipDate,
                             fk_indiv=fk_indiv, fk_site=fk_site)

    if existing and unequip is None:
        availability = True
    else:
        availability = {'Sensor_ID': fk_sensor,
                        'Individual_ID': fk_indiv, 'MonitoredSite_ID': fk_site}
        if existing is None:
            availability['existing_equipment'] = False
            if existing:
                availability['already_unequip'] = True
            else:
                availability['already_unequip'] = False
        else:
            availability['existing_equipment'] = True
            availability['already_unequip'] = True

    return availability


@event.listens_for(Observation.Station, 'set')
def set_equipment(target, value=None, oldvalue=None, initiator=None):
    typeName = target.GetType().Name
    curSta = value

    if 'equipment' in typeName.lower() and typeName.lower() != 'station equipment':
        try:
            equipDate = target.Station.StationDate
        except:
            equipDate = curSta.StationDate

        if 'unequip' in typeName.lower():
            deploy = 0
            equipDate = equipDate - timedelta(seconds=1)
        else:
            deploy = 1

        fk_sensor = target.GetProperty('FK_Sensor')
        if 'individual' in typeName.lower():
            fk_indiv = target.GetProperty('FK_Individual')
            fk_site = None
        elif 'site' in typeName.lower():
            fk_site = target.Station.GetProperty('FK_MonitoredSite')
            fk_indiv = None
            if fk_site is None:
                raise ErrorAvailable({'errorSite': True})

        if deploy == 1:
            availability = checkEquip(
                fk_sensor=fk_sensor,
                equipDate=equipDate,
                fk_indiv=fk_indiv,
                fk_site=fk_site)
        else:
            availability = checkUnequip(
                fk_sensor=fk_sensor,
                equipDate=equipDate,
                fk_indiv=fk_indiv,
                fk_site=fk_site)

        if availability is True:
            curEquip = Equipment(FK_Sensor=fk_sensor,
                                 StartDate=equipDate,
                                 FK_Individual=fk_indiv,
                                 FK_MonitoredSite=fk_site,
                                 Deploy=deploy)
            target.Equipment = curEquip

        elif (isinstance(target.Equipment, Equipment)
                and target.Equipment.FK_Sensor == fk_sensor
                and fk_indiv is not None):
            target.Equipment.FK_Individual = fk_indiv
        else:
            raise(ErrorAvailable(availability))


class ErrorAvailable(Exception):

    def __init__(self, value):
        self.value = value
        print("PTT Not available")

    def __str__(self):
        return repr(self.value)
