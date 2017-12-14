:: ecoReleve-Sensor installation script
:: Requires Python 3.5, conda and conda-build AND Node with NPM

conda install conda-build --yes
conda env create -f environment.yml

call activate erd
call python setup.py develop
cd ../Front
npm install && bower install && grunt dev

