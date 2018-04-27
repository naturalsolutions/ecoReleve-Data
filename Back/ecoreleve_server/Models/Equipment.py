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
    exists,
    text,
    bindparam)
from sqlalchemy.orm import aliased
from pyramid import threadlocal
from datetime import timedelta
from sqlalchemy.orm import relationship


class Equipment(Base):
    __tablename__ = 'Equipment'

    ID = Column(Integer, Sequence('Equipment__id_seq'), primary_key=True)
    FK_Sensor = Column(Integer, ForeignKey('Sensor.ID'))
    FK_Individual = Column(Integer, ForeignKey('Individual.ID'))
    FK_MonitoredSite = Column(Integer, ForeignKey('MonitoredSite.ID'))
    FK_Observation = Column(Integer, ForeignKey('Observation.ID'))
    StartDate = Column(DateTime, default=func.now())
    Deploy = Column(Boolean)

    Individuals = relationship('Individual')
    MonitoredSites = relationship('MonitoredSite')



def checkEquip(fk_sensor, equipDate, fk_indiv=None, fk_site=None):
    session = threadlocal.get_current_registry().dbmaker()

    query = text('''DECLARE @result int;
                 EXEC dbo.[pr_checkSensorAvailability] :date, :sensorID, @result OUTPUT;
                 SELECT @result
                 ''').bindparams(bindparam('sensorID', fk_sensor),
                                 bindparam('date', equipDate))
    Nb = session.execute(query).scalar()
    if Nb > 0:
        return True
    else:
        return {'equipment_error': True}


def checkUnequip(fk_sensor, equipDate, fk_indiv=None, fk_site=None):
    session = threadlocal.get_current_request().dbsession
    query = text('''DECLARE @result int;
                EXEC dbo.[pr_CheckSensorUnequipment] :date, :sensorID, :siteID, :indID, @result OUTPUT;
                SELECT @result
                ''').bindparams(bindparam('sensorID', fk_sensor),
                                bindparam('siteID', fk_site),
                                bindparam('indID', fk_indiv),
                                bindparam('date', equipDate))
    Nb = session.execute(query).scalar()
    if Nb > 0:
        return True
    else:
        msg = True
        if fk_indiv:
            msg = 'Individual'
        if fk_site:
            msg = 'Monitored Site'

        return {'unequipment_error': msg}


@event.listens_for(Observation.Station, 'set')
def set_equipment(target, value=None, oldvalue=None, initiator=None):
    typeName = target._type.Name
    curSta = value

    if 'equipment' in typeName.lower() and typeName.lower() != 'station_equipment':
        try:
            equipDate = target.Station.StationDate
        except:
            equipDate = curSta.StationDate

        if 'unequip' in typeName.lower():
            deploy = 0
            equipDate = equipDate - timedelta(seconds=1)
        else:
            deploy = 1

        fk_sensor = int(target.values.get('FK_Sensor', None))
        if 'individual' in typeName.lower():
            fk_indiv = target.values.get('FK_Individual', None)
            fk_site = None
        elif 'site' in typeName.lower():
            fk_site = curSta.values.get('FK_MonitoredSite', None)
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
              ):
            target.Equipment.FK_Individual = fk_indiv
        else:
            raise(ErrorAvailable(availability))


class ErrorAvailable(Exception):

    def __init__(self, value):
        self.value = value
        print("PTT Not available")

    def __str__(self):
        return repr(self.value)