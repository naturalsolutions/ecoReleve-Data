IF  EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[MessageERDImportFromTrack]') AND type in (N'P', N'PC'))
DROP PROCEDURE MessageERDImportFromTrack
GO


CREATE PROCEDURE MessageERDImportFromTrack
AS
BEGIN
	print 'MessageERDImportFromTrack'
	
	DECLARE @TInsetedId TABLE
	(
	Id INT
	)
	
	BEGIN TRY
	BEGIN TRAN
		------------------------- GESTION DES SUJETS -------------------------
		print 'Individu insertion'
		-- Insertion des nouveaux sujets
		INSERT INTO [NewModelERD].[dbo].[Individual]
			   (
			   [creationDate]
			   ,[Age]
			   ,[Birth_date]
			   ,[Death_date]
			   ,[FK_IndividualType]
			   ,[Species]
			   ,Original_ID
			   ,Caisse_ID)
			  OUTPUT inserted.ID into @TInsetedId
		SELECT Getdate(),NULL,CONVERT(DATETIME,BD.PropValue,120) ,NULL,1,E.PropValue,'TRACK_'+CONVERT(VARCHAR,M.objectID),NULL
		FROM  TMessageReceived M 
	--	JOIN  TMessageReceivedDetail S ON M.pk_MessageReceived=S.fk_MessageReceived and S.PropName = 'TInd_Sexe'
		JOIN  TMessageReceivedDetail BD ON M.pk_MessageReceived=BD.fk_MessageReceived and BD.PropName = 'TInd_DateNaissance'
		JOIN  TMessageReceivedDetail E ON M.pk_MessageReceived=E.fk_MessageReceived and E.PropName = 'TInd_Espece'
		WHERE Importdate IS NULL AND M.ObjectType ='Individu' AND m.Provenance = 'TRACK'
		AND NOT EXISTS (SELECT * FROM [Individual] S WHERE [FK_IndividualType] =1 and S.Original_ID = 'TRACK_'+CONVERT(VARCHAR,m.ObjectId))
		

		print 'Inserting DYnPropValues'
		-- INserttion  des propriétées dynamiques 
		INSERT INTO [IndividualDynPropValue]
			   ([StartDate]
			   ,[ValueInt]
			   ,[ValueString]
			   ,[ValueDate]
			   ,[ValueFloat]
			   ,FK_Individual
			   ,FK_IndividualDynProp)
		SELECT GETDATE()
		,CASE WHEN DP.TypeProp = 'entier' THEN CONVERT(int,D.PropValue) ELSE NULL END
		,CASE WHEN DP.TypeProp = 'string' THEN D.PropValue ELSE NULL END
		,CASE WHEN DP.TypeProp = 'date' THEN CONVERT(DATETIME,D.PropValue,120) ELSE NULL END
		,CASE WHEN DP.TypeProp = 'float' THEN CONVERT(float,D.PropValue) ELSE NULL END
		,I.ID
		,DP.ID
		FROM 	TMessageReceived M 
		JOIN Individual I on I.Original_Id = 'TRACK_'+CONVERT(VARCHAR,m.ObjectId)
		JOIN  TMessageReceivedDetail D ON M.pk_MessageReceived=D.fk_MessageReceived
		JOIN TMessageDynPropvsTrack CDP ON CDP.TrackName = D.PropName
		JOIN IndividualDynProp DP ON CDP.ERDName = DP.Name
		WHERE Importdate IS NULL AND M.ObjectType ='individu' AND m.Provenance = 'TRACK'
		AND i.ID in (select ID FROM @TInsetedId)
		
		UPDATE TMessageReceived
		SET ImportDate=GETDATE()
		WHERE ObjectType ='Individu'
		AND ImportDate IS NULL AND Provenance = 'TRACK'
		
		commit tran
	END TRY
		BEGIN CATCH
			print 'CATCH'
			print @@TRANCOUNT
			IF @@TRANCOUNT >0  ROLLBACK TRAN;
			print @@TRANCOUNT
			
			DECLARE @ErrorMessage NVARCHAR(4000);
			DECLARE @ErrorSeverity INT;
			DECLARE @ErrorState INT;
			
			SELECT 
				@ErrorMessage = ERROR_MESSAGE(),
				@ErrorSeverity = ERROR_SEVERITY(),
				@ErrorState = ERROR_STATE();
			
			RAISERROR (@ErrorMessage, -- Message text.
					   @ErrorSeverity, -- Severity.
					   @ErrorState -- State.
					   );
		END CATCH	
	

END