ALTER TABLE observation add  comment varchar(255)

delete
--select *
from ProtocoleType_ObservationDynProp
where FK_ObservationDynProp =(select id from ObservationDynProp where name='comments')


delete from ObservationDynProp where id in
(select id from ObservationDynProp where name='comments')