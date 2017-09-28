define([
    'jquery',
    'underscore',
    'backbone'
], function ($, _, Backbone) {

    'use strict';

    return Backbone.Model.extend({
        defaults: {
            resumableFile: { 
                cid : null,
                filename : null,
                size : null
             }
        }
    });
});

