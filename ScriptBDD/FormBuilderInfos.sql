CREATE TABLE FormBuilderFormsInfos
(
	ID [int] IDENTITY(1,1) NOT NULL,
	FBID INT NOT NULL,
	[name] [varchar](100) NOT NULL,
	[labelFr] [varchar](300) NOT NULL,
	[labelEn] [varchar](300) NOT NULL,
	[creationDate] [smalldatetime] NOT NULL,
	[modificationDate] [smalldatetime] NULL,
	[curStatus] [int] NOT NULL,
	[descriptionFr] [varchar](max) NOT NULL,
	[descriptionEn] [varchar](max) NOT NULL
)

CREATE TABLE FormBuilderInputInfos
(
	ID [int] IDENTITY(1,1) NOT NULL,
	[FBID] [bigint] NOT NULL,
	[fk_form] [bigint] NOT NULL,
	[name] [varchar](100) NOT NULL,
	[labelFr] [varchar](300) NOT NULL,
	[labelEn] [varchar](300) NOT NULL,
	[required] [bit] NOT NULL,
	[readonly] [bit] NOT NULL,
	[fieldSize] [varchar](100) NOT NULL,
	[endOfLine] [bit] NOT NULL,
	[startDate] [smalldatetime] NOT NULL,
	[curStatus] [int] NOT NULL,
	[type] [varchar](100) NOT NULL,
	[editorClass] [varchar](100) NULL,
	[fieldClass] [varchar](100) NULL,
)

if not exists (select * from sys.tables t join sys.schemas s on (t.schema_id = s.schema_id) where s.name = 'dbo' and t.name = 'FormBuilderInputProperty') 
create table dbo.FormBuilderInputProperty ( 
ID Integer not null IDENTITY(1,1) ,
FBID integer not null,
fk_input integer not null,
name varchar(255) not null,
value varchar(255) not null,
creationDate datetime null,
valueType varchar(10) not null,
PRIMARY KEY (ID)
 )
-- TODO Table pour les propriétés des input: InputProperty