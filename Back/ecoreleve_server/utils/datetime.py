from datetime import datetime

def parse(s):
    """ Date parsing tool.
        Change the formats here cause a changement in the whole application.
    """
    formats = ['%d/%m/%Y %H:%M:%S', '%d/%m/%Y']
    d = None
    for format in formats:
        try:
            d = datetime.strptime(s, format)
            break
        except ValueError:
            pass
    return d