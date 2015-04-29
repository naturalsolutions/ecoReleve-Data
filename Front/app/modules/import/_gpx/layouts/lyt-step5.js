define([
    'jquery',
    'underscore',
    'backbone',
    'marionette',
    'stepper/lyt-step',

], function($, _, Backbone, Marionette, Step) {

    'use strict';

    return Step.extend({
        onShow: function(){
            var msg = this.model.get('ajax_msg') ; 
            $('#importResponseMsg').text(msg); 
        },
        nextOK: function(){
            return true;
        }
    });

});
