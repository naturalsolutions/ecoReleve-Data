define([
    'jquery',
    'underscore',
    'backbone',
    'marionette',
    'ns_form/NSFormsModuleGit'

], function ($, _, Backbone, Marionette,NsForm) {
    'use strict';

    return Marionette.LayoutView.extend({

        template: 'app/Demo/tpl-Sta.html',
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
                buttonRegion: ['StaFormButton'],
                formRegion: 'StaForm',
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
