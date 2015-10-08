


/****** Object:  UserDefinedTableType [dbo].[ListOfIDs]    Script Date: 05/21/2015 16:35:45 ******/
/*
CREATE TYPE [dbo].[ListOfIDs] AS TABLE(
	[ID] [int] NULL
)
GO
*/

IF  EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[pr_MessageExportIndividu]') AND type in (N'P', N'PC'))
DROP PROCEDURE pr_MessageExportIndividu
GO


CREATE PROCEDURE pr_MessageExportIndividu(
@IndividuList ListOfIDs READONLY,
@operation	VARCHAR(200) ='Creation'
)
AS
BEGIN
	DECLARE @MessageIDs TABLE(
		ID BIGINT
	)


	BEGIN TRY
	BEGIN TRAN
	
		INSERT INTO [dbo].[TMessageSend]
				   ([ObjectType]
				   ,[ObjectId]
				   ,[ObjectOriginalID]
				   ,[Operation]
				   ,[CreationDate]
				   ,[SendDate]
				   ,[Comment])           
		OUTPUT INSERTED.pk_MessageSend INTO @MessageIDs			   
		select 'individu',TInd_PK_ID,TInd_PK_ID,@operation,GETDATE(),NULL,NULL
		from TIndividus
		where TInd_PK_ID IN		(SELECT ID FROM @IndividuList)

		INSERT INTO [dbo].[TMessageSendDetail]
				   ([fk_MessageSend]
				   ,[PropName]
				   ,[PropValue]
				   ,[Parametre])
		select m.pk_MessageSend,C.PropName,PropValue,NULL
		from TIndividus I JOIN [TMessageSend]  M on m.[ObjectId] = I.TInd_PK_ID
		CROSS APPLY
		(
			values	
			('TInd_DateNaissance',CONVERT(varchar,TInd_DateNaissance,120))
			,('TInd_BagueID',TInd_BagueID)
			,('TInd_OeufID',TInd_OeufID)
			,('TInd_DateSortie',CONVERT(varchar,TInd_DateSortie,120))
			,('TInd_StatusElevage',TInd_StatusElevage)
			,('TInd_Espece',TInd_Espece)
			,('TInd_Puce',TInd_Puce)
			,('TInd_BagueIDRelacher',TInd_BagueIDRelacher)
			,('TInd_Sexe',CASE WHEN TInd_Sexe = '1' THEN 'Male' WHEN TInd_Sexe = '2' THEN 'Female' ELSE 'UnKnown' END )
			,('TInd_Poids', convert(varchar,TInd_Poids))
		) C (PropName,PropValue)
		WHERE M.pk_MessageSend IN (SELECT ID FROM @MessageIDs)
		print 'COMMIT TRAN'
				IF @@TRANCOUNT > 0 COMMIT TRAN
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

