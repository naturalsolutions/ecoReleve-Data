define([
  'modules/objects/manager.view',
  './individual.model',
], function(ManagerView, IndividualModel) {

  'use strict';

  return ManagerView.extend({
  	model: new IndividualModel(),

  	toggleTab: function(e) {
  	  if(!$(e.currentTarget).hasClass('active')){
  	    this.$el.find('.tab-ele').each(function(){
  	      $(this).toggleClass('active');
  	    })
  	    if($(e.currentTarget).attr('id') === 'unidentified'){
  	    	this.model.set('objectType', 2);
  	    } else {
  	    	this.model.set('objectType', 1);
  	    }
				this.onShow();
  	  }
  	},
  });
});
