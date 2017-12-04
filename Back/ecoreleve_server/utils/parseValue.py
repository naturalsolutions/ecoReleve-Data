from pyramid import threadlocal
from ..Models import Base
from sqlalchemy import select
from datetime import datetime


dictVal = {
    'null': None,
    '': None,
    'true': 1,
    'false': 0,
    'NULL': None,
    'None': None
}


def parser(value):
    for func in [dateParser, nullBitParser]:
        value = func(value)
    return value


def dateParser(stringDate):
    """ Date parsing tool.
        Change the formats here cause a changement in the whole application.
    """
    formats = ['%d/%m/%Y %H:%M:%S',
               '%d/%m/%Y%H:%M:%S',
               '%d/%m/%Y',
               '%H:%M:%S',
               '%Y-%m-%d %H:%M:%S']
    dateValue = stringDate
    for format_ in formats:
        try:
            dateValue = datetime.strptime(stringDate, format_)
            break
        except:
            pass
    return dateValue


def parseValue(value):
    oldValue = value
    try:
        newValue = dictVal[oldValue]
    except:
        newValue = oldValue
    return newValue


def nullBitParser(value):
    if isinstance(value, str) and value.isspace():
        value = None
    oldValue = value
    try:
        newValue = dictVal[oldValue]
    except:
        newValue = oldValue
    return newValue


def find(f, seq):
    """Return first item in sequence where f(item) == True."""
    for item in seq:
        if f(item):
            return item


def isNumeric(val):
    try:
        val = float(val)
        return True
    except:
        return False


def isEqual(val1, val2):
    return parseValue(val1) == parseValue(val2)


def formatValue(data, schema):
    for key in data:
        if key in schema:
            if schema[key]['type'] == 'AutocompTreeEditor':
                data[key] = formatThesaurus(
                    schema[key]['options']['startId'], data[key])
            elif (schema[key]['type'] == 'ObjectPicker'
                    and key != 'FK_Individual'
                    and 'usedLabel' in schema[key]['options']):
                label = schema[key]['options']['usedLabel']
                data[key] = formatObjetPicker(data[key], key, label)
    return data


def formatThesaurus(nodeId, data):
    from ..utils.loadThesaurus import thesaurusDictTraduction

    lng = threadlocal.get_current_request(
    ).authenticated_userid['userlanguage']
    try:
        data = {
            'displayValue': thesaurusDictTraduction[nodeId][lng][data],
            'value': data
        }
    except:
        data = {
            'displayValue': data,
            'value': data
        }
    return data


def retrieveThesaurusFromLng(data, lng):
    from ..utils.loadThesaurus import thesaurusDictTraduction
    # lng = 'en'
    # data = 'dead'
    for node, children in thesaurusDictTraduction.items():
        print('searching in node : ' + node)
        filtering = list(
            filter(lambda k: children[lng][k] == data, children[lng].keys()))
        if filtering:
            break
    return filtering[0]


def formatObjetPicker(data, key, label):
    autcompResult = getAutcompleteValues(data, key.replace('FK_', ''), label)
    return {'displayValue': autcompResult,
            'value': data
            }


def getAutcompleteValues(ID, objName, NameValReturn):
    session = threadlocal.get_current_request().dbsession
    table = Base.metadata.tables[objName]

    query = select([table.c[NameValReturn]]).where(table.c['ID'] == ID)
    return session.execute(query).scalar()
