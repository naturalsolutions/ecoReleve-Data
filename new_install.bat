REM BE CAREFUL WE EMBED PYTHON INSTALLER AND INSTALL IT IN A CHOOSEN DIRECTORY
REM DO NOT CHANGE THE PATH "Python-3.7.3"
REM AND THE MOST IMPORTANT !!!! ONCE PYTHON IS INSTALLED IF YOU DELETE THE FOLDER 
REM THE SCRIPT WILL NO MORE WORKS,  YOU HAVE TO REINSTALL WITH UI AND REPAIR
REM THEN UNINSTALL IT PROPERLY!!! THE SCRIP WILL WORK AGAIN :)
REM WE HAVE SOME RELATIVE PATH SO PLEASE LAUNCH IT FROM HIS LOCATION 
.\Back\install\python-3.7.3-amd64 /quiet InstallAllUsers=1 TargetDir="%cd%\mandatory\Python-3.7.3" SimpleInstall=1 AssociatedFiles=1 SimpleInstallDescription="BE CAREFUL DO NOT CHANGE DIRECTORY PATH(Python-3.7.3) Will install python-3.7.3  for creating env in %cd%\mandatory\Python-3.7.3"
CALL .\mandatory\Python-3.7.3\python -m pip install --upgrade pip
CALL .\mandatory\Python-3.7.3\python -m pip install --user virtualenv
CALL .\mandatory\Python-3.7.3\python -m venv ./erdenv
CALL .\mandatory\Python-3.7.3\python -m pip install --upgrade setuptools
CALL .\upgrade_install.bat