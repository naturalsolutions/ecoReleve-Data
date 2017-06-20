from ..Models import Base
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
    func,
    orm,
    Table)
from sqlalchemy.orm import relationship
from pyramid import threadlocal
from traceback import print_exc
from sqlalchemy.ext.hybrid import hybrid_property


class CustomErrorSQL(Exception):
    def __init__(self, value):
        self.value = value
        print('CustomErrorSQL')

    def __str__(self):
        return repr(self.value)


def coroutine(func):
    def starter(*args, **kwargs):
        gen = func(*args, **kwargs)
        next(gen)
        return gen
    return starter


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

    error = None

    @hybrid_property
    def tempTable(self):
        table = Table(self.TempTable_GUID, Base.metadata, autoload=True)
        return table

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        engine = threadlocal.get_current_registry().dbmaker().get_bind()
        self.ObjContext = engine.connect()
        self.processInfo = {}

    @orm.reconstructor
    def init_on_load(self):
        self.__init__()

    def run_process(self,column_name, current_process, trans):
        try:
            if(column_name.startswith('Station_')):
                prefix = 'Station_'
                module_id = 2
                target_typeObj = 1
            else:
                prefix = ''
                module_id = None
                target_typeObj = 1
                
            print(current_process.Name)
            print('module id ', str(module_id))
            print('prefix ', str(prefix))
            print('column_name ', str(column_name))
            print('target_typeObj ', str(target_typeObj))
            if 'check' in current_process.ProcessType:
                req = text("""
                           DECLARE @return_value int, @result varchar(255), @error int, @errorIndexes varchar(max)
                           EXEC @return_value = [dbo].""" + current_process.Name +
                           """  @file_ID = :file_ID,
                                @column_name = :column_name,
                                @prefix_column = :prefix,
                                @target_module = :module,
                                @target_TypeObj = :target_typeObj,
                                @result = @result OUTPUT,
                                @error = @error OUTPUT,
                                @errorIndexes = @errorIndexes OUTPUT;
                           SELECT @result, @error, @errorIndexes;"""
                           ).bindparams(bindparam('file_ID', self.ID),
                                        bindparam('prefix', prefix),
                                        bindparam('module', module_id),
                                        bindparam('target_typeObj', target_typeObj),
                                        bindparam('column_name', column_name))
                result, error, errorIndexes = self.ObjContext.execute(req).fetchone()
                print(result, error, errorIndexes)
                trans.commit()
                return result, error, errorIndexes

            if 'update' in current_process.ProcessType and not self.error:
                req = text("""
                           DECLARE @return_value int, @result varchar(255), @error int, @errorIndexes varchar(max)
                           EXEC @return_value = [dbo].""" + current_process.Name +
                           """  @file_ID = :file_ID,
                                @column_name = :column_name,
                                @prefix_column = :prefix,
                                @target_module = :module,
                                @result = @result OUTPUT,
                                @error = @error OUTPUT,
                                @errorIndexes = @errorIndexes OUTPUT;
                           SELECT @result, @error, @errorIndexes;"""
                           ).bindparams(bindparam('file_ID', self.ID),
                                        bindparam('prefix', prefix),
                                        bindparam('module', module_id),
                                        bindparam('column_name', column_name))
                result, error, errorIndexes = self.ObjContext.execute(req).fetchone()
                trans.commit()
                return result, error, errorIndexes

            # if 'insert' in current_process.ProcessType and not self.error:
            #     req = text("""
            #                DECLARE @result varchar(255), @error int, @errorIndexes varchar(max)
            #                EXEC [dbo].""" + current_process.Name +
            #                """  :file_ID, @result OUTPUT, @error OUTPUT,  @errorIndexes OUTPUT;
            #                SELECT @result, @error, @errorIndexes;"""
            #                ).bindparams(bindparam('file_ID', self.ID))
            #     result, error, errorIndexes = self.ObjContext.execute(req).fetchone()
            #     trans.commit()
            #     return result, error, errorIndexes
            if self.error:
                return 'not executed', 1, None
        except Exception as e:
            print('######### exception ################# \n')
            print(e)
            print_exc()
            trans.rollback()
            if not current_process.Blocking:
                pass

    @coroutine
    def main_process(self):
        dictSession = {}
        yield
        cols = self.tempTable.c.keys()
        cols.remove('index')
        for columnName in cols:
            print('\n\n ___   '+columnName+'   ____________')
            for process in self.Type.ProcessList:
                try:
                    dictSession[columnName+process.Name] = self.ObjContext.begin()
                    result, error, errorIndexes = self.run_process(columnName, process, dictSession[columnName+process.Name])
                    if error and process.Blocking and not self.error:
                        self.error = True
                    yield process, '{"column":"'+columnName+'","process":"'+str(process.Name)+'","msg":"'+str(result)+'", "error":"'+str(error)+'", "errorIndexes":"'+str(errorIndexes)+'"}'
                except:
                    yield process, '{"column":"'+columnName+'", "process":"'+str(process.Name)+'","msg":"internal error", "error":1, "errorIndexes": "error"}'

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
