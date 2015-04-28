define([
    'jquery',
    'underscore',
    'backbone',
    'marionette',
    'NaturalJS-Form'

], function ($, _, Backbone, Marionette,NsForm) {
    'use strict';

    return Marionette.LayoutView.extend({

        template: 'app/Demo/tpl-Obs.html',
        nsform: null,
        nsgrid: null,
        model: null,
        displayMode: "display",
        nseventform: null,
        id: null,
        currentEvent: null,


        


        initialize: function (options) {
            console.log(options);
            

            if (!options.id && options.objtype) {
                this.displayMode = "edit";
            }
            if (options.id) {
                this.id = options.id;
            }
            console.log(this.id) ;

            this.nsform = new NsForm({
                name: 'StaForm',
                modelurl: '/ecoReleve-Core/stations/',
                buttonRegion: ['ObsFormButton'],
                formRegion: 'ObsForm',
                displayMode: this.displayMode,
                objecttype: options.objtype,
                id: this.id,
            });

        },
 
        getBaseURL: function () {
            return window.location.origin + window.location.pathname;

        },

        
    });

});