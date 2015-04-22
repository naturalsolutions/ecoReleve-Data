EcoReleve-Data
========================



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

*Verify that node is in your PATH*

### Instalation Process

#### Front
- `npm install`
- `bower install`

optional but recommended :

- `grunt build`

#### Back
-


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

## Test && Quality



## Workflow && Contribution



## Demo

## Commercial Support

We have programs for companies that require additional level of assistance through training or commercial support, need special licensing or want additional levels of capabilities. Please visit the [Natural Solutions](http://www.natural-solutions.eu/) Website for more information about ecoReleve or email contact@natural-solutions.com.

## License

Copyright (c) 2015 Natural Solutions
Licensed under the MIT license.