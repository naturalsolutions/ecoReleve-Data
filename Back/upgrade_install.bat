CALL .\env\Scripts\activate
call python -m pip install --upgrade pip setuptools
CALL python setup.py develop
REM pypiwin32 failed when installed with setup.py
CALL pip install pypiwin32
CALL pip install git+https://github.com/smarnach/pyexiftool.git
CALL .\localWheel_install.bat

