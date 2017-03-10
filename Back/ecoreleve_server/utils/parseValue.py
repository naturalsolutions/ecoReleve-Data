from ..Models import thesaurusDictTraduction
from pyramid import threadlocal
import json
from ..Models import Base
from sqlalchemy import select, asc

dictVal = {
    'null':None,
    '':None,
    'true':1,
    'false':0,
    'NULL':None,
    'None':None
}

def parseValue(value):
    old_value = value
    try :
        val = dictVal[old_value]
    except:
        val = old_value
    return val


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

def isEqual(val1,val2):
    if isNumeric(val2) and isNumeric(val1):
        return float(val1)==float(val2)
    else :
        return parseValue(val1) == parseValue(val2)

def formatValue(data, schema):
    for key in data:
        if key in schema:
            if (schema[key]['type'] == 'AutocompTreeEditor'):
                data[key] = formatThesaurus(data[key])
            elif (schema[key]['type'] == 'ObjectPicker' and key != 'FK_Individual' and 'usedLabel' in schema[key]['options']):
                label = schema[key]['options']['usedLabel']
                data[key] = formatObjetPicker(data[key], key, label)

    return data

def formatThesaurus(data):
    # print(thesaurusDictTraduction)
    lng = threadlocal.get_current_request().authenticated_userid['userlanguage']
    try: 
        data = {
            'displayValue': thesaurusDictTraduction[data][lng],
            'value': data
        }
    except:
         data = {
            'displayValue': '',
            'value': data
        }
    return data


def formatObjetPicker(data, key, label):
    print(data, key, label)
    autcompResult = getAutcompleteValues(data, key.replace('FK_',''), label)
    data = {
        'displayValue': autcompResult,
        'value': data
    }

    return data

def parseThesaurus(data):
    return


def getAutcompleteValues(ID, objName, NameValReturn):
    session = threadlocal.get_current_request().dbsession

    table = Base.metadata.tables[objName]

    query = select([table.c[NameValReturn]]).where(table.c['ID'] == ID)
    return session.execute(query).scalar()



