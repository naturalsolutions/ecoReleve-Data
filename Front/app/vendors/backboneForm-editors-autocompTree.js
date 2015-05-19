define([
	'underscore',
	'jquery',
	'backbone',
	'backbone_forms',
	'autocompTree',
	'config',
], function(
	_, $, Backbone, Form, autocompTree, config
){
	'use strict';
	return Form.editors.AutocompTreeEditor = Form.editors.Base.extend({


		previousValue: '',

		events: {
			'hide': "hasChanged"
		},

		hasChanged: function(currentValue) {
			if (currentValue !== this.previousValue){
				this.previousValue = currentValue;
				this.trigger('change', this);
			}
		},

		initialize: function(options) {
			console.log(this) ;
			console.log(options);
			Form.editors.Base.prototype.initialize.call(this, options);
			this.template = options.template || this.constructor.template;
			this.id = options.id;
			var tplValeurs = {
				inputID: this.id
			}
			this.template = _.template(this.template,tplValeurs) ;
			this.startId = options.startId;
			this.startId = 2887345;
			console.log(this.startId);
		},

		getValue: function() {
			var date= new Date
			return this.$el.find('#' + this.id ).val() ;
		},

		render: function(){

			var $el = $(this.template);
			this.setElement($el);


			var _this= this;


			_(function() {
				_this.$el.find('#' + _this.id ).autocompTree({
					wsUrl: config.serverUrl+'/ThesaurusREADServices.svc/json',
					webservices: 'fastInitForCompleteTree',  
					language: {hasLanguage:true, lng:"en"},
					display: {
						isDisplayDifferent: true,
						suffixeId: '_value',
						displayValueName: 'value',
						storedValueName: 'fullpathTranslated'
					},
					startId: _this.startId
				});
			}).defer();

			return this;
		},

	},{
		template: '<div><input id="<%=inputID%>" name="<%=inputID%>" class="form-control autocompTree" type="text" placeholder="" ></div>',
	});


});
