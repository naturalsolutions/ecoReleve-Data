EcoReleve-Data
========================

[![Join the chat at https://gitter.im/NaturalSolutions/ecoReleve-Data](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/NaturalSolutions/ecoReleve-Data?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)


A free and open source biodiversity data entry software

Ecologists have struggled with environmental data management issues for many years now. It has become urgent to focus on building the technological solutions required for a more efficient process of data collection, exchange, and analysis.

To address this issue, we have starting an ambitious open source effort based on open source components.


We provide Software for Field Worker: that actually run the data collection and data entries

ecoReleve data is design to allow field data entry on any devices (IOS, Android and Window). It stores data local and let you upload it to the Core module when ready.

The data entry forms are fully customizable to allow users to design their own protocols.
	

![ecoReleve](https://static.squarespace.com/static/519a7bc0e4b08ccdf8f31445/t/53c9549ae4b0a11d417c1d12/1405703324816/?format=1000w)

## Features


## Instalation


### Requirements

 - [Node.js](https://nodejs.org/) (for [npm](https://www.npmjs.com/))
 - [bower](http://bower.io/) `npm install -g bower`
 - [python3.4](https://www.python.org/download/releases/3.4.0/) (for Windows you can install [miniconda3.4](http://conda.pydata.org/miniconda.html))


*Verify that node is in your PATH*

### Instalation Process

#### Front
- `npm install`
- `bower install`

optional but recommended :

- `grunt build`

#### Back

Install those packages with `pip` or `conda` :

- pyodbc (for SQL Server database) or psycopg2 (for PostrgreSQL database)
- reportlab
- [scikit-learn](http://scikit-learn.org/stable/)
- [sqlalchemy](http://www.sqlalchemy.org/)
- zope.interface
- pandas=0.15.0

Run the setup install : 
- `python setup.py install`


## Technolgies && Usage

### Front

> npm
> bower

* Grunt :
 `grunt build` build the code : 
  1. compile less files to app/styles/main.css (+ map file in dev mode)
  2. build html files with JST (app/build/templates.js)
  3. build js files : requirejs optimisation, minify and uglify (app/buil/prod.js)
  4. run jasmine test (soon replaced for mocha)

- `grunt release` : launch `grunt build` then change entry file in the index for production mode (prod.js)

- `grunt dev` : launch `grunt build` then change entry file in the index for development mode

 RequireJS
 Backbone Underscore
 MarionetteJs
 Leaflet



### Back

 >[Pyramid](http://docs.pylonsproject.org/projects/pyramid/en/latest/)
 >[SQLAlchemy](http://www.sqlalchemy.org/)


You have to configure the [development.ini](https://github.com/NaturalSolutions/ecoReleve-Data-refact/tree/master/Back/development.ini.default) which can be found in the [Back folder](https://github.com/NaturalSolutions/ecoReleve-Data-refact/tree/master/Back/)
Run `pserve development.ini` command in order to launch a Pyramid server.

#### Database configuaration

## Quality && Test

### Style Guide

### Test

## Workflow && Contribution

Natural Solutions (NS) is based upon the collaborative development process of Git/GitHub.

![gitWorkflow](http://img11.hostingpics.net/pics/424731gitflow.png)

If you want to contribute on this project, please create a new pull request :
1. Fork the repository into your own GitHub repository in order to work on this one,
2. Then create a new branch first,
3. Finally, send a pull request to the [main repository](https://github.com/NaturalSolutions/ecoReleve-Data-refact/) when the task is ready for review.
4. When the pull request received at least one validation comment from an owner member of the repository, it will be merge to this one.

Thank you!


## Demo

http://92.222.217.165/ecoreleve/

## Commercial Support

We have programs for companies that require additional level of assistance through training or commercial support, need special licensing or want additional levels of capabilities. Please visit the [Natural Solutions](http://www.natural-solutions.eu/) Website for more information about ecoReleve or email contact@natural-solutions.com.

## License

Copyright (c) 2015 Natural Solutions
Licensed under the MIT license.
