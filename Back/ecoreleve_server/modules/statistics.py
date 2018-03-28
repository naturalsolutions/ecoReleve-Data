from collections import OrderedDict
import datetime
import operator
import transaction
from operator import itemgetter
from pyramid import threadlocal
from pyramid.view import view_config
from sqlalchemy import (
    func,
    cast,
    Date,
    select,
    and_,
)

from ecoreleve_server.core import Base
from .individuals import Individual, Individual_Location
from .stations import Station
from .sensors.sensor_data import Rfid, Gsm, ArgosGps

pendingSensorData = []
indivLocationData = []
stationData = []
graphDataDate = {'indivLocationData': None, 'pendingSensorData': None}


@view_config(route_name='weekData', renderer='json')
def weekData(request):
    session = request.dbsession
    today = datetime.date.today()
    data = {
        'label': [str(today - datetime.timedelta(days=i)) for i in range(1, 8)],
        'Argos': [0] * 7,
        'GPS': [0] * 7,
        'GSM': [0] * 7
    }

    # Argos data
    argos_query = select(
        [cast(ArgosGps.date, Date).label('date'), func.count('*').label('nb')]
    ).where(and_(ArgosGps.date >= today - datetime.timedelta(days=7), ArgosGps.type_ == 'arg')
            ).group_by(cast(ArgosGps.date, Date)
                       )
    for date, nb in session.execute(argos_query).fetchall():
        try:
            i = data['label'].index(str(date))
            data['Argos'][i] = nb
        except:
            pass

    # GPS data
    gps_query = select(
        [cast(ArgosGps.date, Date).label('date'), func.count('*').label('nb')]
    ).where(and_(ArgosGps.date >= today - datetime.timedelta(days=7), ArgosGps.type_ == 'gps')
            ).group_by(cast(ArgosGps.date, Date))
    for date, nb in session.execute(gps_query).fetchall():
        try:
            i = data['label'].index(str(date))
            data['GPS'][i] = nb
        except:
            pass

    gsm_query = select(
        [cast(Gsm.date, Date).label('date'), func.count(Gsm.pk_id).label('nb')]
    ).where(Gsm.date >= today - datetime.timedelta(days=7)
            ).group_by(cast(Gsm.date, Date))
    for date, nb in session.execute(gsm_query).fetchall():
        try:
            i = data['label'].index(str(date))
            data['GSM'][i] = nb
        except:
            pass
    transaction.commit()
    return data


@view_config(route_name='station_graph', renderer='json')
def station_graph(request):
    session = request.dbsession
    result = OrderedDict()

    today = datetime.date.today()
    begin_date = datetime.date(day=1, month=today.month, year=today.year - 1)
    end_date = datetime.date(day=1, month=today.month, year=today.year)

    query = select([
        func.count(Station.ID).label('nb'),
        func.year(Station.StationDate).label('year'),
        func.month(Station.StationDate).label('month')]
    ).where(and_(Station.StationDate >= begin_date, Station.StationDate < end_date)
            ).group_by(func.year(Station.StationDate), func.month(Station.StationDate)
                       )
    """
            Execute query and sort result by year, month
            (faster than an order_by clause in this case)
    """
    data = session.execute(query).fetchall()
    for nb, y, m in sorted(data, key=operator.itemgetter(1, 2)):
        d = datetime.date(day=1, month=m, year=y).strftime('%b')
        result[' '.join([d, str(y)])] = nb
    return result


@view_config(route_name='location_graph', renderer='json')
def location_graph(request):
    session = request.dbsession
    data = []
    query = select([Individual_Location.type_, func.count('*').label('nb')]
                   ).group_by(Individual_Location.type_)

    global graphDataDate
    global indivLocationData

    d = datetime.datetime.now() - datetime.timedelta(days=1)
    nbArg = 0
    if graphDataDate['indivLocationData'] is None or graphDataDate['indivLocationData'] < d:
        graphDataDate['indivLocationData'] = datetime.datetime.now()
        for row in session.execute(query).fetchall():
            curRow = OrderedDict(row)
            lab = curRow['type_'].upper()
            if 'ARG' in lab:
                try:
                    nbArg = nbArg + curRow['nb']
                except:
                    nbArg = curRow['nb']
            else:
                data.append({'value': curRow['nb'], 'label': lab})
        data.append({'value': nbArg, 'label': 'ARGOS'})
        data.sort(key=itemgetter('label'))
        indivLocationData = data

    return indivLocationData


@view_config(route_name='uncheckedDatas_graph', renderer='json')
def uncheckedDatas_graph(request):
    viewArgos = Base.metadata.tables['VArgosData_With_EquipIndiv']
    queryArgos = select([viewArgos.c['type'].label('type'),
                         func.count('*').label('nb')]
                        ).where(viewArgos.c['checked'] == 0
                                ).group_by(viewArgos.c['type'])

    viewGSM = Base.metadata.tables['VGSMData_With_EquipIndiv']
    queryGSM = select([func.count('*').label('nb')]
                      ).where(viewGSM.c['checked'] == 0)

    queryRFID = select([func.count('*').label('nb')]
                       ).where(Rfid.checked == 0)
    data = []

    session1 = threadlocal.get_current_registry().dbmaker()
    session2 = threadlocal.get_current_registry().dbmaker()
    session3 = threadlocal.get_current_registry().dbmaker()

    global graphDataDate
    global pendingSensorData

    d = datetime.datetime.now() - datetime.timedelta(days=1)

    if graphDataDate['pendingSensorData'] is None or graphDataDate['pendingSensorData'] < d:
        graphDataDate['pendingSensorData'] = datetime.datetime.now()

        argosData = session1.execute(queryArgos).fetchall()
        for row in argosData:
            curRow = OrderedDict(row)
            lab = curRow['type'].upper()
            if lab == 'ARG':
                lab = 'ARGOS'
            data.append({'value': curRow['nb'], 'label': lab})

        for row in session2.execute(queryGSM).fetchall():
            curRow = OrderedDict(row)
            data.append({'value': curRow['nb'], 'label': 'GSM'})

        for row in session3.execute(queryRFID).fetchall():
            curRow = OrderedDict(row)
            data.append({'value': curRow['nb'], 'label': 'RFID'})
        data.sort(key=itemgetter('label'))
        pendingSensorData = data

    session1.close()
    session2.close()
    session3.close()

    return pendingSensorData


@view_config(route_name='individual_graph', renderer='json')
def individual_graph(request):
    session = request.dbsession
    result = OrderedDict()
    today = datetime.date.today()
    begin_date = datetime.date(day=1, month=today.month, year=today.year - 1)
    end_date = datetime.date(day=1, month=today.month, year=today.year)

    query = select([
        func.count('*').label('nb'),
        func.year(Individual.creationDate).label('year'),
        func.month(Individual.creationDate).label('month')]
    ).where(and_(Individual.creationDate >= begin_date, Individual.creationDate < end_date)
            ).group_by(func.year(Individual.creationDate), func.month(Individual.creationDate)
                       )
    data = session.execute(query).fetchall()
    for nb, y, m in sorted(data, key=operator.itemgetter(1, 2)):
        d = datetime.date(day=1, month=m, year=y).strftime('%b')
        result[' '.join([d, str(y)])] = nb
    return result


@view_config(route_name='individual_monitored', renderer='json')
def individual_monitored(request):
    session = request.dbsession
    table = Base.metadata.tables['IndividualDynPropValuesNow']
    query = select([
        func.count('*').label('nb'), table.c['ValueString'].label('label')
    ]).select_from(table
                   ).where(table.c['FK_IndividualDynProp'] == 37
                           ).group_by(table.c['ValueString'])

    data = []
    for row in session.execute(query).fetchall():
        curRow = OrderedDict(row)
        data.append({'value': curRow['nb'], 'label': curRow['label']})
    return data
