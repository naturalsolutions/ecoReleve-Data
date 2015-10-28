
CREATE TABLE FormBuilderFormsInfos(
	[ID] [bigint] NOT NULL,
	[name] [varchar](100) NOT NULL,
	[labelFr] [varchar](300) NOT NULL,
	[labelEn] [varchar](300) NOT NULL,
	[creationDate] [smalldatetime] NOT NULL,
	[modificationDate] [smalldatetime] NULL,
	[curStatus] [int] NOT NULL,
	[descriptionFr] [varchar](max) NOT NULL,
	[descriptionEn] [varchar](max) NOT NULL,
	[objectType] [varchar](100) NULL,
	[internalID] [int] NULL
	CONSTRAINT PK_FormBuilderFormsInfos PRIMARY KEY CLUSTERED (ID)
)


CREATE TABLE FormBuilderInputInfos(
	[ID] [bigint] NOT NULL,
	[fk_form] [bigint] NOT NULL,
	[name] [varchar](100) NOT NULL,
	[labelFr] [varchar](300) NOT NULL,
	[labelEn] [varchar](300) NOT NULL,
	[required] [bit] NOT NULL,
	[readonly] [bit] NOT NULL,
	[fieldSizeEdit] [varchar](100) NOT NULL,
	[endOfLine] [bit] NOT NULL,
	[startDate] [smalldatetime] NOT NULL,
	[curStatus] [int] NOT NULL,
	[type] [varchar](100) NOT NULL,
	[editorClass] [varchar](100) NULL,
	[fieldClassEdit] [varchar](100) NULL,
	[linkedFieldTable] [varchar](100) NULL,
	[linkedFieldIdentifyingColumn] [varchar](100) NULL,
	[linkedField] [varchar](100) NULL,
	[formIdentifyingColumn] [varchar](100) NULL,
	[linkedFieldset] [varchar](100) NULL,
	[fieldClassDisplay] [varchar](100) NULL,
	[fieldSizeDisplay] [varchar](100) NULL,
	[order] [int] NULL
	CONSTRAINT PK_FormBuilderInputInfos PRIMARY KEY CLUSTERED (ID),
	CONSTRAINT FK_FormBuilderInputInfos_from FOREIGN KEY  (fk_form) REFERENCES FormBuilderFormsInfos(ID)
)


CREATE TABLE [dbo].[FormBuilderInputProperty](
	ID [bigint] not null,
	[fk_Input] [bigint] NOT NULL,
	[name] [varchar](255) NOT NULL,
	[value] [varchar](255) NOT NULL,
	[creationDate] [smalldatetime] NOT NULL,
	[valueType] [varchar](10) NOT NULL,
	CONSTRAINT PK_FormBuilderInputProperty PRIMARY KEY CLUSTERED (ID),
	CONSTRAINT FK_FormBuilderInputProperty_Input FOREIGN KEY  (fk_Input) REFERENCES FormBuilderInputInfos(ID)
) 
