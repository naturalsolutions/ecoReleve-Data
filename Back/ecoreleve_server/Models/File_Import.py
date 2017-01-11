from ..Models import Base, db
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
from traceback import print_exc


class CustomErrorSQL(Exception):
    def __init__(self, value):
        self.value = value
        print('CustomErrorSQL')

    def __str__(self):
        return repr(self.value)


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
    ObjectName = Column(String(100))
    ObjectType = Column(Integer)
    Type = relationship('File_Type', uselist=False, backref='Files')

    error = True

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        engine = threadlocal.get_current_request().registry.dbmaker().get_bind()
        self.ObjContext = engine.connect()
        self.processInfo = {}

    def run_process(self, current_process, trans):
        try:
            if 'sql' in current_process.ProcessType:
                req = text("""
                           DECLARE @result varchar(255), @error int, @errorIndexes varchar(max)
                           EXEC [dbo].""" + current_process.Name +
                           """  :file_ID, @result OUTPUT, @error OUTPUT,  @errorIndexes OUTPUT;
                           SELECT @result, @error, @errorIndexes;"""
                           ).bindparams(bindparam('file_ID', self.ID))
                result, error, errorIndexes = self.ObjContext.execute(req).fetchone()
                self.processInfo[current_process.Name] = {
                    'desc': current_process.DescriptionFr,
                    'error': error,
                    'result': result,
                    'errorIndexes': errorIndexes}

                trans.commit()
                return result, error, errorIndexes

        except Exception as e:
            print_exc()
            trans.rollback()
            if current_process.Blocking:
                raise
            else:
                pass

    def main_process(self):
        dictSession = {}
        self.error = True
        try:
            for process in self.Type.ProcessList:
                dictSession[process.Name] = self.ObjContext.begin()
                print(process.Name)
                result, error, errorIndexes = self.run_process(process, dictSession[process.Name])
                print(result, error, errorIndexes)
                if result.lower() == 'error' and process.Blocking:
                        raise CustomErrorSQL(process.Name + 'not passed')

            self.error = False
            #self.ObjContext.commit()
        except:
            print('\n\n in except main process')
            self.error = True
            for session in dictSession:
                dictSession[session].rollback()
            self.ObjContext.rollback()

        finally:
            self.ObjContext.close()
            return self.processInfo

    def log(self):
        print('error log')
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
