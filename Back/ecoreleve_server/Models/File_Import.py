from ..Models import Base, sendLog
from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Integer,
    Boolean,
    String,
    Sequence,
    text,
    bindparam,
    func)
from sqlalchemy.orm import relationship
from pyramid import threadlocal

# from ..GenericObjets.ObjectWithDynProp import ObjectWithDynProp
# from ..GenericObjets.ObjectTypeWithDynProp import ObjectTypeWithDynProp


class File (Base):

    __tablename__ = 'File'

    ID = Column(Integer, Sequence('File___id_seq'), primary_key=True)
    Name = Column(String(250))
    ImportDate = Column(DateTime,
                        index=True,
                        nullable=False,
                        server_default=func.now())
    Creator = Column(Integer)
    TempTable_GUID = Column(String(250))
    FK_File_Type = Column(Integer, ForeignKey('File_Type.ID'))
    Status = Column(Integer)
    Type = relationship('File_Type', uselist=False)

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.ObjContext = threadlocal.get_current_request().dbsession
        self.processInfo = {}

    def run_process(self, current_process):
        try:
            if current_process.ProcessType == 'sql':
                req = text("""
                           DECLARE @result varchar(20), @error int
                           EXEC [dbo].""" + current_process.Name +
                           """@file_ID = :file_ID, @result OUTPUT, @error OUTPUT;
                           SELECT @result, @error;"""
                           ).bindparams(bindparam('file_ID', self.ID))
                result, error = self.ObjContext.execute(req)
            else:
                self.FuncProcess[current_process.Name]()
            return result, error
        except Exception as e:
            self.log()
            if current_process.Blocking:
                raise Exception
            else:
                pass

    def main_process(self):
        self.ObjContext.begin()
        for process in self.Type.ProcessList:
            self.run_process(process)
        self.ObjContext.commit()
        return

    def log(self):
        sendLog()
        return


class File_Type (Base):

    __tablename__ = 'File_Type'

    ID = Column(Integer, Sequence('File_Type___id_seq'), primary_key=True)
    Name = Column(String)
    # FK_SensorDataType (Integer, ForeignKey('SensorDataType.ID'))

    ProcessList = relationship('File_ProcessList',
                               order_by='File_ProcessList.ExecutionOrder')

    def get_process_name(self):
        return list(map(lambda x: x.Name, self.ProcessList))


class File_ProcessList (Base):

    __tablename__ = 'File_ProcessList'

    ID = Column(Integer, Sequence('File_ProcessList___id_seq'), primary_key=True)
    Name = Column(String)
    FK_File_Type = Column(Integer, ForeignKey('File_Type.ID'))
    ProcessType = Column(String(100))
    ExecutionOrder = Column(Integer)
    Blocking = Column(Boolean)
    DescriptionFr = Column(String(500))
    DescriptionEn = Column(String(500))


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


# class FileContent (Base) :

#     __tablename__ = 'FileContent'

#     ID = Column(Integer, Sequence('FileContent___id_seq'), primary_key = True)
#     FK_File = Column(Integer, ForeignKey('File.ID'))
#     FK_SensorID = Column (Integer, ForeignKey('Sensor.ID'))
#     Content = Column(String)



