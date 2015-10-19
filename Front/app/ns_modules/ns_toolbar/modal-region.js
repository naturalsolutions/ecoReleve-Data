define([
	'jquery',
	'underscore',
	'backbone',
	'marionette',
	'sweetAlert',
	'translater',
], function($, _, Backbone, Marionette, Swal, Translater){

	'use strict';

return Backbone.Marionette.Region.extend({
		el: "#newElement",

		constructor: function(){
			//_.bindAll(this);
			Backbone.Marionette.Region.prototype.constructor.apply(this, arguments);
			this.on("view:show", this.showModal, this);
		},

		getEl: function(selector){
			var $el = $(selector);
			$el.on("hidden", this.close);
			return $el;
		},

		showModal: function(view){
			view.on("close", this.hideModal, this);
			this.$el.modal('show');
		},

		hideModal: function(){
			this.empty();
			//this.$el.modal('hide');
		}
 });
});
