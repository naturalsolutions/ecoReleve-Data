define([
    'jquery',
    'underscore',
    'backbone',
    'marionette',
    'stepper/lyt-step',

], function($, _, Backbone, Marionette, Step) {

    'use strict';

    return Step.extend({
        /*===================================================
        =            Layout Stepper Orchestrator            =
        ===================================================*/

        events: {
            'click #radio-tile': 'checkRadio',
        },

        onShow: function(){
           
        },


         checkRadio : function(e) {

            this.$el.find('input').each(function(){
                $(this).prop('checked', false).removeAttr('checked');
         
            });
            var tile = $(e.currentTarget);
            var radio = tile.find('input');
            radio.prop('checked',true).attr('checked','checked');
      

            if (radio.val() == 'gpx')  
                $('#info-GPX').show();
            else 
                $('#info-GPX').hide();
           
            var val=$(radio).attr('value');
            this.model.set(this.name + '_' + radio.attr('name') , val);
            
        },
        
     
    });

});
