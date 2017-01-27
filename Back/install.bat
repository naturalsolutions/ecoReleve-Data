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
pip install pyramid_jwtauth
pip install pyexcel==0.2.5
pip install pyexcel-io==0.2.2
pip install pyexcel-webio==0.0.7
pip install pyexcel-xls==0.2.2
pip install pyexcel-xlsx==0.2.1
pip install pyramid-excel==0.0.3

python setup.py develop

cd ../Front
npm install && bower install && grunt dev
