//radio
define([
	'jquery',
	'underscore',
	'backbone',
	'marionette',

	'ns_stepper/lyt-step',

], function($, _, Backbone, Marionette, Step) {

	'use strict';

	 return Step.extend({
		/*===================================================
		=            Layout Stepper Orchestrator            =
		===================================================*/
		events:{
			'click .manual-tile' : 'selectMode'
		},


		datachanged_radio: function(e){
			var target= $(e.target);
			var val=$(target).attr('value');
			this.updateModel(val);
		},
		selectMode : function(e){
			console.log('passed');
			$('div.manual-tile').removeClass('select');
			var radioSelection =  $(e.target).hasClass('radio-select');
			if (radioSelection){
				$(e.target).addClass('select');
				$('input[name="stationtype"]').each(function() {
					$(this).removeAttr('checked').prop('checked',false);
				});
				var radioElements = $(e.target).find('input[type="radio"]');
				var radio =  $(radioElements)[0];
				$(radio).attr('checked','checked').prop('checked',true);
				var val = $(radio).attr('value');
				this.updateModel(val);
			}
		}, 
		updateModel : function(value){
			console.log('Change Model')
			this.model.set('start_stationtype' , value);
			for(var key in this.model.attributes) {
				if(key != 'start_stationtype'){
					this.model.set(key,null);
				}
			}
		},

	});
});
