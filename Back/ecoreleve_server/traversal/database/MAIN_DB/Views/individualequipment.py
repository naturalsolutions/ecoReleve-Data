from sqlalchemy import (
    and_,
    asc,
    Column,
    exists,
    ForeignKey,
    Integer,
    select,
    String
)
from sqlalchemy_utils.view import create_view
from sqlalchemy.orm import aliased

from ecoreleve_server.core import Base
from ecoreleve_server.modules.observations import Equipment
from ecoreleve_server.modules.sensors import Sensor


class IndividualEquipment(Base):
    def generateStatement():

        e  = aliased(Equipment)
        e1 = aliased(Equipment)
        ee = aliased(Equipment)


        subQuery = select([
                        ee.ID,
                        ee.FK_Sensor,
                        ee.FK_Individual,
                        ee.FK_Sensor,
                        ee.StartDate,
                        ee.Deploy,
                        ee.FK_MonitoredSite
                    ])
        subQuery = subQuery.select_from(e)
        subQuery = subQuery.filter(
            and_(
                ee.FK_Sensor == e1.FK_Sensor,
                ee.FK_Individual == e1.FK_Individual,
                ee.StartDate < e1.StartDate,
                e.StartDate < ee.StartDate
                )
            )

        stmt = select([
            e.ID,
            e.FK_Sensor,
            e.FK_Individual,
            e.StartDate.label('StartDate'),
            e1.StartDate.label('EndDate')
        ])
        stmt = stmt.outerjoin(
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

        stmt = stmt.filter(
            and_(
                e.Deploy==1,
                e.FK_Individual != None
                )
            )

        return stmt

    a = generateStatement()
    print(a)

    __table__ = create_view(
        name='IndividualEquipment',
        selectable=a,
        metadata = db.Model.metadata
    )



    
