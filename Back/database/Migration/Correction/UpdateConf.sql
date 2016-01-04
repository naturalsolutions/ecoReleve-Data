select * from moduleforms F JOIN Protocoletype PT on F.typeobj = pt.id
where F.module_id=1 and PT.name in ('Chiroptera detection','Chiroptera detection','Vertebrate group')
and f.name ='taxon' --and options=204089
