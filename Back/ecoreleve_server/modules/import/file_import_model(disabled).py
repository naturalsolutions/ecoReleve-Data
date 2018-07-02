# from ..Models import Base,DBSession
# from sqlalchemy import (Column,
#  DateTime,
#  Float,
#  ForeignKey,
#  Index,
#  Integer,
#  Numeric,
#  String,
#  Text,
#  Unicode,
#  text,
#  Sequence,
#  orm,
#  and_,
#  func)
# from sqlalchemy.dialects.mssql.base import BIT
# from sqlalchemy.orm import relationship
# from ..GenericObjets.ObjectWithDynProp import ObjectWithDynProp
# from ..GenericObjets.ObjectTypeWithDynProp import ObjectTypeWithDynProp


# #------------------------------------------------------------------------------------------------------------------------- #
# class File (Base,ObjectWithDynProp) :

#     __tablename__ = 'File'

#     ID = Column(Integer, Sequence('File___id_seq'), primary_key = True)
#     Name = Column(String)
#     Date = Column(DateTime, index = True , nullable = False, server_default = func.now())
#     Creator = Column(Integer)
#     FK_File_Type = Column(Integer, ForeignKey('File_Type.ID'))

#     relationship('File_Type')

# ------------------------------------------------------------------------------------------------------------------------- #
# class File_Type (Base) :

#     __tablename__ = 'File_Type'

#     ID = Column(Integer, Sequence('File_Type___id_seq'), primary_key = True)
#     Name = Column(String)
#     FK_SensorDataType (Integer, ForeignKey('SensorDataType.ID'))

#     relationship('File')


# ------------------------------------------------------------------------------------------------------------------------- #
# class ImportFile_Conf (Base) :

#     __tablename__ = 'ImportFile_Conf'

#     ID = Column(Integer, Sequence('ImportFile_Conf___id_seq'), primary_key = True)
#     FK_File_Type = Column(Integer, ForeignKey('File_Type.ID'))
#     Target = Column(String)
#     Separator = Column(String)
#     TypeDataInFile = Column (String)
#     ColNameInFile = Column (String)
#     OrderCol = Column (String)
#     Regles = Column (String)


# ------------------------------------------------------------------------------------------------------------------------- #
# class FileContent (Base) :

#     __tablename__ = 'FileContent'

#     ID = Column(Integer, Sequence('FileContent___id_seq'), primary_key = True)
#     FK_File = Column(Integer, ForeignKey('File.ID'))
#     FK_SensorID = Column (Integer, ForeignKey('Sensor.ID'))
#     Content = Column(String)



