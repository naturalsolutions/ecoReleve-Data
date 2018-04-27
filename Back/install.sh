#!/bin/bash
# ecoReleve-Sensor installation script
# Requires conda AND Node with NPM

conda install conda-build --yes
conda env create -f environment.yml

source activate erd
python setup.py develop

cd ../Front
npm install && bower install && grunt dev

