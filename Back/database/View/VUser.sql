create view [dbo].[User] as 
SELECT [TUse_PK_ID] as [ID]
      ,[TUse_LastName] as [Lastname]
      ,[TUse_FirstName] as [Firstname]
      ,[TUse_CreationDate] as CreationDate
      ,[TUse_Login] as [Login]
      ,[TUse_Password] as [Password]
      ,[TUse_Language] as [Language]
      ,[TUse_ModificationDate]  as [ModificationDate]
      ,[TUse_HasAccess] as HasAccess
      ,[TUse_Photo] as Photo
      ,[TUse_PK_ID_OLD]
      ,[TUse_Observer] as Observer
  FROM [SECURITE].[dbo].[TUsers]
GO
