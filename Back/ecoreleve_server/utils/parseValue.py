
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

