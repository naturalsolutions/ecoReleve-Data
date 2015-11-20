IF EXISTS (SELECT * FROM sys.objects WHERE type = 'TF' AND name = 'fn_v_qry_GetEquipAtDate')
	DROP FUNCTION [fn_v_qry_GetEquipAtDate]
GO

CREATE FUNCTION [dbo].[fn_v_qry_GetEquipAtDate](@Ind_ID AS int, @StaDate as datetime)
  RETURNS 


	@Equipement TABLE
		(
			fk_indiv INT,
			fk_sensor INT
		)
AS
BEGIN
	insert into @Equipement
	select i.id fk_indiv,s.id fk_sensor
	from VIndividuEquipementHisto E
	JOIN[TIndividu] I  on E.fk_individual = I.id JOIN TSensor S ON E.fk_sensor = S.id
	where 
	 NOT EXISTS (SELECT 1 
					FROM VIndividuEquipementHisto E2 
					where E2.fk_individual = E.fk_individual 
					and E2.startdate> E.startdate 
					and E2.startdate <= @StaDate)
	AND i.id = @Ind_ID and e.StartDate <= @StaDate and E.deploy =1 
	RETURN 
END


	
