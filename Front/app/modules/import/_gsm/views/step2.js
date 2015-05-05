define([
    'jquery',
    'underscore',
    'backbone',
    'marionette',
    'config',
    'radio',
    'text!modules2/import/_gsm/templates/tpl-step2.html',
    'bootstrap_slider',
    
], function($, _, Backbone, Marionette, config, Radio, tpl,
    bootstrap_slider) {
    'use strict';

    return Marionette.ItemView.extend({
        template: tpl,

        events: {
            'click button#validation' : 'redirectValidation',
            'click button#import' : 'redirectimport',
            'click button#home' : 'redirectHome',
        },

        initialize: function() {

        },

        onShow: function(){

        },
        onRender: function(){
            $('#btnNext').attr('disabled');
        },

        redirectValidation: function(){
            Radio.channel('route').command('validate:type', 'gsm');
        },

        redirectimport: function(){
            Radio.channel('route').trigger('import');
        },

        redirectHome: function(){
            Radio.channel('route').trigger('home');
        },


    });
});
