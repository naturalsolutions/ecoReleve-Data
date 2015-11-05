
CREATE FUNCTION [dbo].[split]
(
    @string varchar(MAX),
    @delimiter CHAR(1),
    @pos INT
)
RETURNS varchar(255)
AS
BEGIN
    DECLARE @start INT, @end INT, @count INT
    SELECT @start = 1, @end = CHARINDEX(@delimiter, @string), @count = 1 
    WHILE @start < LEN(@string) + 1 BEGIN
        IF @end = 0 
            SET @end = LEN(@string) + 1 
 
        IF @count = @pos
            RETURN SUBSTRING(@string, @start, @end - @start)
 
        SET @start = @end + 1 
        SET @end = CHARINDEX(@delimiter, @string, @start)
        SET @count = @count + 1 
 
    END
    RETURN '' -- not found
END

GO