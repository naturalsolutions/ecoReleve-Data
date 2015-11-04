

/****** Object:  StoredProcedure [dbo].[MessageSendDataToDest]    Script Date: 12/10/2015 16:29:56 ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO



CREATE PROCEDURE [dbo].[MessageSendDataToDest] 
AS
BEGIN
	DECLARE @DestDB VARCHAR(250)
			,@MessageToSendConf BIGINT
			,@SQLText NVARCHAR(4000)
			
	DECLARE c_destination CURSOR FOR
	SELECT DISTINCT C.DestDatabase FROM TMessageSend M JOIN TMessageToSendConf C ON M.ObjectType = C.ObjectType AND M.Operation = C.Operation
	WHERE NOT EXISTS (SELECT * FROM TMessageTransfertLog L WHERE L.fk_ConfDest = C.pk_MessageToSendConf and L.fk_MessageSend = pk_MessageSend)
			
				IF OBJECT_ID('tempdb..#MessageToSend') IS NOT NULL
					DROP TABLE #MessageToSend

				IF OBJECT_ID('tempdb..#MessageDetailToSend') IS NOT NULL
					DROP TABLE #MessageDetailToSend
				
				-- GET ALL MESSAGE FOR ALL DEST
				
				SELECT M.*,C.DestDatabase,C.pk_MessageToSendConf into #MessageToSend 
				FROM TMessageSend M JOIN TMessageToSendConf C ON M.ObjectType = C.ObjectType AND M.Operation = C.Operation
				WHERE M.SendDate IS NULL AND NOT EXISTS (SELECT * FROM TMessageTransfertLog L WHERE L.fk_ConfDest = C.pk_MessageToSendConf and L.fk_MessageSend = pk_MessageSend)
				
				-- GET ALL ASSOCIATED DETAILS
					
				SELECT D.*,M.DestDatabase INTO #MessageDetailToSend 
				FROM dbo.TMessageSendDetail D JOIN #MessageToSend M ON M.pk_MessageSend = D.fk_MessageSend
			
			
				print 'BEGIN TRAN'
				OPEN c_destination

			BEGIN TRY
			BEGIN TRAN		
					
				FETCH NEXT FROM c_destination 
				INTO @DestDB

					

				WHILE @@FETCH_STATUS = 0
				BEGIN

					-- INSERTING DATE IN DEST TMessageReceived
					
					SET @SQLText = ' INSERT INTO ' + @DestDB + '.TMessageReceived  (pk_MessageReceived,Provenance,ObjectType,ObjectId,ObjectOriginalID,Operation,CreationDate,ImportDate,Comment)'
					SET @SQLText = @SQLText + ' SELECT pk_MessageSend,''' + dbo.GetProvenance() + ''', M.ObjectType,M.ObjectId,M.ObjectOriginalID,M.Operation,GetDate(),NULL,NULL '
					SET @SQLText = @SQLText + ' FROM #MessageToSend M WHERE  M.DestDatabase = ''' + @DestDB + ''''
					print @SQLText
					
					EXEC(@SQLText)
					
					-- INSERTING DATE IN DEST TMessageReceivedDetail

					SET @SQLText = ' INSERT INTO ' + @DestDB + '.TMessageReceivedDetail  (pk_MessageReceivedDetail,fk_MessageReceived,Provenance,PropName,PropValue,Parametre)'
					SET @SQLText = @SQLText + ' SELECT D.pk_MessageSendDetail,D.fk_MessageSend,''' + dbo.GetProvenance() + ''', D.PropName,D.PropValue,D.Parametre '
					SET @SQLText = @SQLText + ' FROM #MessageDetailToSend D WHERE  D.DestDatabase = ''' + @DestDB + ''''
					
					print @SQLText
					EXEC(@SQLText)

					INSERT INTO [TMessageTransfertLog]
						([fk_MessageSend]
						,[fk_ConfDest]
						,[Statut]
						,[SendMessage])
					SELECT pk_MessageSend,pk_MessageToSendConf,0,NULL
					FROM #MessageToSend M WHERE M.DestDatabase = @DestDB
					
					
					FETCH NEXT FROM c_destination 
					INTO @DestDB
					
				END 
				CLOSE c_destination;
				DEALLOCATE c_destination;

				UPDATE TMessageSend SET SendDate=GETDATE()
				WHERE pk_MessageSend in (select pk_MessageSend from #MessageToSend)
				
				

				print 'COMMIT TRAN'
				IF @@TRANCOUNT > 0 COMMIT TRAN
		END TRY
		BEGIN CATCH
			print 'CATCH'
			CLOSE c_destination;
			DEALLOCATE c_destination;
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

GO


