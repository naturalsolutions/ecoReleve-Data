
def data_to_XML (data) :
	xml = '<?xml version="1.0" ?><table>'
	for id_ in data : 
		xml = xml+'<row>'+str(id_)+'</row>'
	xml = xml + '</table>'
	return xml