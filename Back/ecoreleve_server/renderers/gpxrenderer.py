import io
import csv

class GPXRenderer(object):
	def __init__(self):
		pass

	def __call__(self, value, request):

		if request is not None:
			response = request.response
			ct = response.content_type
			if ct == response.default_content_type:
				response.content_type = 'application/gpx+xml'
				
		fout = io.StringIO()
		rows=value.get('rows', [])
		

		gpx='<?xml version="1.0" encoding="UTF-8" standalone="no" ?>\n<gpx xmlns="http://www.topografix.com/GPX/1/1" creator="byHand" version="1.1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">\n'
		gpx_data = [dict(row) for row in rows]
		date, sitename = "", ""
		for obj in gpx_data:

			for key, item in obj.items():
				if key == "LAT":
					lat = str(item)
				elif key == "LON":
					lon = str(item)
				elif key == "DATE":
					date = str(item)
				elif key == "Site_name":
					sitename = str(item)
			gpx = gpx + "\n<wpt lat='"+lat+"' lon='"+lon+"'>\n<ele></ele>\n<time>"+date+"</time>\n<desc></desc>\n<name>"+sitename+"</name>\n<sym>Flag, Blue</sym>\n</wpt>\n";
		gpx = gpx + "</gpx>"
		fout.write(gpx)
		
		gpxFile=fout.getvalue()
		fout.close()
		return gpxFile