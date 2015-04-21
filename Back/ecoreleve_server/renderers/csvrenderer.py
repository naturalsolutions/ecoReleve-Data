"""
Created on Mon Sep 22 11:08:41 2014
@author: Natural Solutions (Thomas)
"""

import io
import csv

class CSVRenderer(object):
    def __init__(self,info=None):
        pass

    def __call__(self, value, system):

        """ Returns a plain CSV-encoded string with content-type
        ``text/csv``. The content-type may be overridden by
        setting ``request.response.content_type``."""

        request = system.get('request')
        if request is not None:

            response = request.response
            ct = response.content_type
            if ct == response.default_content_type:
                response.content_type = 'text/csv'
                
        fout = io.StringIO()
        writer = csv.writer(fout, delimiter=',', quoting=csv.QUOTE_MINIMAL)
                
        writer.writerow(value.get('header', []))
        writer.writerows(value.get('rows', []))

        return fout.getvalue()