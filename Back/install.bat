:: ecoReleve-Sensor installation script
:: Requires Python 3.4.1, conda and conda-build
:: Minimum version of Pandas should be 0.15.0
conda install pandas=0.18.0
conda install pyodbc
conda install reportlab
conda install sqlalchemy=1.0.8
conda install zope.interface
conda install pywin32
conda install pycrypto
pip install jwt
pip install pyramid_jwtauth

python setup.py develop

cd ../Front
npm install && bower install && grunt dev

